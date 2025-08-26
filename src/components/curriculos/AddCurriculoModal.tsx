import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { sanitizeFilename } from "@/lib/utils";
import { Upload, FileText, X } from "lucide-react";

interface AddCurriculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CurriculoData {
  nome: string;
  email: string;
  telefone: string;
  area_atuacao: string;
  experiencia_anos: number;
  formacao: string;
  localizacao: string;
  disponibilidade: 'disponivel' | 'empregado' | 'indisponivel';
  avaliacao: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  curriculo?: File;
}

export function AddCurriculoModal({ isOpen, onClose, onSuccess }: AddCurriculoModalProps) {
  const [formData, setFormData] = useState<CurriculoData>({
    nome: "",
    email: "",
    telefone: "",
    area_atuacao: "",
    experiencia_anos: 0,
    formacao: "",
    localizacao: "",
    disponibilidade: "disponivel",
    avaliacao: 0,
    observacoes: "",
    linkedin_url: "",
    portfolio_url: ""
  });
  const [loading, setLoading] = useState(false);
  const [curriculoFile, setCurriculoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Se há um currículo, fazer upload primeiro
      let url_storage = "";
      if (curriculoFile) {
        // Sanitizar o nome do arquivo para evitar problemas com caracteres especiais
        const sanitizedName = sanitizeFilename(curriculoFile.name);
        const fileName = `${Date.now()}_${sanitizedName}`;
        const filePath = `banco_curriculos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('curriculos')
          .upload(filePath, curriculoFile);

        if (uploadError) {
          console.error('Erro no upload do currículo:', uploadError);
          throw new Error('Erro no upload do currículo');
        }

        url_storage = filePath;
      }

      // Usar função RPC para adicionar currículo
      const { data: resultado, error: rpcError } = await supabase
        .rpc('adicionar_curriculo_manual', {
          p_nome: formData.nome,
          p_email: formData.email,
          p_telefone: formData.telefone,
          p_area_atuacao: formData.area_atuacao || null,
          p_experiencia_anos: formData.experiencia_anos,
          p_formacao: formData.formacao || null,
          p_localizacao: formData.localizacao || null,
          p_disponibilidade: formData.disponibilidade,
          p_avaliacao: formData.avaliacao,
          p_observacoes: formData.observacoes || null,
          p_linkedin_url: formData.linkedin_url || null,
          p_portfolio_url: formData.portfolio_url || null,
          p_nome_arquivo: curriculoFile?.name || null,
          p_url_storage: url_storage || null,
          p_tamanho_bytes: curriculoFile?.size || 0,
          p_tipo_arquivo: curriculoFile?.type || null
        });

      if (rpcError) {
        console.error('Erro na função RPC:', rpcError);
        throw rpcError;
      }

      if (!resultado || !resultado.success) {
        throw new Error(resultado?.error || 'Erro desconhecido');
      }

      toast({
        title: "Currículo adicionado",
        description: `${formData.nome} foi adicionado ao banco de currículos${curriculoFile ? ' com arquivo' : ''}`,
      });

      // Reset form
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        area_atuacao: "",
        experiencia_anos: 0,
        formacao: "",
        localizacao: "",
        disponibilidade: "disponivel",
        avaliacao: 0,
        observacoes: "",
        linkedin_url: "",
        portfolio_url: ""
      });
      setCurriculoFile(null);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar currículo:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível adicionar o currículo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleInputChange = (field: keyof CurriculoData, value: string | number) => {
    if (field === 'telefone') {
      const formattedValue = formatPhoneNumber(value as string);
      setFormData(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Por favor, selecione um arquivo PDF ou Word",
          variant: "destructive",
        });
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setCurriculoFile(file);
    }
  };

  const removeFile = () => {
    setCurriculoFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Currículo ao Banco</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Pessoais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => handleInputChange('localizacao', e.target.value)}
                  placeholder="Cidade, Estado"
                />
              </div>
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Profissionais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area_atuacao">Área de Atuação *</Label>
                <Select value={formData.area_atuacao} onValueChange={(value) => handleInputChange('area_atuacao', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="rh">Recursos Humanos</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experiencia_anos">Anos de Experiência</Label>
                <Input
                  id="experiencia_anos"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experiencia_anos}
                  onChange={(e) => handleInputChange('experiencia_anos', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formacao">Formação</Label>
              <Input
                id="formacao"
                value={formData.formacao}
                onChange={(e) => handleInputChange('formacao', e.target.value)}
                placeholder="Ex: Ciência da Computação, Administração..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disponibilidade">Disponibilidade</Label>
                <Select value={formData.disponibilidade} onValueChange={(value) => handleInputChange('disponibilidade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disponibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="empregado">Empregado</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avaliacao">Avaliação (1-5)</Label>
                <Select value={formData.avaliacao.toString()} onValueChange={(value) => handleInputChange('avaliacao', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a avaliação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Não avaliado</SelectItem>
                    <SelectItem value="1">1 - Ruim</SelectItem>
                    <SelectItem value="2">2 - Regular</SelectItem>
                    <SelectItem value="3">3 - Bom</SelectItem>
                    <SelectItem value="4">4 - Muito Bom</SelectItem>
                    <SelectItem value="5">5 - Excelente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Portfolio</Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                  placeholder="https://portfolio.com"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações sobre o candidato..."
              rows={3}
            />
          </div>

          {/* Upload do Currículo */}
          <div className="space-y-2">
            <Label htmlFor="curriculo">Currículo (PDF ou Word)</Label>
            {!curriculoFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="curriculo"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="curriculo" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Clique para selecionar
                    </span> ou arraste e solte
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    PDF, DOC ou DOCX (máximo 5MB)
                  </div>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="font-medium text-sm">{curriculoFile.name}</div>
                      <div className="text-xs text-gray-500">
                        {(curriculoFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar ao Banco"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 