import { useState, useEffect } from "react";
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
import { uploadCurriculo, saveCurriculoReferenceBanco } from "@/lib/curriculoService";
import { validateAndProcessFile } from "@/lib/utils";
import { User, Mail, Phone, MapPin, GraduationCap, Briefcase, Star, Upload, FileText, X } from "lucide-react";

interface EditCandidatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidato: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  curriculo: {
    id: string;
    area_atuacao?: string;
    experiencia_anos?: number;
    formacao?: string;
    localizacao?: string;
    disponibilidade: 'disponivel' | 'empregado' | 'indisponivel';
    avaliacao?: number;
    observacoes?: string;
    linkedin_url?: string;
    portfolio_url?: string;
  };
}

interface CandidatoData {
  nome: string;
  email: string;
  telefone: string;
}

interface CurriculoData {
  area_atuacao: string;
  experiencia_anos: number;
  formacao: string;
  localizacao: string;
  disponibilidade: 'disponivel' | 'empregado' | 'indisponivel';
  avaliacao: number | null;
  observacoes: string;
  linkedin_url: string;
  portfolio_url: string;
}

export function EditCandidatoModal({ isOpen, onClose, onSuccess, candidato, curriculo }: EditCandidatoModalProps) {
  const [formData, setFormData] = useState<CandidatoData>({
    nome: "",
    email: "",
    telefone: ""
  });
  
  const [curriculoData, setCurriculoData] = useState<CurriculoData>({
    area_atuacao: "",
    experiencia_anos: 0,
    formacao: "",
    localizacao: "",
    disponibilidade: 'disponivel',
    avaliacao: 1,
    observacoes: "",
    linkedin_url: "",
    portfolio_url: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CandidatoData & CurriculoData>>({});
  const [curriculoFile, setCurriculoFile] = useState<File | null>(null);
  const [curriculoFileName, setCurriculoFileName] = useState<string>("");
  const { toast } = useToast();

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (isOpen && candidato && curriculo) {
      setFormData({
        nome: candidato.nome || "",
        email: candidato.email || "",
        telefone: candidato.telefone || ""
      });
      
      setCurriculoData({
        area_atuacao: curriculo.area_atuacao || "",
        experiencia_anos: curriculo.experiencia_anos || 0,
        formacao: curriculo.formacao || "",
        localizacao: curriculo.localizacao || "",
        disponibilidade: curriculo.disponibilidade || 'disponivel',
        avaliacao: curriculo.avaliacao || 1,
        observacoes: curriculo.observacoes || "",
        linkedin_url: curriculo.linkedin_url || "",
        portfolio_url: curriculo.portfolio_url || ""
      });
    }
  }, [isOpen, candidato, curriculo]);

  const handleInputChange = (field: keyof CandidatoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCurriculoChange = (field: keyof CurriculoData, value: string | number | null) => {
    setCurriculoData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Função para lidar com upload de currículo
  const handleCurriculoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar e processar o arquivo
      const validation = validateAndProcessFile(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        requireSanitization: true
      });

      if (!validation.isValid) {
        toast({
          title: "Erro na validação do arquivo",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      const processedFile = validation.processedFile!;
      setCurriculoFile(processedFile);
      setCurriculoFileName(processedFile.name);
    }
  };

  // Função para remover currículo selecionado
  const handleRemoveCurriculo = () => {
    setCurriculoFile(null);
    setCurriculoFileName("");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CandidatoData & CurriculoData> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail deve ser válido";
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    }

    if (!curriculoData.area_atuacao.trim()) {
      newErrors.area_atuacao = "Área de atuação é obrigatória";
    }

    if (curriculoData.experiencia_anos < 0) {
      newErrors.experiencia_anos = "Experiência deve ser um número positivo";
    }

    if (curriculoData.avaliacao !== null && (curriculoData.avaliacao < 1 || curriculoData.avaliacao > 5)) {
      newErrors.avaliacao = "Avaliação deve ser entre 1 e 5";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Atualizar dados do candidato
      const { error: candidatoError } = await supabase
        .from('candidatos')
        .update({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone
        })
        .eq('id', candidato.id);

      if (candidatoError) {
        console.error('Erro ao atualizar candidato:', candidatoError);
        throw candidatoError;
      }

      // Se há um novo currículo para upload
      if (curriculoFile) {
        // Fazer upload do novo arquivo
        const uploadResult = await uploadCurriculo(curriculoFile, candidato.id, curriculo.id);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Erro no upload do currículo');
        }

        // Atualizar referência do currículo no banco
        const saveResult = await saveCurriculoReferenceBanco(
          candidato.id,
          curriculo.id,
          curriculoFile.name,
          uploadResult.filePath!,
          curriculoFile.size,
          curriculoFile.type
        );

        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Erro ao salvar referência do currículo');
        }
      }

      // Atualizar dados do currículo
      const { error: curriculoError } = await supabase
        .from('banco_curriculos')
        .update({
          area_atuacao: curriculoData.area_atuacao,
          experiencia_anos: curriculoData.experiencia_anos,
          formacao: curriculoData.formacao,
          localizacao: curriculoData.localizacao,
          disponibilidade: curriculoData.disponibilidade,
          avaliacao: curriculoData.avaliacao,
          observacoes: curriculoData.observacoes,
          linkedin_url: curriculoData.linkedin_url,
          portfolio_url: curriculoData.portfolio_url,
          ...(curriculoFile && {
            nome_arquivo: curriculoFile.name,
            tamanho_bytes: curriculoFile.size,
            tipo_arquivo: curriculoFile.type
          })
        })
        .eq('id', curriculo.id);

      if (curriculoError) {
        console.error('Erro ao atualizar currículo:', curriculoError);
        throw curriculoError;
      }

      toast({
        title: "Sucesso",
        description: "Candidato atualizado com sucesso"
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Erro ao atualizar candidato:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao atualizar candidato",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: ""
    });
    setCurriculoData({
      area_atuacao: "",
      experiencia_anos: 0,
      formacao: "",
      localizacao: "",
      disponibilidade: 'disponivel',
      avaliacao: null,
      observacoes: "",
      linkedin_url: "",
      portfolio_url: ""
    });
    setCurriculoFile(null);
    setCurriculoFileName("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Editar Candidato - {candidato?.nome}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Candidato */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informações do Candidato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome *
                </Label>
                <Input
                  id="nome"
                  placeholder="Nome completo"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className={errors.nome ? "border-destructive" : ""}
                />
                {errors.nome && (
                  <p className="text-sm text-destructive">{errors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone *
                </Label>
                <Input
                  id="telefone"
                  placeholder="(XX) XXXXX-XXXX"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  className={errors.telefone ? "border-destructive" : ""}
                />
                {errors.telefone && (
                  <p className="text-sm text-destructive">{errors.telefone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Informações do Currículo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informações do Currículo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area_atuacao" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Área de Atuação *
                </Label>
                <Input
                  id="area_atuacao"
                  placeholder="Ex: Desenvolvimento, Marketing"
                  value={curriculoData.area_atuacao}
                  onChange={(e) => handleCurriculoChange("area_atuacao", e.target.value)}
                  className={errors.area_atuacao ? "border-destructive" : ""}
                />
                {errors.area_atuacao && (
                  <p className="text-sm text-destructive">{errors.area_atuacao}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experiencia_anos" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Anos de Experiência
                </Label>
                <Input
                  id="experiencia_anos"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={curriculoData.experiencia_anos}
                  onChange={(e) => handleCurriculoChange("experiencia_anos", parseInt(e.target.value) || 0)}
                  className={errors.experiencia_anos ? "border-destructive" : ""}
                />
                {errors.experiencia_anos && (
                  <p className="text-sm text-destructive">{errors.experiencia_anos}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="formacao" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Formação
                </Label>
                <Input
                  id="formacao"
                  placeholder="Ex: Bacharel em Ciência da Computação"
                  value={curriculoData.formacao}
                  onChange={(e) => handleCurriculoChange("formacao", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </Label>
                <Input
                  id="localizacao"
                  placeholder="Ex: São Paulo, SP"
                  value={curriculoData.localizacao}
                  onChange={(e) => handleCurriculoChange("localizacao", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disponibilidade" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Disponibilidade
                </Label>
                <Select
                  value={curriculoData.disponibilidade}
                  onValueChange={(value: 'disponivel' | 'empregado' | 'indisponivel') => 
                    handleCurriculoChange("disponibilidade", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="empregado">Empregado</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avaliacao" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Avaliação (1-5)
                </Label>
                <Input
                  id="avaliacao"
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  placeholder="1"
                  value={curriculoData.avaliacao || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    handleCurriculoChange("avaliacao", isNaN(value) ? null : value);
                  }}
                  className={errors.avaliacao ? "border-destructive" : ""}
                />
                {errors.avaliacao && (
                  <p className="text-sm text-destructive">{errors.avaliacao}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Upload de Currículo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Atualizar Currículo
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {curriculoFileName ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{curriculoFileName}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCurriculo}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Clique para selecionar um novo currículo
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF ou Word (máx. 10MB)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCurriculoUpload}
                        className="hidden"
                        id="curriculo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('curriculo-upload')?.click()}
                        className="mt-2"
                      >
                        Selecionar Arquivo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/usuario"
                  value={curriculoData.linkedin_url}
                  onChange={(e) => handleCurriculoChange("linkedin_url", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Portfolio URL</Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  placeholder="https://portfolio.com"
                  value={curriculoData.portfolio_url}
                  onChange={(e) => handleCurriculoChange("portfolio_url", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações sobre o candidato..."
                  value={curriculoData.observacoes}
                  onChange={(e) => handleCurriculoChange("observacoes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 