import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendgridEmailService } from '@/lib/sendgridEmailService';

interface Candidate {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  candidate: Candidate;
  newStatus: string;
  oldStatus: string;
  vagaTitulo: string;
  statusTitle: string;
}

// Mapeamento de status para templates de email
// Baseado no status de DESTINO e status de ORIGEM para determinar o template correto
const getEmailConfig = (newStatus: string, oldStatus: string) => {
  // Se movendo para REPROVADO, determinar qual template usar baseado no status anterior
  if (newStatus === 'reprovado') {
    if (oldStatus === 'selecionando' || oldStatus === 'curriculo_enviado') {
      return {
        templateType: 'triagem',
        templateName: 'Não aproveitado - Triagem inicial',
        description: 'Email de agradecimento para candidatos não selecionados na triagem inicial',
        needsEmail: true
      };
    } else if (oldStatus === 'entrevista_agendada') {
      return {
        templateType: 'entrevista_consultor',
        templateName: 'Não aproveitado - Após entrevista consultor',
        description: 'Email para candidatos entrevistados pelo consultor mas não aprovados',
        needsEmail: true
      };
    } else {
      return {
        templateType: 'entrevista_empresa',
        templateName: 'Não aproveitado - Após entrevista empresa',
        description: 'Email para candidatos que chegaram à entrevista na empresa mas não foram selecionados',
        needsEmail: true
      };
    }
  }

  // Mapeamento padrão para outros status
  const STATUS_EMAIL_MAPPING = {
    'desistiu': {
      templateType: 'notification',
      templateName: 'Notificação de desistência',
      description: 'Notificação simples sobre mudança de status',
      needsEmail: false // Geralmente não enviamos email quando candidato desiste
    },
    'aprovado': {
      templateType: 'aprovado',
      templateName: 'Candidato aprovado',
      description: 'Email de parabéns para candidatos aprovados',
      needsEmail: true
    },
    'entrevista_agendada': {
      templateType: 'notification',
      templateName: 'Entrevista agendada',
      description: 'Notificação sobre agendamento de entrevista',
      needsEmail: true
    },
    'curriculo_enviado': {
      templateType: 'notification',
      templateName: 'Currículo enviado',
      description: 'Confirmação de recebimento do currículo',
      needsEmail: false
    },
    'selecionando': {
      templateType: 'notification',
      templateName: 'Em processo de seleção',
      description: 'Notificação sobre entrada no processo seletivo',
      needsEmail: false
    }
  };

  return STATUS_EMAIL_MAPPING[newStatus as keyof typeof STATUS_EMAIL_MAPPING] || {
    templateType: 'notification',
    templateName: 'Notificação genérica',
    description: 'Email genérico de mudança de status',
    needsEmail: false
  };
};

export function EmailConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  candidate,
  newStatus,
  oldStatus,
  vagaTitulo,
  statusTitle
}: EmailConfirmationModalProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Valores fixos para email
  const consultorNome = 'Equipe de Recrutamento';
  const empresaNome = 'Lotus Recruit Hub';

  // Determinar configuração do email baseado no status atual e anterior
  const emailConfig = useMemo(() => {
    return getEmailConfig(newStatus, oldStatus);
  }, [newStatus, oldStatus]);



  const handleConfirmWithEmail = async (shouldSendEmail: boolean) => {
    setIsLoading(true);
    setSendEmail(shouldSendEmail);

    try {
      // Primeiro confirma a mudança de status
      onConfirm();

      // Se deve enviar email e usuário escolheu enviar
      console.log('Debug Kanban Email:', {
        shouldSendEmail,
        candidateEmail: candidate.email,
        candidateName: candidate.name,
        vagaTitulo,
        newStatus,
        oldStatus
      });

      if (shouldSendEmail) {
        let emailResult;

        switch (emailConfig.templateType) {
          case 'triagem':
            emailResult = await sendgridEmailService.sendCandidatoNaoAproveitadoTriagem({
              candidatoEmail: candidate.email,
              candidatoNome: candidate.name,
              vagaTitulo,
              consultorNome,
              empresaNome
            });
            break;

          case 'entrevista_consultor':
            emailResult = await sendgridEmailService.sendCandidatoNaoAproveitadoEntrevistaConsultor({
              candidatoEmail: candidate.email,
              candidatoNome: candidate.name,
              vagaTitulo,
              consultorNome,
              empresaNome
            });
            break;

          case 'entrevista_empresa':
            emailResult = await sendgridEmailService.sendCandidatoNaoAproveitadoEntrevistaEmpresa({
              candidatoEmail: candidate.email,
              candidatoNome: candidate.name,
              vagaTitulo,
              consultorNome,
              empresaNome
            });
            break;

          case 'aprovado':
            emailResult = await sendgridEmailService.sendCandidatoAprovado({
              candidatoEmail: candidate.email,
              candidatoNome: candidate.name,
              vagaTitulo,
              empresaNome,
              proximosPassos: 'Em breve entraremos em contato com os próximos passos.'
            });
            break;

          case 'notification':
          default:
            emailResult = await sendgridEmailService.sendNotificacaoKanban({
              candidatoEmail: candidate.email,
              candidatoNome: candidate.name,
              vagaTitulo,
              novoStatus: statusTitle,
              consultorNome,
              observacoes: `Status atualizado para: ${statusTitle}`
            });
            break;
        }

        if (emailResult.success) {
          toast.success(`📧 Email enviado para ${candidate.name} via SendGrid`);
        } else {
          toast.error(`Erro ao enviar email: ${emailResult.error}`);
        }
      }

    } catch (error) {
      console.error('Erro ao processar confirmação:', error);
      toast.error('Erro interno ao processar solicitação');
    } finally {
      setIsLoading(false);
      onClose();
      // Reset form
      setSendEmail(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">
            Confirmar mudança de status
          </DialogTitle>
          <DialogDescription className="text-center">
            Movendo <strong>{candidate.name}</strong> para <strong>{statusTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {/* Pergunta simples sobre envio de email */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">
                Deseja enviar email para o candidato?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => handleConfirmWithEmail(true)}
                  disabled={isLoading}
                  className="px-6 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processando...' : 'Sim'}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmWithEmail(false)}
                  disabled={isLoading}
                  className="px-6 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processando...' : 'Não'}
                </button>
              </div>
            </div>


          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
} 