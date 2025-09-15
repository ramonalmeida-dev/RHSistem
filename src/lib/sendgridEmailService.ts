import { supabase } from './supabase';

// Tipos para o serviço de email
export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailSender {
  name: string;
  email: string;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface SendEmailRequest {
  sender: EmailSender;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: string;
  params?: Record<string, any>;
  tags?: string[];
  headers?: Record<string, string>;
}

export interface SendEmailResponse {
  messageId: string;
  success: boolean;
  error?: string;
}

// Templates pré-definidos para diferentes contextos
export const EMAIL_TEMPLATES = {
  CANDIDATO_APROVADO: {
    subject: 'Parabéns! Você foi aprovado para a vaga',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
      empresaNome: string;
      proximosPassos?: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .button { background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Parabéns, ${params.candidatoNome}!</h1>
            </div>
            <div class="content">
              <p>Temos o prazer de informar que você foi <strong>aprovado</strong> para a vaga:</p>
              <h3>${params.vagaTitulo}</h3>
              <p><strong>Empresa:</strong> ${params.empresaNome}</p>
              ${params.proximosPassos ? `
                <h4>Próximos Passos:</h4>
                <p>${params.proximosPassos}</p>
              ` : ''}
              <p>Em breve entraremos em contato com mais detalhes sobre o processo.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br>Equipe Lotus Recruit Hub</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CANDIDATO_REJEITADO: {
    subject: 'Atualização sobre sua candidatura',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
      empresaNome: string;
      feedback?: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Atualização sobre sua candidatura</h1>
            </div>
            <div class="content">
              <p>Olá ${params.candidatoNome},</p>
              <p>Agradecemos seu interesse na vaga <strong>${params.vagaTitulo}</strong> na empresa ${params.empresaNome}.</p>
              <p>Após análise cuidadosa, decidimos seguir com outros candidatos para esta posição específica.</p>
              ${params.feedback ? `
                <h4>Feedback:</h4>
                <p>${params.feedback}</p>
              ` : ''}
              <p>Manteremos seu currículo em nossa base de dados para futuras oportunidades que possam ser adequadas ao seu perfil.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br>Equipe Lotus Recruit Hub</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  POSICAO_FECHADA: {
    subject: 'Posição fechada com sucesso',
    getHtmlContent: (params: {
      clienteNome: string;
      vagaTitulo: string;
      candidatoContratado: string;
      consultorNome: string;
      dataFechamento: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .info-box { background-color: #e5f3ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Posição Fechada com Sucesso!</h1>
            </div>
            <div class="content">
              <p>Olá ${params.clienteNome},</p>
              <p>Temos o prazer de informar que a posição foi fechada com sucesso:</p>
              
              <div class="info-box">
                <h3>${params.vagaTitulo}</h3>
                <p><strong>Candidato contratado:</strong> ${params.candidatoContratado}</p>
                <p><strong>Consultor responsável:</strong> ${params.consultorNome}</p>
                <p><strong>Data de fechamento:</strong> ${params.dataFechamento}</p>
              </div>
              
              <p>Agradecemos pela confiança em nossos serviços e esperamos continuar nossa parceria em futuras oportunidades.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br>Equipe Lotus Recruit Hub</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  NOTIFICACAO_KANBAN: {
    subject: 'Atualização no status do candidato',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
      novoStatus: string;
      consultorNome: string;
      observacoes?: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .status-badge { background-color: #3b82f6; color: white; padding: 6px 12px; border-radius: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Atualização de Status</h1>
            </div>
            <div class="content">
              <p>Olá ${params.candidatoNome},</p>
              <p>Há uma atualização sobre sua candidatura para a vaga:</p>
              <h3>${params.vagaTitulo}</h3>
              <p><strong>Novo status:</strong> <span class="status-badge">${params.novoStatus}</span></p>
              <p><strong>Consultor responsável:</strong> ${params.consultorNome}</p>
              ${params.observacoes ? `
                <h4>Observações:</h4>
                <p>${params.observacoes}</p>
              ` : ''}
            </div>
            <div class="footer">
              <p>Atenciosamente,<br>Equipe Lotus Recruit Hub</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CANDIDATO_NAO_APROVEITADO_TRIAGEM: {
    subject: 'Agradecimento por sua candidatura',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
      consultorNome: string;
      empresaNome: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Agradecimento por sua candidatura</h1>
            </div>
            <div class="content">
              <p>Olá ${params.candidatoNome},</p>
              <p>Agradecemos por ter se candidatado à vaga <strong>${params.vagaTitulo}</strong> e pelo interesse em fazer parte de nossa rede de talentos.</p>
              <p>Após análise, seu perfil não foi selecionado para continuidade neste processo específico. No entanto, seu currículo permanecerá ativo em nosso banco de dados para futuras oportunidades compatíveis com sua experiência.</p>
              <p>Seguimos à disposição e desejamos sucesso em sua trajetória profissional.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br>${params.consultorNome} / ${params.empresaNome}</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CANDIDATO_NAO_APROVEITADO_ENTREVISTA_CONSULTOR: {
    subject: 'Agradecimento por sua participação no processo seletivo',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
      consultorNome: string;
      empresaNome: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Agradecimento por sua participação</h1>
            </div>
            <div class="content">
              <p>Olá ${params.candidatoNome},</p>
              <p>Agradecemos por sua participação na entrevista referente à vaga <strong>${params.vagaTitulo}</strong> e pelo tempo dedicado para compartilhar sua trajetória profissional conosco.</p>
              <p>Após avaliação, identificamos que neste momento o perfil buscado pela empresa segue em outra direção. Entretanto, seu currículo continuará ativo para futuras vagas que estejam alinhadas à sua experiência.</p>
              <p>Foi um prazer conhecê-lo(a) e esperamos poder contar com sua participação novamente.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br>${params.consultorNome} / ${params.empresaNome}</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CANDIDATO_NAO_APROVEITADO_ENTREVISTA_EMPRESA: {
    subject: 'Retorno sobre o processo seletivo',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
      consultorNome: string;
      empresaNome: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Retorno sobre o processo seletivo</h1>
            </div>
            <div class="content">
              <p>Olá ${params.candidatoNome},</p>
              <p>Foi um prazer contar com sua participação nas etapas do processo seletivo para a vaga <strong>${params.vagaTitulo}</strong>.</p>
              <p>Após criteriosa análise, informamos que, neste momento, o processo seguirá com outro(a) candidato(a). Gostaríamos de reforçar que sua experiência e competências foram muito bem avaliadas, e por isso manteremos seu currículo ativo para futuras oportunidades.</p>
              <p>Agradecemos novamente pela disponibilidade e desejamos muito sucesso em sua carreira.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br>${params.consultorNome} / ${params.empresaNome}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
};

// Configurações padrão do remetente
export const DEFAULT_SENDER: EmailSender = {
  name: 'Lotus Recruit Hub',
  email: 'vagas@lotusarev.com.br' // Email verificado no SendGrid
};

class SendGridEmailService {
  private async callEmailFunction(functionName: string, payload: any) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error(`Erro ao chamar função ${functionName}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Erro na comunicação com ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Envia um email usando a API do SendGrid
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    return await this.callEmailFunction('sendgrid-email', request);
  }

  /**
   * Envia email de candidato aprovado
   */
  async sendCandidatoAprovado(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    empresaNome: string;
    proximosPassos?: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CANDIDATO_APROVADO;
    
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        empresaNome: params.empresaNome,
        proximosPassos: params.proximosPassos
      }),
      tags: ['candidato-aprovado', 'processo-seletivo']
    });
  }

  /**
   * Envia email de candidato rejeitado
   */
  async sendCandidatoRejeitado(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    empresaNome: string;
    feedback?: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CANDIDATO_REJEITADO;
    
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        empresaNome: params.empresaNome,
        feedback: params.feedback
      }),
      tags: ['candidato-rejeitado', 'processo-seletivo']
    });
  }

  /**
   * Envia email de posição fechada para o cliente
   */
  async sendPosicaoFechada(params: {
    clienteEmail: string;
    clienteNome: string;
    vagaTitulo: string;
    candidatoContratado: string;
    consultorNome: string;
    dataFechamento: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.POSICAO_FECHADA;
    
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: [{ email: params.clienteEmail, name: params.clienteNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        clienteNome: params.clienteNome,
        vagaTitulo: params.vagaTitulo,
        candidatoContratado: params.candidatoContratado,
        consultorNome: params.consultorNome,
        dataFechamento: params.dataFechamento
      }),
      tags: ['posicao-fechada', 'cliente']
    });
  }

  /**
   * Envia notificação de mudança de status no Kanban
   */
  async sendNotificacaoKanban(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    novoStatus: string;
    consultorNome: string;
    observacoes?: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.NOTIFICACAO_KANBAN;
    
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        novoStatus: params.novoStatus,
        consultorNome: params.consultorNome,
        observacoes: params.observacoes
      }),
      tags: ['kanban-update', 'status-change']
    });
  }

  /**
   * Envia email para candidato não aproveitado na triagem inicial
   */
  async sendCandidatoNaoAproveitadoTriagem(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CANDIDATO_NAO_APROVEITADO_TRIAGEM;
    
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        consultorNome: params.consultorNome,
        empresaNome: params.empresaNome
      }),
      tags: ['candidato-nao-aproveitado', 'triagem-inicial']
    });
  }

  /**
   * Envia email para candidato não aproveitado após entrevista com consultor
   */
  async sendCandidatoNaoAproveitadoEntrevistaConsultor(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CANDIDATO_NAO_APROVEITADO_ENTREVISTA_CONSULTOR;
    
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        consultorNome: params.consultorNome,
        empresaNome: params.empresaNome
      }),
      tags: ['candidato-nao-aproveitado', 'entrevista-consultor']
    });
  }

  /**
   * Envia email para candidato não aproveitado após entrevista com empresa
   */
  async sendCandidatoNaoAproveitadoEntrevistaEmpresa(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    consultorNome: string;
    empresaNome: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CANDIDATO_NAO_APROVEITADO_ENTREVISTA_EMPRESA;
    
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        consultorNome: params.consultorNome,
        empresaNome: params.empresaNome
      }),
      tags: ['candidato-nao-aproveitado', 'entrevista-empresa']
    });
  }

  /**
   * Envia email personalizado
   */
  async sendCustomEmail(params: {
    to: EmailRecipient[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    sender?: EmailSender;
    tags?: string[];
  }): Promise<SendEmailResponse> {
    return await this.sendEmail({
      sender: params.sender || DEFAULT_SENDER,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      tags: params.tags || ['custom-email']
    });
  }
}

// Instância singleton do serviço
export const sendgridEmailService = new SendGridEmailService();

// Função utilitária para validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função utilitária para sanitizar HTML
export const sanitizeHtml = (html: string): string => {
  // Implementação básica - em produção, use uma biblioteca como DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}; 