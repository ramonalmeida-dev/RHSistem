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

interface AddVagaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vaga: VagaData) => void;
}

interface VagaData {
  numeroVaga: string;
  empresaId: number;
  contatoEnvioCv: string;
  email: string;
  celular: string;
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
  questionarioTecnico: string;
  observacoes: string;
  consultorId: number;
}

interface Cliente {
  id: number;
  razao_social: string;
}

interface Usuario {
  id: number;
  nome: string;
}

export function AddVagaModal({ isOpen, onClose, onSubmit }: AddVagaModalProps) {
  const [formData, setFormData] = useState<VagaData>({
    numeroVaga: "",
    empresaId: 0,
    contatoEnvioCv: "",
    email: "",
    celular: "",
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
    questionarioTecnico: "",
    observacoes: "",
    consultorId: 0,
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [errors, setErrors] = useState<Partial<VagaData>>({});

  // Carregar clientes e usuários
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar clientes
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id, razao_social')
          .eq('ativo', true)
          .order('razao_social');

        // Carregar usuários (consultores)
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id, nome')
          .eq('ativo', true)
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

  const handleInputChange = (field: keyof VagaData, value: string | number) => {
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

    if (!formData.empresaId || formData.empresaId === 0) {
      newErrors.empresaId = "Empresa é obrigatória";
    }

    if (!formData.contatoEnvioCv.trim()) {
      newErrors.contatoEnvioCv = "Contato é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail deve ser válido";
    }

    if (!formData.celular.trim()) {
      newErrors.celular = "Celular é obrigatório";
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

    if (!formData.dataFormatacaoPerfil) {
      newErrors.dataFormatacaoPerfil = "Data de formatação do perfil é obrigatória";
    }

    if (!formData.dataDivulgacao) {
      newErrors.dataDivulgacao = "Data de divulgação é obrigatória";
    }

    if (!formData.dataInicioSelecao) {
      newErrors.dataInicioSelecao = "Data de início da seleção é obrigatória";
    }

    if (!formData.dataEnvioCurriculos) {
      newErrors.dataEnvioCurriculos = "Data de envio dos currículos é obrigatória";
    }

    if (!formData.dataEncerramento) {
      newErrors.dataEncerramento = "Data de encerramento é obrigatória";
    }

    if (!formData.consultorId || formData.consultorId === 0) {
      newErrors.consultorId = "Consultor é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      numeroVaga: "",
      empresaId: 0,
      contatoEnvioCv: "",
      email: "",
      celular: "",
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
      questionarioTecnico: "",
      observacoes: "",
      consultorId: 0,
    });
    setErrors({});
    onClose();
  };

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Cadastrar Nova Vaga
          </DialogTitle>
          <DialogDescription>
            Preencha todas as informações da vaga para criar um novo processo de recrutamento e seleção.
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
                <Label htmlFor="contatoEnvioCv" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contato *
                </Label>
                <Input
                  id="contatoEnvioCv"
                  placeholder="Nome do contato"
                  value={formData.contatoEnvioCv}
                  onChange={(e) => handleInputChange("contatoEnvioCv", e.target.value)}
                  className={errors.contatoEnvioCv ? "border-destructive" : ""}
                />
                {errors.contatoEnvioCv && (
                  <p className="text-sm text-destructive">{errors.contatoEnvioCv}</p>
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
                  placeholder="contato@empresa.com.br"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="celular" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Celular *
                </Label>
                <Input
                  id="celular"
                  placeholder="(XX) XXXXX-XXXX"
                  value={formData.celular}
                  onChange={(e) => {
                    const formatted = formatCelular(e.target.value);
                    handleInputChange("celular", formatted);
                  }}
                  maxLength={15}
                  className={errors.celular ? "border-destructive" : ""}
                />
                {errors.celular && (
                  <p className="text-sm text-destructive">{errors.celular}</p>
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
                  placeholder="Ex: R$ 5.000 - R$ 8.000"
                  value={formData.salario}
                  onChange={(e) => handleInputChange("salario", e.target.value)}
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
                  Data de Formatação do Perfil *
                </Label>
                <Input
                  id="dataFormatacaoPerfil"
                  type="date"
                  value={formData.dataFormatacaoPerfil}
                  onChange={(e) => handleInputChange("dataFormatacaoPerfil", e.target.value)}
                  className={errors.dataFormatacaoPerfil ? "border-destructive" : ""}
                />
                {errors.dataFormatacaoPerfil && (
                  <p className="text-sm text-destructive">{errors.dataFormatacaoPerfil}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataDivulgacao" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Divulgação *
                </Label>
                <Input
                  id="dataDivulgacao"
                  type="date"
                  value={formData.dataDivulgacao}
                  onChange={(e) => handleInputChange("dataDivulgacao", e.target.value)}
                  className={errors.dataDivulgacao ? "border-destructive" : ""}
                />
                {errors.dataDivulgacao && (
                  <p className="text-sm text-destructive">{errors.dataDivulgacao}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicioSelecao" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Início da Seleção *
                </Label>
                <Input
                  id="dataInicioSelecao"
                  type="date"
                  value={formData.dataInicioSelecao}
                  onChange={(e) => handleInputChange("dataInicioSelecao", e.target.value)}
                  className={errors.dataInicioSelecao ? "border-destructive" : ""}
                />
                {errors.dataInicioSelecao && (
                  <p className="text-sm text-destructive">{errors.dataInicioSelecao}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataEnvioCurriculos" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Envio dos CVs *
                </Label>
                <Input
                  id="dataEnvioCurriculos"
                  type="date"
                  value={formData.dataEnvioCurriculos}
                  onChange={(e) => handleInputChange("dataEnvioCurriculos", e.target.value)}
                  className={errors.dataEnvioCurriculos ? "border-destructive" : ""}
                />
                {errors.dataEnvioCurriculos && (
                  <p className="text-sm text-destructive">{errors.dataEnvioCurriculos}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataEncerramento" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Encerramento *
                </Label>
                <Input
                  id="dataEncerramento"
                  type="date"
                  value={formData.dataEncerramento}
                  onChange={(e) => handleInputChange("dataEncerramento", e.target.value)}
                  className={errors.dataEncerramento ? "border-destructive" : ""}
                />
                {errors.dataEncerramento && (
                  <p className="text-sm text-destructive">{errors.dataEncerramento}</p>
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
                <Label htmlFor="questionarioTecnico" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Questionário Técnico
                </Label>
                <Textarea
                  id="questionarioTecnico"
                  placeholder="Questionário técnico para os candidatos"
                  value={formData.questionarioTecnico}
                  onChange={(e) => handleInputChange("questionarioTecnico", e.target.value)}
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
                  value={formData.consultorId ? formData.consultorId.toString() : ""}
                  onValueChange={(value) => handleInputChange("consultorId", parseInt(value))}
                >
                  <SelectTrigger className={errors.consultorId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione o consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id.toString()}>
                        {usuario.nome}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
            Cadastrar Vaga
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 