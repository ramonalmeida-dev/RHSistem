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
import { Building2, Mail, Phone, MapPin, Calendar, User, FileText, Search, Loader2 } from "lucide-react";
import { CNPJService, CNPJData } from "@/lib/cnpjService";
import { useToast } from "@/hooks/use-toast";

interface EditClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cliente: ClienteData) => void;
  cliente: Cliente | null;
}

interface Cliente {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  // Novos campos de endereço
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
}

interface ClienteData {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoEstadual: string;
  prazoPagamento: string;
  contato: string;
  celular: string;
  email: string;
  // Campos de endereço detalhados
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export function EditClienteModal({ isOpen, onClose, onSubmit, cliente }: EditClienteModalProps) {
  const [formData, setFormData] = useState<ClienteData>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    inscricaoEstadual: "",
    prazoPagamento: "",
    contato: "",
    celular: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [errors, setErrors] = useState<Partial<ClienteData>>({});
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const { toast } = useToast();

  // Carregar dados do cliente quando o modal abrir
  useEffect(() => {
    if (cliente) {
      setFormData({
        razaoSocial: cliente.razao_social || "",
        nomeFantasia: cliente.nome_fantasia || "",
        cnpj: cliente.cnpj || "",
        inscricaoEstadual: cliente.inscricao_estadual || "",
        prazoPagamento: cliente.prazo_pagamento || "",
        contato: cliente.contato || "",
        celular: cliente.celular || "",
        email: cliente.email || "",
        cep: cliente.cep || "",
        logradouro: cliente.logradouro || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
      });
    }
  }, [cliente]);

  const handleInputChange = (field: keyof ClienteData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const buscarCNPJ = async () => {
    if (!formData.cnpj || formData.cnpj.replace(/[^\d]/g, '').length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingCNPJ(true);
    try {
      const cnpjData = await CNPJService.buscarCNPJ(formData.cnpj);
      
      // Preencher automaticamente os campos com os dados da API
      setFormData(prev => ({
        ...prev,
        razaoSocial: cnpjData.razao_social,
        nomeFantasia: cnpjData.nome_fantasia || "",
        cep: cnpjData.cep,
        logradouro: cnpjData.logradouro,
        numero: cnpjData.numero,
        complemento: cnpjData.complemento || "",
        bairro: cnpjData.bairro,
        cidade: cnpjData.cidade,
        estado: cnpjData.estado,
        email: cnpjData.email || "",
        celular: cnpjData.telefone || "",
      }));

      toast({
        title: "CNPJ encontrado!",
        description: `Dados de ${cnpjData.razao_social} preenchidos automaticamente`,
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CNPJ",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClienteData> = {};

    if (!formData.razaoSocial.trim()) {
      newErrors.razaoSocial = "Razão social é obrigatória";
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX";
    }

    // Validações de endereço
    if (!formData.cep.trim()) {
      newErrors.cep = "CEP é obrigatório";
    }

    if (!formData.logradouro.trim()) {
      newErrors.logradouro = "Logradouro é obrigatório";
    }

    if (!formData.numero.trim()) {
      newErrors.numero = "Número é obrigatório";
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = "Bairro é obrigatório";
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = "Cidade é obrigatória";
    }

    if (!formData.estado.trim()) {
      newErrors.estado = "Estado é obrigatório";
    }

    // Validações de contato
    if (formData.celular.trim() && !/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.celular)) {
      newErrors.celular = "Celular deve estar no formato (XX) XXXXX-XXXX";
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail deve ser válido";
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
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      inscricaoEstadual: "",
      prazoPagamento: "",
      contato: "",
      celular: "",
      email: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
    });
    setErrors({});
    onClose();
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Editar Cliente
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do cliente {cliente.razao_social}. Use a busca por CNPJ para atualizar os dados da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* CNPJ com busca automática */}
          <div className="space-y-2">
            <Label htmlFor="cnpj" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CNPJ *
            </Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                placeholder="XX.XXX.XXX/XXXX-XX"
                value={formData.cnpj}
                onChange={(e) => {
                  const formatted = formatCNPJ(e.target.value);
                  handleInputChange("cnpj", formatted);
                }}
                maxLength={18}
                className={errors.cnpj ? "border-destructive" : ""}
              />
              <Button
                type="button"
                onClick={buscarCNPJ}
                disabled={isLoadingCNPJ || !formData.cnpj}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isLoadingCNPJ ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar
              </Button>
            </div>
            {errors.cnpj && (
              <p className="text-sm text-destructive">{errors.cnpj}</p>
            )}
          </div>

          {/* Razão Social e Nome Fantasia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razaoSocial" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Razão Social *
              </Label>
              <Input
                id="razaoSocial"
                placeholder="Digite a razão social da empresa"
                value={formData.razaoSocial}
                onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                className={errors.razaoSocial ? "border-destructive" : ""}
              />
              {errors.razaoSocial && (
                <p className="text-sm text-destructive">{errors.razaoSocial}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeFantasia" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Nome Fantasia
              </Label>
              <Input
                id="nomeFantasia"
                placeholder="Digite o nome fantasia"
                value={formData.nomeFantasia}
                onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
              />
            </div>
          </div>

          {/* Endereço - CEP e Logradouro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                CEP *
              </Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => {
                  const formatted = formatCEP(e.target.value);
                  handleInputChange("cep", formatted);
                }}
                maxLength={9}
                className={errors.cep ? "border-destructive" : ""}
              />
              {errors.cep && (
                <p className="text-sm text-destructive">{errors.cep}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="logradouro" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Logradouro *
              </Label>
              <Input
                id="logradouro"
                placeholder="Nome da rua, avenida, etc."
                value={formData.logradouro}
                onChange={(e) => handleInputChange("logradouro", e.target.value)}
                className={errors.logradouro ? "border-destructive" : ""}
              />
              {errors.logradouro && (
                <p className="text-sm text-destructive">{errors.logradouro}</p>
              )}
            </div>
          </div>

          {/* Endereço - Número, Complemento e Bairro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Número *
              </Label>
              <Input
                id="numero"
                placeholder="123"
                value={formData.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
                className={errors.numero ? "border-destructive" : ""}
              />
              {errors.numero && (
                <p className="text-sm text-destructive">{errors.numero}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Complemento
              </Label>
              <Input
                id="complemento"
                placeholder="Apto 101, Sala 2"
                value={formData.complemento}
                onChange={(e) => handleInputChange("complemento", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Bairro *
              </Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                value={formData.bairro}
                onChange={(e) => handleInputChange("bairro", e.target.value)}
                className={errors.bairro ? "border-destructive" : ""}
              />
              {errors.bairro && (
                <p className="text-sm text-destructive">{errors.bairro}</p>
              )}
            </div>
          </div>

          {/* Endereço - Cidade e Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Cidade *
              </Label>
              <Input
                id="cidade"
                placeholder="Nome da cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
                className={errors.cidade ? "border-destructive" : ""}
              />
              {errors.cidade && (
                <p className="text-sm text-destructive">{errors.cidade}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Estado *
              </Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleInputChange("estado", value)}
              >
                <SelectTrigger className={errors.estado ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Acre</SelectItem>
                  <SelectItem value="AL">Alagoas</SelectItem>
                  <SelectItem value="AP">Amapá</SelectItem>
                  <SelectItem value="AM">Amazonas</SelectItem>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                  <SelectItem value="DF">Distrito Federal</SelectItem>
                  <SelectItem value="ES">Espírito Santo</SelectItem>
                  <SelectItem value="GO">Goiás</SelectItem>
                  <SelectItem value="MA">Maranhão</SelectItem>
                  <SelectItem value="MT">Mato Grosso</SelectItem>
                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  <SelectItem value="PA">Pará</SelectItem>
                  <SelectItem value="PB">Paraíba</SelectItem>
                  <SelectItem value="PR">Paraná</SelectItem>
                  <SelectItem value="PE">Pernambuco</SelectItem>
                  <SelectItem value="PI">Piauí</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                  <SelectItem value="RO">Rondônia</SelectItem>
                  <SelectItem value="RR">Roraima</SelectItem>
                  <SelectItem value="SC">Santa Catarina</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="SE">Sergipe</SelectItem>
                  <SelectItem value="TO">Tocantins</SelectItem>
                </SelectContent>
              </Select>
              {errors.estado && (
                <p className="text-sm text-destructive">{errors.estado}</p>
              )}
            </div>
          </div>

          {/* Inscrição Estadual e Prazo de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricaoEstadual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Inscrição Estadual
              </Label>
              <Input
                id="inscricaoEstadual"
                placeholder="Digite a inscrição estadual"
                value={formData.inscricaoEstadual}
                onChange={(e) => handleInputChange("inscricaoEstadual", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazoPagamento" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prazo de Pagamento
              </Label>
              <Select
                value={formData.prazoPagamento}
                onValueChange={(value) => handleInputChange("prazoPagamento", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prazo de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7 dias">7 dias</SelectItem>
                  <SelectItem value="15 dias">15 dias</SelectItem>
                  <SelectItem value="30 dias">30 dias</SelectItem>
                  <SelectItem value="45 dias">45 dias</SelectItem>
                  <SelectItem value="60 dias">60 dias</SelectItem>
                  <SelectItem value="90 dias">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <Label htmlFor="contato" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Contato
            </Label>
            <Input
              id="contato"
              placeholder="Nome do contato principal"
              value={formData.contato}
              onChange={(e) => handleInputChange("contato", e.target.value)}
            />
          </div>

          {/* Celular e Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="celular" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Celular
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

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
            Atualizar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 