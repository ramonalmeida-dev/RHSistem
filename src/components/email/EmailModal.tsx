import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendgridEmailService, EmailRecipient, EMAIL_TEMPLATES } from '@/lib/sendgridEmailService';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: EmailRecipient;
  defaultSubject?: string;
  defaultTemplate?: keyof typeof EMAIL_TEMPLATES;
  templateParams?: Record<string, any>;
}

export function EmailModal({
  isOpen,
  onClose,
  defaultRecipient,
  defaultSubject,
  defaultTemplate,
  templateParams = {}
}: EmailModalProps) {
  const [recipients, setRecipients] = useState<EmailRecipient[]>(
    defaultRecipient ? [defaultRecipient] : []
  );
  const [ccRecipients, setCcRecipients] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState(defaultSubject || '');
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultTemplate || '');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para adicionar novos destinatários
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newCcEmail, setNewCcEmail] = useState('');
  const [newCcName, setNewCcName] = useState('');

  const handleAddRecipient = () => {
    if (newRecipientEmail && newRecipientName) {
      setRecipients([...recipients, { email: newRecipientEmail, name: newRecipientName }]);
      setNewRecipientEmail('');
      setNewRecipientName('');
    }
  };

  const handleAddCc = () => {
    if (newCcEmail && newCcName) {
      setCcRecipients([...ccRecipients, { email: newCcEmail, name: newCcName }]);
      setNewCcEmail('');
      setNewCcName('');
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleRemoveCc = (index: number) => {
    setCcRecipients(ccRecipients.filter((_, i) => i !== index));
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey && EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES]) {
      const template = EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES];
      setSubject(template.subject);
      
      if ('getHtmlContent' in template) {
        setHtmlContent(template.getHtmlContent(templateParams as any));
      }
    }
  };

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      toast.error('Adicione pelo menos um destinatário');
      return;
    }

    if (!subject.trim()) {
      toast.error('Assunto é obrigatório');
      return;
    }

    if (!htmlContent.trim()) {
      toast.error('Conteúdo do email é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendgridEmailService.sendCustomEmail({
        to: recipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        subject,
        htmlContent,
        categories: ['manual-send', selectedTemplate || 'custom']
      });

      if (result.success) {
        toast.success('Email enviado com sucesso!');
        onClose();
        // Reset form
        setRecipients([]);
        setCcRecipients([]);
        setSubject('');
        setHtmlContent('');
        setSelectedTemplate('');
      } else {
        toast.error(`Erro ao enviar email: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro interno ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Email</DialogTitle>
          <DialogDescription>
            Compose e envie emails usando templates ou conteúdo personalizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Template (Opcional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template ou deixe em branco para email personalizado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum template</SelectItem>
                <SelectItem value="CANDIDATO_APROVADO">Candidato Aprovado</SelectItem>
                <SelectItem value="CANDIDATO_REJEITADO">Candidato Rejeitado</SelectItem>
                <SelectItem value="POSICAO_FECHADA">Posição Fechada</SelectItem>
                <SelectItem value="NOTIFICACAO_KANBAN">Notificação Kanban</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <div>
              <Label>Destinatários</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Email do destinatário"
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                />
                <Input
                  placeholder="Nome do destinatário"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                />
                <Button onClick={handleAddRecipient} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((recipient, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {recipient.name} ({recipient.email})
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveRecipient(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* CC Recipients */}
            <div>
              <Label>CC (Opcional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Email CC"
                  value={newCcEmail}
                  onChange={(e) => setNewCcEmail(e.target.value)}
                />
                <Input
                  placeholder="Nome CC"
                  value={newCcName}
                  onChange={(e) => setNewCcName(e.target.value)}
                />
                <Button onClick={handleAddCc} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {ccRecipients.map((recipient, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {recipient.name} ({recipient.email})
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveCc(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
            />
          </div>

          {/* HTML Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo HTML</Label>
            <Textarea
              id="content"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Conteúdo HTML do email..."
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          {/* Preview */}
          {htmlContent && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div 
                className="border rounded-md p-4 max-h-60 overflow-y-auto bg-gray-50"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSendEmail} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 