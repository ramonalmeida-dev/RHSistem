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
import { 
  Mail, 
  Send,
  X,
  User,
  Building
} from 'lucide-react';
import { Candidate } from '@/components/kanban/KanbanBoard';
import { useToast } from "@/hooks/use-toast";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  vagaCargo?: string;
  vagaEmpresa?: string;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
  template: string;
}

export function EmailModal({ 
  isOpen, 
  onClose, 
  candidate, 
  vagaCargo = "Vaga",
  vagaEmpresa = "Empresa"
}: EmailModalProps) {
  const [emailData, setEmailData] = useState<EmailData>({
    to: "",
    subject: "",
    body: "",
    template: "personalizado"
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Preencher dados quando o modal abrir
  useEffect(() => {
    if (candidate && isOpen) {
      setEmailData({
        to: candidate.email,
        subject: `Candidatura - ${vagaCargo}`,
        body: `Olá ${candidate.name},\n\nObrigado por sua candidatura para a vaga de ${vagaCargo} na ${vagaEmpresa}.\n\nAtenciosamente,\nEquipe de Recrutamento`,
        template: "personalizado"
      });
    }
  }, [candidate, isOpen, vagaCargo, vagaEmpresa]);

  const handleTemplateChange = (template: string) => {
    if (!candidate) return;

    const templates = {
      agradecimento: {
        subject: `Agradecimento por sua candidatura`,
        body: `Prezado(a) ${candidate.name},\n\nAgradecemos por sua candidatura à posição divulgada e pelo interesse em participar dos processos conduzidos por nossa consultoria.\n\nTodos os currículos recebidos são analisados com atenção e avaliados de acordo com os requisitos da vaga.\n\nCaso seu perfil esteja alinhado às necessidades do nosso cliente, entraremos em contato para as próximas etapas. Caso contrário, seu currículo permanecerá em nosso banco de talentos para futuras oportunidades compatíveis com sua experiência.\n\nDesejamos sucesso em sua trajetória profissional e agradecemos sua confiança em nosso trabalho.\n\nAtenciosamente,\nEquipe LotusArev Consulting`
      },
      entrevista: {
        subject: `Convite para entrevista – ${vagaCargo}`,
        body: `Olá, ${candidate.name},\n\nGostaríamos de convidá-lo(a) para uma entrevista online (Microsoft Teams) referente à vaga de ${vagaCargo}.\n\nPor gentileza, responda a este e-mail informando seus horários disponíveis nos próximos dias para agendarmos o melhor momento.\n\nFicamos à disposição para qualquer dúvida.\n\nAtenciosamente,\nLotusArev Consulting`
      },
      cv_enviado_cliente: {
        subject: `Encaminhamento de seu currículo – ${vagaCargo}`,
        body: `Olá, ${candidate.name},\n\nApós a etapa de entrevistas conduzida pela LotusArev, informamos que seu currículo foi encaminhado para avaliação do nosso cliente, responsável pela posição de ${vagaCargo}.\n\nAssim que tivermos um retorno sobre o andamento do processo, entraremos em contato.\n\nAgradecemos novamente por sua participação e confiança.\n\nAtenciosamente,\nLotusArev Consulting`
      },
      aprovacao: {
        subject: `Parabéns – Você foi aprovado(a)!`,
        body: `Olá, ${candidate.name},\n\nÉ com satisfação que informamos sua aprovação no processo seletivo para a vaga de ${vagaCargo} na empresa ${vagaEmpresa}.\n\nParabéns pela conquista! Em breve, entraremos em contato com as informações sobre as próximas etapas para formalização da contratação.\n\nAgradecemos pela parceria e confiança em todo o processo.\n\nAtenciosamente,\nLotusArev Consulting`
      },
      reprovacao: {
        subject: `Agradecimento por sua participação – ${vagaCargo}`,
        body: `Olá, ${candidate.name},\n\nAgradecemos sua participação no processo seletivo para a vaga de ${vagaCargo} junto à empresa ${vagaEmpresa}.\n\nApós a conclusão das etapas, informamos que a empresa optou por seguir com outro(a) profissional neste momento.\n\nSeu perfil será mantido em nosso banco de talentos para futuras oportunidades alinhadas à sua experiência.\n\nDesejamos sucesso em sua trajetória profissional e esperamos revê-lo(a) em outros processos.\n\nAtenciosamente,\nLotusArev Consulting`
      },
      personalizado: {
        subject: emailData.subject,
        body: emailData.body
      }
    };

    const selectedTemplate = templates[template as keyof typeof templates];
    setEmailData(prev => ({
      ...prev,
      template,
      subject: selectedTemplate.subject,
      body: selectedTemplate.body
    }));
  };

  const handleSendEmail = () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Criar link mailto
    const subject = encodeURIComponent(emailData.subject);
    const body = encodeURIComponent(emailData.body);
    const mailtoLink = `mailto:${emailData.to}?subject=${subject}&body=${body}`;
    
    // Abrir cliente de email
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email",
      description: `Email preparado para ${candidate?.name}`,
    });
    
    setLoading(false);
    onClose();
  };

  const handleInputChange = (field: keyof EmailData, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Email para {candidate.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações do Candidato */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">{candidate.name}</div>
                <div className="text-xs text-muted-foreground">{candidate.email}</div>
              </div>
              <Building className="h-4 w-4 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">{vagaEmpresa}</div>
            </div>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={emailData.template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personalizado">Personalizado</SelectItem>
                <SelectItem value="agradecimento">FASE 1 - Recebimento do Currículo</SelectItem>
                <SelectItem value="entrevista">FASE 2 - Seleção e Entrevista na LotusArev</SelectItem>
                <SelectItem value="cv_enviado_cliente">FASE 3 - CV Enviado para Avaliação do Cliente</SelectItem>
                <SelectItem value="aprovacao">FASE 4 - Comunicado de Aprovação</SelectItem>
                <SelectItem value="reprovacao">FASE 5 - Agradecimento por Participação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destinatário */}
          <div className="space-y-2">
            <Label htmlFor="to">Para *</Label>
            <Input
              id="to"
              value={emailData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Assunto do email"
              required
            />
          </div>

          {/* Corpo do Email */}
          <div className="space-y-2">
            <Label htmlFor="body">Mensagem *</Label>
            <Textarea
              id="body"
              value={emailData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={12}
              className="font-mono text-sm"
              required
            />
          </div>

          {/* Dicas de Formatação */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Dicas:</div>
              <ul className="text-xs space-y-1">
                <li>• Use \n para quebras de linha</li>
                <li>• O email será aberto no seu cliente de email padrão</li>
                <li>• Você pode editar o email antes de enviar</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSendEmail} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Preparando..." : "Enviar Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 