import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  FileText,
  DollarSign,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { QuestionarioDinamico } from "./QuestionarioDinamico";
import { PreviewQuestionario } from "./PreviewQuestionario";
import { PerguntaQuestionario } from "@/types";
import { QuestionarioService } from "@/lib/questionarioService";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";

interface EditVagaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vaga: VagaData) => void;
  vaga: Vaga | null;
}

interface VagaData {
  numeroVaga: string;
  empresaId: string;
  cargo: string;
  salario: string;
  localTrabalho: string;
  dataRecebimento: string;
  dataFormatacaoPerfil: string;
  dataDivulgacao: string;
  dataInicioSelecao: string;
  dataEnvioCurriculos: string;
  dataEncerramento: string;
  perfilWord: string;
  informacoesComplementares: string;
  observacoes: string;
  consultorId: string;
  perguntasQuestionario: PerguntaQuestionario[];
}

interface Vaga {
  id: string;
  numero_vaga: string;
  empresa_id: string;
  empresa?: {
    razao_social: string;
    cnpj: string;
  };
  contato_envio_cv: string;
  email: string;
  celular: string;
  cargo: string;
  salario: string;
  local_trabalho: string;
  data_recebimento: string;
  data_formatacao_perfil: string;
  data_divulgacao: string;
  data_inicio_selecao: string;
  data_envio_curriculos: string;
  data_encerramento: string;
  perfil_word?: string;
  informacoes_complementares?: string;
  questionario_tecnico?: string;
  observacoes?: string;
  consultor_id: string;
  consultor?: {
    nome: string;
    email: string;
  };
  status: "rascunho" | "publicada" | "em_analise" | "pausada" | "encerrada";
  substatus?: "hired" | "not_filled" | null;
  created_at: string;
  updated_at: string;
}

interface Cliente {
  id: string;
  razao_social: string;
}

interface Usuario {
  id: string;
  nome: string;
  tipo: 'admin' | 'consultor';
}

export function EditVagaModal({ isOpen, onClose, onSubmit, vaga }: EditVagaModalProps) {
  const [formData, setFormData] = useState<VagaData>({
    numeroVaga: "",
    empresaId: "",
    cargo: "",
    salario: "",
    localTrabalho: "",
    dataRecebimento: "",
    dataFormatacaoPerfil: "",
    dataDivulgacao: "",
    dataInicioSelecao: "",
    dataEnvioCurriculos: "",
    dataEncerramento: "",
    perfilWord: "",
    informacoesComplementares: "",
    observacoes: "",
    consultorId: "",
    perguntasQuestionario: [],
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [errors, setErrors] = useState<Partial<VagaData>>({});

  // Função para formatar valor monetário
  const formatarMoeda = (valor: string): string => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    if (numeros === '') return '';
    
    // Converte para número e formata
    const numero = parseInt(numeros);
    return numero.toLocaleString('pt-BR');
  };

  // Função para limpar formatação monetária
  const limparFormatacaoMoeda = (valor: string): string => {
    return valor.replace(/\D/g, '');
  };

  // Função para calcular data mínima baseada na data de recebimento
  const getDataMinima = (dataRecebimento: string): string => {
    if (!dataRecebimento) return '';
    return dataRecebimento;
  };

  // Função para validar se uma data é posterior à data de recebimento
  const validarDataPosterior = (data: string, dataRecebimento: string): boolean => {
    if (!data || !dataRecebimento) return true;
    return new Date(data) >= new Date(dataRecebimento);
  };

  // Carregar dados quando o modal abrir
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar clientes
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id, razao_social')
          .eq('ativo', true)
          .order('razao_social');

        // Carregar usuários (consultores e admins)
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id, nome, tipo')
          .eq('ativo', true)
          .in('tipo', ['consultor', 'admin'])
          .order('nome');

        setClientes(clientesData || []);
        setUsuarios(usuariosData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Preencher formulário quando vaga for selecionada
  useEffect(() => {
    const loadFormData = async () => {
      if (vaga) {
        // Carregar questionário existente se houver
        let perguntasQuestionario: PerguntaQuestionario[] = [];
        try {
          const questionarioExistente = await QuestionarioService.buscarQuestionarioPorVaga(vaga.id);
          if (questionarioExistente) {
            perguntasQuestionario = questionarioExistente.perguntas;
          }
        } catch (error) {
          console.error('Erro ao carregar questionário:', error);
        }

        setFormData({
          numeroVaga: vaga.numero_vaga,
          empresaId: vaga.empresa_id,
          cargo: vaga.cargo,
          salario: formatarMoeda(vaga.salario),
          localTrabalho: vaga.local_trabalho,
          dataRecebimento: vaga.data_recebimento,
          dataFormatacaoPerfil: vaga.data_formatacao_perfil,
          dataDivulgacao: vaga.data_divulgacao,
          dataInicioSelecao: vaga.data_inicio_selecao,
          dataEnvioCurriculos: vaga.data_envio_curriculos,
          dataEncerramento: vaga.data_encerramento,
          perfilWord: vaga.perfil_word || "",
          informacoesComplementares: vaga.informacoes_complementares || "",
          observacoes: vaga.observacoes || "",
          consultorId: vaga.consultor_id,
          perguntasQuestionario,
        });
      }
    };

    loadFormData();
  }, [vaga]);

  const handleInputChange = (field: keyof VagaData, value: string | number | PerguntaQuestionario[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VagaData> = {};

    if (!formData.numeroVaga.trim()) {
      newErrors.numeroVaga = "Número da vaga é obrigatório";
    }

    if (!formData.empresaId || formData.empresaId === "") {
      newErrors.empresaId = "Empresa é obrigatória" as any;
    }

    if (!formData.cargo.trim()) {
      newErrors.cargo = "Cargo é obrigatório";
    }

    if (!formData.salario.trim()) {
      newErrors.salario = "Salário é obrigatório";
    }

    if (!formData.localTrabalho.trim()) {
      newErrors.localTrabalho = "Local de trabalho é obrigatório";
    }

    if (!formData.dataRecebimento) {
      newErrors.dataRecebimento = "Data de recebimento é obrigatória";
    }

    if (!formData.consultorId || formData.consultorId === "") {
      newErrors.consultorId = "Consultor é obrigatório" as any;
    }

    // Validar questionário se houver perguntas
    if (formData.perguntasQuestionario.length > 0) {
      const { valid, errors } = QuestionarioService.validarPerguntas(formData.perguntasQuestionario);
      if (!valid) {
        toast.error("Questionário inválido", {
          description: errors.join('\n')
        });
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        // Salvar questionário se houver perguntas
        if (formData.perguntasQuestionario.length > 0 && vaga) {
          await QuestionarioService.salvarQuestionarioVaga(
            vaga.id,
            formData.perguntasQuestionario,
            'Questionário da Vaga'
          );
          toast.success('Questionário salvo com sucesso!');
        }
        
        onSubmit(formData);
        handleClose();
      } catch (error) {
        console.error('Erro ao salvar questionário:', error);
        toast.error('Erro ao salvar questionário: ' + (error as Error).message);
      }
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };



  if (!vaga) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Editar Vaga - {vaga.numero_vaga}
          </DialogTitle>
          <DialogDescription>
            Edite as informações da vaga para atualizar o processo de recrutamento e seleção.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroVaga" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Número da Vaga *
                </Label>
                <Input
                  id="numeroVaga"
                  placeholder="Ex: DEV-001, MKT-002"
                  value={formData.numeroVaga}
                  onChange={(e) => handleInputChange("numeroVaga", e.target.value)}
                  className={errors.numeroVaga ? "border-destructive" : ""}
                />
                {errors.numeroVaga && (
                  <p className="text-sm text-destructive">{errors.numeroVaga}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresaId" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa *
                </Label>
                <Select
                  value={formData.empresaId ? formData.empresaId.toString() : ""}
                  onValueChange={(value) => handleInputChange("empresaId", parseInt(value))}
                >
                  <SelectTrigger className={errors.empresaId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.empresaId && (
                  <p className="text-sm text-destructive">{errors.empresaId}</p>
                )}
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Cargo *
                </Label>
                <Input
                  id="cargo"
                  placeholder="Ex: Desenvolvedor Senior"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange("cargo", e.target.value)}
                  className={errors.cargo ? "border-destructive" : ""}
                />
                {errors.cargo && (
                  <p className="text-sm text-destructive">{errors.cargo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salario" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Salário *
                </Label>
                <Input
                  id="salario"
                  placeholder="Ex: 10.000"
                  value={formData.salario}
                  onChange={(e) => {
                    const valorFormatado = formatarMoeda(e.target.value);
                    handleInputChange("salario", valorFormatado);
                  }}
                  className={errors.salario ? "border-destructive" : ""}
                />
                {errors.salario && (
                  <p className="text-sm text-destructive">{errors.salario}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="localTrabalho" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local de Trabalho *
                </Label>
                <Input
                  id="localTrabalho"
                  placeholder="Ex: São Paulo, SP - Híbrido"
                  value={formData.localTrabalho}
                  onChange={(e) => handleInputChange("localTrabalho", e.target.value)}
                  className={errors.localTrabalho ? "border-destructive" : ""}
                />
                {errors.localTrabalho && (
                  <p className="text-sm text-destructive">{errors.localTrabalho}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cronograma */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Cronograma do Processo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataRecebimento" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Recebimento *
                </Label>
                <Input
                  id="dataRecebimento"
                  type="date"
                  value={formData.dataRecebimento}
                  onChange={(e) => handleInputChange("dataRecebimento", e.target.value)}
                  className={errors.dataRecebimento ? "border-destructive" : ""}
                />
                {errors.dataRecebimento && (
                  <p className="text-sm text-destructive">{errors.dataRecebimento}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFormatacaoPerfil" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Formatação do Perfil
                </Label>
                <Input
                  id="dataFormatacaoPerfil"
                  type="date"
                  min={getDataMinima(formData.dataRecebimento)}
                  value={formData.dataFormatacaoPerfil}
                  onChange={(e) => handleInputChange("dataFormatacaoPerfil", e.target.value)}
                  className={formData.dataFormatacaoPerfil && !validarDataPosterior(formData.dataFormatacaoPerfil, formData.dataRecebimento) ? "border-destructive" : ""}
                />
                {formData.dataFormatacaoPerfil && !validarDataPosterior(formData.dataFormatacaoPerfil, formData.dataRecebimento) && (
                  <p className="text-sm text-destructive">Data deve ser igual ou posterior à data de recebimento</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataDivulgacao" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Divulgação
                </Label>
                <Input
                  id="dataDivulgacao"
                  type="date"
                  min={getDataMinima(formData.dataRecebimento)}
                  value={formData.dataDivulgacao}
                  onChange={(e) => handleInputChange("dataDivulgacao", e.target.value)}
                  className={formData.dataDivulgacao && !validarDataPosterior(formData.dataDivulgacao, formData.dataRecebimento) ? "border-destructive" : ""}
                />
                {formData.dataDivulgacao && !validarDataPosterior(formData.dataDivulgacao, formData.dataRecebimento) && (
                  <p className="text-sm text-destructive">Data deve ser igual ou posterior à data de recebimento</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicioSelecao" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Início da Seleção
                </Label>
                <Input
                  id="dataInicioSelecao"
                  type="date"
                  min={getDataMinima(formData.dataRecebimento)}
                  value={formData.dataInicioSelecao}
                  onChange={(e) => handleInputChange("dataInicioSelecao", e.target.value)}
                  className={formData.dataInicioSelecao && !validarDataPosterior(formData.dataInicioSelecao, formData.dataRecebimento) ? "border-destructive" : ""}
                />
                {formData.dataInicioSelecao && !validarDataPosterior(formData.dataInicioSelecao, formData.dataRecebimento) && (
                  <p className="text-sm text-destructive">Data deve ser igual ou posterior à data de recebimento</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataEnvioCurriculos" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Envio dos CVs
                </Label>
                <Input
                  id="dataEnvioCurriculos"
                  type="date"
                  min={getDataMinima(formData.dataRecebimento)}
                  value={formData.dataEnvioCurriculos}
                  onChange={(e) => handleInputChange("dataEnvioCurriculos", e.target.value)}
                  className={formData.dataEnvioCurriculos && !validarDataPosterior(formData.dataEnvioCurriculos, formData.dataRecebimento) ? "border-destructive" : ""}
                />
                {formData.dataEnvioCurriculos && !validarDataPosterior(formData.dataEnvioCurriculos, formData.dataRecebimento) && (
                  <p className="text-sm text-destructive">Data deve ser igual ou posterior à data de recebimento</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataEncerramento" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Encerramento
                </Label>
                <Input
                  id="dataEncerramento"
                  type="date"
                  min={getDataMinima(formData.dataRecebimento)}
                  value={formData.dataEncerramento}
                  onChange={(e) => handleInputChange("dataEncerramento", e.target.value)}
                  className={formData.dataEncerramento && !validarDataPosterior(formData.dataEncerramento, formData.dataRecebimento) ? "border-destructive" : ""}
                />
                {formData.dataEncerramento && !validarDataPosterior(formData.dataEncerramento, formData.dataRecebimento) && (
                  <p className="text-sm text-destructive">Data deve ser igual ou posterior à data de recebimento</p>
                )}
              </div>
            </div>
          </div>

          {/* Documentos e Informações */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Documentos e Informações</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perfilWord" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Perfil da Posição (Word)
                </Label>
                <Textarea
                  id="perfilWord"
                  placeholder="Cole aqui o perfil da posição formatado em Word para divulgação"
                  value={formData.perfilWord}
                  onChange={(e) => handleInputChange("perfilWord", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="informacoesComplementares" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Informações Complementares ao Perfil
                </Label>
                <Textarea
                  id="informacoesComplementares"
                  placeholder="Informações complementares para seleção"
                  value={formData.informacoesComplementares}
                  onChange={(e) => handleInputChange("informacoesComplementares", e.target.value)}
                  rows={3}
                />
              </div>



              <div className="space-y-2">
                <Label htmlFor="observacoes" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Observações Importantes
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações importantes sobre a vaga ou processo"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Configurações da Vaga */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Configurações da Vaga</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultorId" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Consultor Responsável *
                </Label>
                <Select
                  value={formData.consultorId}
                  onValueChange={(value) => {
                    handleInputChange("consultorId", value);
                  }}
                >
                  <SelectTrigger className={errors.consultorId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione o consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome} ({usuario.tipo === 'admin' ? 'Administrador' : 'Consultor'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.consultorId && (
                  <p className="text-sm text-destructive">{errors.consultorId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Questionário Dinâmico */}
          <div className="space-y-4">
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Editor de Perguntas
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Prévia ({formData.perguntasQuestionario.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="mt-4">
                <QuestionarioDinamico
                  perguntas={formData.perguntasQuestionario}
                  onChange={(perguntas) => handleInputChange("perguntasQuestionario", perguntas)}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <PreviewQuestionario 
                  perguntas={formData.perguntasQuestionario}
                  titulo="Questionário da Vaga"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Resumo do Questionário */}
          {formData.perguntasQuestionario.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Resumo do Questionário</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {formData.perguntasQuestionario.length} pergunta(s) adicionada(s)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formData.perguntasQuestionario.filter(p => p.obrigatoria).length} obrigatória(s)
                  </span>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                  {QuestionarioService.gerarPreviewPerguntas(formData.perguntasQuestionario)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
            Atualizar Vaga
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 