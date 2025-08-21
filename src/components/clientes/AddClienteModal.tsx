import { useState } from "react";
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
import { Building2, Mail, Phone, MapPin, Calendar, User, FileText } from "lucide-react";

interface AddClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cliente: ClienteData) => void;
}

interface ClienteData {
  razaoSocial: string;
  endereco: string;
  cnpj: string;
  inscricaoEstadual: string;
  prazoPagamento: string;
  contato: string;
  celular: string;
  email: string;
}

export function AddClienteModal({ isOpen, onClose, onSubmit }: AddClienteModalProps) {
  const [formData, setFormData] = useState<ClienteData>({
    razaoSocial: "",
    endereco: "",
    cnpj: "",
    inscricaoEstadual: "",
    prazoPagamento: "",
    contato: "",
    celular: "",
    email: "",
  });

  const [errors, setErrors] = useState<Partial<ClienteData>>({});

  const handleInputChange = (field: keyof ClienteData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClienteData> = {};

    if (!formData.razaoSocial.trim()) {
      newErrors.razaoSocial = "Razão social é obrigatória";
    }

    // Endereço é opcional no banco
    // if (!formData.endereco.trim()) {
    //   newErrors.endereco = "Endereço é obrigatório";
    // }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX";
    }

    // Inscrição estadual é opcional no banco
    // if (!formData.inscricaoEstadual.trim()) {
    //   newErrors.inscricaoEstadual = "Inscrição estadual é obrigatória";
    // }

    // Prazo de pagamento é opcional no banco
    // if (!formData.prazoPagamento) {
    //   newErrors.prazoPagamento = "Prazo de pagamento é obrigatório";
    // }

    // Contato é opcional no banco
    // if (!formData.contato.trim()) {
    //   newErrors.contato = "Contato é obrigatório";
    // }

    // Celular é opcional no banco
    if (formData.celular.trim() && !/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.celular)) {
      newErrors.celular = "Celular deve estar no formato (XX) XXXXX-XXXX";
    }

    // Email é opcional no banco
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
      endereco: "",
      cnpj: "",
      inscricaoEstadual: "",
      prazoPagamento: "",
      contato: "",
      celular: "",
      email: "",
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Cadastrar Novo Cliente
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do cliente. Apenas Razão Social e CNPJ são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Razão Social */}
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

          {/* Endereço Completo */}
          <div className="space-y-2">
            <Label htmlFor="endereco" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço Completo
            </Label>
            <Textarea
              id="endereco"
              placeholder="Digite o endereço completo (rua, número, bairro, cidade, estado, CEP)"
              value={formData.endereco}
              onChange={(e) => handleInputChange("endereco", e.target.value)}
              className={errors.endereco ? "border-destructive" : ""}
              rows={3}
            />
            {errors.endereco && (
              <p className="text-sm text-destructive">{errors.endereco}</p>
            )}
          </div>

          {/* CNPJ e Inscrição Estadual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CNPJ *
              </Label>
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
              {errors.cnpj && (
                <p className="text-sm text-destructive">{errors.cnpj}</p>
              )}
            </div>

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
                className={errors.inscricaoEstadual ? "border-destructive" : ""}
              />
              {errors.inscricaoEstadual && (
                <p className="text-sm text-destructive">{errors.inscricaoEstadual}</p>
              )}
            </div>
          </div>

          {/* Prazo de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="prazoPagamento" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prazo de Pagamento
            </Label>
            <Select
              value={formData.prazoPagamento}
              onValueChange={(value) => handleInputChange("prazoPagamento", value)}
            >
              <SelectTrigger className={errors.prazoPagamento ? "border-destructive" : ""}>
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
            {errors.prazoPagamento && (
              <p className="text-sm text-destructive">{errors.prazoPagamento}</p>
            )}
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
              className={errors.contato ? "border-destructive" : ""}
            />
            {errors.contato && (
              <p className="text-sm text-destructive">{errors.contato}</p>
            )}
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
            Cadastrar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 