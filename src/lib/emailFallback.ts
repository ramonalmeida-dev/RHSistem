// Sistema de fallback para desenvolvimento quando conta Brevo não está ativada
export interface EmailFallbackLog {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  template: string;
  status: 'simulated' | 'failed';
}

class EmailFallbackService {
  private logs: EmailFallbackLog[] = [];

  // Simular envio de email para desenvolvimento
  simulateEmailSend(params: {
    to: string;
    subject: string;
    template: string;
  }): EmailFallbackLog {
    const log: EmailFallbackLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      to: params.to,
      subject: params.subject,
      template: params.template,
      status: 'simulated'
    };

    this.logs.push(log);
    
    // Manter apenas os últimos 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }

    // Log no console para desenvolvimento
    console.log('📧 EMAIL SIMULADO:', {
      para: params.to,
      assunto: params.subject,
      template: params.template,
      timestamp: new Date().toLocaleString('pt-BR')
    });

    return log;
  }

  // Obter logs de emails simulados
  getLogs(): EmailFallbackLog[] {
    return [...this.logs].reverse(); // Mais recentes primeiro
  }

  // Limpar logs
  clearLogs(): void {
    this.logs = [];
  }

  // Verificar se deve usar fallback baseado no erro
  shouldUseFallback(error: string): boolean {
    return error.includes('SMTP account is not yet activated') ||
           error.includes('not yet activated') ||
           error.includes('contact@brevo.com');
  }

  // Obter template baseado no tipo
  getTemplateInfo(templateType: string): { name: string; description: string } {
    const templates = {
      'triagem': {
        name: 'Não aproveitado - Triagem',
        description: 'Candidato não selecionado na triagem inicial'
      },
      'entrevista_consultor': {
        name: 'Não aproveitado - Entrevista Consultor',
        description: 'Candidato entrevistado pelo consultor mas não aprovado'
      },
      'entrevista_empresa': {
        name: 'Não aproveitado - Entrevista Empresa',
        description: 'Candidato que chegou à entrevista na empresa mas não foi selecionado'
      },
      'aprovado': {
        name: 'Candidato Aprovado',
        description: 'Email de parabéns para candidato aprovado'
      },
      'notification': {
        name: 'Notificação de Status',
        description: 'Notificação genérica de mudança de status'
      }
    };

    return templates[templateType as keyof typeof templates] || {
      name: 'Template Desconhecido',
      description: 'Template não identificado'
    };
  }
}

export const emailFallbackService = new EmailFallbackService();

// Hook para usar o fallback service
export function useEmailFallback() {
  return {
    simulateEmail: emailFallbackService.simulateEmailSend.bind(emailFallbackService),
    getLogs: emailFallbackService.getLogs.bind(emailFallbackService),
    clearLogs: emailFallbackService.clearLogs.bind(emailFallbackService),
    shouldUseFallback: emailFallbackService.shouldUseFallback.bind(emailFallbackService),
    getTemplateInfo: emailFallbackService.getTemplateInfo.bind(emailFallbackService)
  };
} 