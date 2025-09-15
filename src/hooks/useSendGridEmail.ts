import { useState } from 'react';
import { toast } from 'sonner';
import { sendgridEmailService, EmailRecipient, SendEmailResponse } from '@/lib/sendgridEmailService';

export interface EmailOperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const useSendGridEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailOperation = async <T>(
    operation: (params: T) => Promise<SendEmailResponse>,
    successMessage: string,
    params: T
  ): Promise<EmailOperationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation(params);
      
      if (result.success) {
        toast.success(successMessage);
        return { success: true, data: result };
      } else {
        const errorMsg = result.error || 'Erro desconhecido ao enviar email';
        setError(errorMsg);
        toast.error(`Erro ao enviar email: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Erro interno do servidor';
      setError(errorMsg);
      toast.error(`Erro ao enviar email: ${errorMsg}`);
      return { success: false, error: errorMsg };
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
      sendgridEmailService.sendCandidatoAprovado.bind(sendgridEmailService),
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
      sendgridEmailService.sendCandidatoRejeitado.bind(sendgridEmailService),
      `Email de rejeição enviado para ${params.candidatoNome}`,
      params
    );
  };

  const sendPosicaoFechada = async (params: {
    clienteNome: string;
    vagaTitulo: string;
    candidatoContratado: string;
    consultorNome: string;
    dataFechamento: string;
  }) => {
    return handleEmailOperation(
      sendgridEmailService.sendPosicaoFechada.bind(sendgridEmailService),
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
      sendgridEmailService.sendNotificacaoKanban.bind(sendgridEmailService),
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
      sendgridEmailService.sendCandidatoNaoAproveitadoTriagem.bind(sendgridEmailService),
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
      sendgridEmailService.sendCandidatoNaoAproveitadoEntrevistaConsultor.bind(sendgridEmailService),
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
      sendgridEmailService.sendCandidatoNaoAproveitadoEntrevistaEmpresa.bind(sendgridEmailService),
      `Email de não aproveitamento (entrevista empresa) enviado para ${params.candidatoNome}`,
      params
    );
  };

  const sendCustomEmail = async (params: {
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    subject: string;
    htmlContent: string;
    tags?: string[];
  }) => {
    return handleEmailOperation(
      sendgridEmailService.sendCustomEmail.bind(sendgridEmailService),
      `Email customizado enviado com sucesso`,
      params
    );
  };

  return {
    isLoading,
    error,
    sendCandidatoAprovado,
    sendCandidatoRejeitado,
    sendPosicaoFechada,
    sendNotificacaoKanban,
    sendCandidatoNaoAproveitadoTriagem,
    sendCandidatoNaoAproveitadoEntrevistaConsultor,
    sendCandidatoNaoAproveitadoEntrevistaEmpresa,
    sendCustomEmail
  };
}; 