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
        subject: `Agradecimento - Candidatura ${vagaCargo}`,
        body: `Olá ${candidate.name},\n\nAgradecemos sua candidatura para a vaga de ${vagaCargo} na ${vagaEmpresa}.\n\nSeu currículo está sendo analisado e entraremos em contato em breve.\n\nAtenciosamente,\nEquipe de Recrutamento`
      },
      entrevista: {
        subject: `Agendamento de Entrevista - ${vagaCargo}`,
        body: `Olá ${candidate.name},\n\nGostaríamos de agendar uma entrevista para a vaga de ${vagaCargo} na ${vagaEmpresa}.\n\nPor favor, responda este email com sua disponibilidade para os próximos dias.\n\nAtenciosamente,\nEquipe de Recrutamento`
      },
      aprovacao: {
        subject: `Parabéns! Você foi aprovado(a) - ${vagaCargo}`,
        body: `Olá ${candidate.name},\n\nTemos o prazer de informar que você foi aprovado(a) para a vaga de ${vagaCargo} na ${vagaEmpresa}!\n\nEntraremos em contato em breve com os próximos passos.\n\nParabéns!\nEquipe de Recrutamento`
      },
      reprovacao: {
        subject: `Retorno sobre sua candidatura - ${vagaCargo}`,
        body: `Olá ${candidate.name},\n\nAgradecemos seu interesse na vaga de ${vagaCargo} na ${vagaEmpresa}.\n\nInfelizmente, não poderemos prosseguir com sua candidatura neste momento.\n\nDesejamos sucesso em suas próximas oportunidades.\n\nAtenciosamente,\nEquipe de Recrutamento`
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
                <SelectItem value="agradecimento">Agradecimento</SelectItem>
                <SelectItem value="entrevista">Agendamento de Entrevista</SelectItem>
                <SelectItem value="aprovacao">Aprovação</SelectItem>
                <SelectItem value="reprovacao">Reprovação</SelectItem>
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