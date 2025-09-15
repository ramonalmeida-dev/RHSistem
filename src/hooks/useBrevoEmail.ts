import { useState } from 'react';
import { toast } from 'sonner';
import { brevoEmailService, EmailRecipient, SendEmailResponse } from '@/lib/brevoEmailService';

interface UseBrevoEmailReturn {
  sendCandidatoAprovado: (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    empresaNome: string;
    proximosPassos?: string;
  }) => Promise<SendEmailResponse>;
  
  sendCandidatoRejeitado: (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    empresaNome: string;
    feedback?: string;
  }) => Promise<SendEmailResponse>;
  
  sendPosicaoFechada: (params: {
    clienteEmail: string;
    clienteNome: string;
    vagaTitulo: string;
    candidatoContratado: string;
    consultorNome: string;
    dataFechamento: string;
  }) => Promise<SendEmailResponse>;
  
  sendNotificacaoKanban: (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    novoStatus: string;
    consultorNome: string;
    observacoes?: string;
  }) => Promise<SendEmailResponse>;
  
  sendCandidatoNaoAproveitadoTriagem: (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
  }) => Promise<SendEmailResponse>;
  
  sendCandidatoNaoAproveitadoEntrevistaConsultor: (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
  }) => Promise<SendEmailResponse>;
  
  sendCandidatoNaoAproveitadoEntrevistaEmpresa: (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
  }) => Promise<SendEmailResponse>;
  
  sendCustomEmail: (params: {
    to: EmailRecipient[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    tags?: string[];
  }) => Promise<SendEmailResponse>;
  
  isLoading: boolean;
  error: string | null;
}

export function useBrevoEmail(): UseBrevoEmailReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailOperation = async <T extends any[]>(
    operation: (...args: T) => Promise<SendEmailResponse>,
    successMessage: string,
    ...args: T
  ): Promise<SendEmailResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation(...args);
      
      if (result.success) {
        toast.success(successMessage);
      } else {
        const errorMessage = result.error || 'Erro desconhecido ao enviar email';
        setError(errorMessage);
        toast.error(`Erro ao enviar email: ${errorMessage}`);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno';
      setError(errorMessage);
      toast.error(`Erro interno: ${errorMessage}`);
      
      return {
        messageId: '',
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendCandidatoAprovado = async (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    empresaNome: string;
    proximosPassos?: string;
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendCandidatoAprovado.bind(brevoEmailService),
      `Email de aprovação enviado para ${params.candidatoNome}`,
      params
    );
  };

  const sendCandidatoRejeitado = async (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    empresaNome: string;
    feedback?: string;
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendCandidatoRejeitado.bind(brevoEmailService),
      `Email de rejeição enviado para ${params.candidatoNome}`,
      params
    );
  };

  const sendPosicaoFechada = async (params: {
    clienteEmail: string;
    clienteNome: string;
    vagaTitulo: string;
    candidatoContratado: string;
    consultorNome: string;
    dataFechamento: string;
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendPosicaoFechada.bind(brevoEmailService),
      `Email de posição fechada enviado para ${params.clienteNome}`,
      params
    );
  };

  const sendNotificacaoKanban = async (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    novoStatus: string;
    consultorNome: string;
    observacoes?: string;
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendNotificacaoKanban.bind(brevoEmailService),
      `Notificação de status enviada para ${params.candidatoNome}`,
      params
    );
  };

  const sendCandidatoNaoAproveitadoTriagem = async (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendCandidatoNaoAproveitadoTriagem.bind(brevoEmailService),
      `Email de não aproveitamento (triagem) enviado para ${params.candidatoNome}`,
      params
    );
  };

  const sendCandidatoNaoAproveitadoEntrevistaConsultor = async (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendCandidatoNaoAproveitadoEntrevistaConsultor.bind(brevoEmailService),
      `Email de não aproveitamento (entrevista consultor) enviado para ${params.candidatoNome}`,
      params
    );
  };

  const sendCandidatoNaoAproveitadoEntrevistaEmpresa = async (params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendCandidatoNaoAproveitadoEntrevistaEmpresa.bind(brevoEmailService),
      `Email de não aproveitamento (entrevista empresa) enviado para ${params.candidatoNome}`,
      params
    );
  };

  const sendCustomEmail = async (params: {
    to: EmailRecipient[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    tags?: string[];
  }) => {
    return handleEmailOperation(
      brevoEmailService.sendCustomEmail.bind(brevoEmailService),
      'Email personalizado enviado com sucesso',
      params
    );
  };

  return {
    sendCandidatoAprovado,
    sendCandidatoRejeitado,
    sendPosicaoFechada,
    sendNotificacaoKanban,
    sendCandidatoNaoAproveitadoTriagem,
    sendCandidatoNaoAproveitadoEntrevistaConsultor,
    sendCandidatoNaoAproveitadoEntrevistaEmpresa,
    sendCustomEmail,
    isLoading,
    error
  };
} 