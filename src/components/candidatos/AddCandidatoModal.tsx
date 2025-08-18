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
import { uploadCurriculo, saveCurriculoReference } from "@/lib/curriculoService";
import { Upload, FileText, X } from "lucide-react";

interface AddCandidatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vagaId: string;
  vagaCargo: string;
}

interface CandidatoData {
  nome: string;
  email: string;
  telefone: string;
  observacoes?: string;
  status: "selecionando" | "curriculo_enviado" | "entrevista_agendada" | "entrevista_realizada" | "aprovado" | "reprovado" | "desistiu";
  curriculo?: File;
}

export function AddCandidatoModal({ isOpen, onClose, onSuccess, vagaId, vagaCargo }: AddCandidatoModalProps) {
  const [formData, setFormData] = useState<CandidatoData>({
    nome: "",
    email: "",
    telefone: "",
    observacoes: "",
    status: "selecionando"
  });
  const [loading, setLoading] = useState(false);
  const [curriculoFile, setCurriculoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Iniciando salvamento do candidato:', { formData, vagaId });
      
      // Primeiro, inserir o candidato
      const { data: candidatoData, error: candidatoError } = await supabase
        .from('candidatos')
        .insert({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone
        })
        .select()
        .single();

      if (candidatoError) {
        console.error('Erro ao inserir candidato:', candidatoError);
        throw candidatoError;
      }

      console.log('Candidato inserido:', candidatoData);

      // Depois, criar a relação candidato-vaga
      const { error: relacaoError } = await supabase
        .from('candidatos_vagas')
        .insert({
          candidato_id: candidatoData.id,
          vaga_id: vagaId,
          status_atual: formData.status,
          observacoes: formData.observacoes || null
        });

      if (relacaoError) {
        console.error('Erro ao criar relação candidato-vaga:', relacaoError);
        throw relacaoError;
      }

      // Se há um currículo, fazer upload
      if (curriculoFile) {
        const uploadResult = await uploadCurriculo(curriculoFile, candidatoData.id, vagaId);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Erro no upload do currículo');
        }

        // Salvar referência do currículo no banco
        const saveResult = await saveCurriculoReference(
          candidatoData.id,
          vagaId,
          curriculoFile.name,
          uploadResult.filePath!,
          curriculoFile.size,
          curriculoFile.type
        );

        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Erro ao salvar referência do currículo');
        }
      }

      console.log('Candidato e currículo salvos com sucesso');

      toast({
        title: "Candidato adicionado",
        description: `${formData.nome} foi adicionado à vaga ${vagaCargo}${curriculoFile ? ' com currículo' : ''}`,
      });

      setFormData({
        nome: "",
        email: "",
        telefone: "",
        observacoes: "",
        status: "selecionando"
      });
      setCurriculoFile(null);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar candidato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o candidato",
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

  const handleInputChange = (field: keyof CandidatoData, value: string) => {
    if (field === 'telefone') {
      const formattedValue = formatPhoneNumber(value);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Candidato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selecionando">Selecionando</SelectItem>
                  <SelectItem value="curriculo_enviado">CV Enviado</SelectItem>
                  <SelectItem value="entrevista_agendada">Entrevista Agendada</SelectItem>
                  <SelectItem value="entrevista_realizada">Entrevista Realizada</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="desistiu">Desistiu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>



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
              {loading ? "Adicionando..." : "Adicionar Candidato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 