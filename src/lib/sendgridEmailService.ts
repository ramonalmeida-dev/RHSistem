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

// Interface correta do SendGrid baseada na documentação oficial
export interface SendGridRequest {
  from: EmailSender;
  personalizations: Array<{
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
  }>;
  subject: string;
  content: Array<{
    type: string;
    value: string;
  }>;
  categories?: string[];
  headers?: Record<string, string>;
}

// Mantém compatibilidade com código existente
export interface SendEmailRequest extends SendGridRequest {}

export interface SendEmailResponse {
  messageId: string;
  success: boolean;
  error?: string;
}

// Templates pré-definidos para diferentes contextos
export const EMAIL_TEMPLATES = {
  CANDIDATO_APROVADO: {
    subject: 'Parabéns – Você foi aprovado(a)!',
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
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Parabéns – Você foi aprovado(a)!</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${params.candidatoNome}</strong>,</p>
              <p>É com satisfação que informamos sua aprovação no processo seletivo para a vaga de <strong>${params.vagaTitulo}</strong>.</p>
              <p>Parabéns pela conquista! Em breve, entraremos em contato com as informações sobre as próximas etapas para formalização da contratação.</p>
              <p>Agradecemos pela parceria e confiança em todo o processo.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br><strong>LotusArev Consulting</strong></p>
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
              <p>Prezado(a) Candidato(a),</p>
              <p>Agradecemos por sua candidatura à posição divulgada e pelo interesse em participar dos processos conduzidos por nossa consultoria.</p>
              <p>Todos os currículos recebidos são analisados com atenção e avaliados de acordo com os requisitos da vaga.</p>
              <p>Caso seu perfil esteja alinhado às necessidades do nosso cliente, entraremos em contato para as próximas etapas. Caso contrário, seu currículo permanecerá em nosso banco de talentos para futuras oportunidades compatíveis com sua experiência.</p>
              <p>Desejamos sucesso em sua trajetória profissional e agradecemos sua confiança em nosso trabalho.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br><strong>Equipe LotusArev Consulting</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CANDIDATO_NAO_APROVEITADO_ENTREVISTA_CONSULTOR: {
    subject: 'Agradecimento por sua participação',
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
              <p>Olá, <strong>${params.candidatoNome}</strong>,</p>
              <p>Agradecemos sua participação no processo seletivo para a vaga de <strong>${params.vagaTitulo}</strong>.</p>
              <p>Após a conclusão das etapas, informamos que a empresa optou por seguir com outro(a) profissional neste momento.</p>
              <p>Seu perfil será mantido em nosso banco de talentos para futuras oportunidades alinhadas à sua experiência.</p>
              <p>Desejamos sucesso em sua trajetória profissional e esperamos revê-lo(a) em outros processos.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br><strong>LotusArev Consulting</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CANDIDATO_NAO_APROVEITADO_ENTREVISTA_EMPRESA: {
    subject: 'Agradecimento por sua participação',
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
              <p>Olá, <strong>${params.candidatoNome}</strong>,</p>
              <p>Agradecemos sua participação no processo seletivo para a vaga de <strong>${params.vagaTitulo}</strong>.</p>
              <p>Após a conclusão das etapas, informamos que a empresa optou por seguir com outro(a) profissional neste momento.</p>
              <p>Seu perfil será mantido em nosso banco de talentos para futuras oportunidades alinhadas à sua experiência.</p>
              <p>Desejamos sucesso em sua trajetória profissional e esperamos revê-lo(a) em outros processos.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br><strong>LotusArev Consulting</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CURRICULO_RECEBIDO: {
    subject: 'Agradecimento por sua candidatura',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
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
              <p>Prezado(a) Candidato(a),</p>
              <p>Agradecemos por sua candidatura à posição divulgada e pelo interesse em participar dos processos conduzidos por nossa consultoria.</p>
              <p>Todos os currículos recebidos são analisados com atenção e avaliados de acordo com os requisitos da vaga.</p>
              <p>Caso seu perfil esteja alinhado às necessidades do nosso cliente, entraremos em contato para as próximas etapas. Caso contrário, seu currículo permanecerá em nosso banco de talentos para futuras oportunidades compatíveis com sua experiência.</p>
              <p>Desejamos sucesso em sua trajetória profissional e agradecemos sua confiança em nosso trabalho.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br><strong>Equipe LotusArev Consulting</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CONVITE_ENTREVISTA: {
    subject: 'Convite para entrevista',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Convite para entrevista</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${params.candidatoNome}</strong>,</p>
              <p>Gostaríamos de convidá-lo(a) para uma entrevista online (via Google Meet) referente à vaga de <strong>${params.vagaTitulo}</strong>.</p>
              <p>Por gentileza, responda a este e-mail informando seus horários disponíveis nos próximos dias para agendarmos o melhor momento.</p>
              <p>Ficamos à disposição para qualquer dúvida.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br><strong>LotusArev Consulting</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  CV_ENVIADO_CLIENTE: {
    subject: 'Encaminhamento de seu currículo',
    getHtmlContent: (params: {
      candidatoNome: string;
      vagaTitulo: string;
    }) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Encaminhamento de seu currículo</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${params.candidatoNome}</strong>,</p>
              <p>Após a etapa de entrevistas conduzida pela LotusArev, informamos que seu currículo foi encaminhado para avaliação do nosso cliente, responsável pela posição de <strong>${params.vagaTitulo}</strong>.</p>
              <p>Assim que tivermos um retorno sobre o andamento do processo, entraremos em contato.</p>
              <p>Agradecemos novamente por sua participação e confiança.</p>
            </div>
            <div class="footer">
              <p>Atenciosamente,<br><strong>LotusArev Consulting</strong></p>
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

  // Helper para converter formato antigo para SendGrid
  private createSendGridPayload(params: {
    from: EmailSender;
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    categories?: string[];
  }): SendGridRequest {
    // Debug: log dos parâmetros recebidos
    console.log('createSendGridPayload - params:', {
      from: params.from,
      to: params.to,
      subject: params.subject,
      hasHtmlContent: !!params.htmlContent
    });

    // Validação: to é obrigatório e deve ter pelo menos um destinatário
    if (!params.to || params.to.length === 0) {
      console.error('Erro de validação - to inválido:', params.to);
      throw new Error('Campo "to" é obrigatório e deve conter pelo menos um destinatário');
    }

    // Validação adicional: verificar se os emails em to são válidos
    for (let i = 0; i < params.to.length; i++) {
      const recipient = params.to[i];
      if (!recipient.email || recipient.email.trim() === '') {
        console.error(`Erro de validação - destinatário ${i} sem email:`, recipient);
        throw new Error(`Destinatário ${i + 1} não possui email válido`);
      }
    }

    // Validação: from é obrigatório
    if (!params.from || !params.from.email) {
      throw new Error('Campo "from" é obrigatório e deve conter um email válido');
    }

    // Validação: subject é obrigatório
    if (!params.subject || params.subject.trim() === '') {
      throw new Error('Campo "subject" é obrigatório');
    }

    const content: Array<{ type: string; value: string }> = [];
    
    if (params.htmlContent) {
      content.push({
        type: 'text/html',
        value: params.htmlContent
      });
    }
    
    if (params.textContent) {
      content.push({
        type: 'text/plain',
        value: params.textContent
      });
    }

    // Validação: content é obrigatório
    if (content.length === 0) {
      throw new Error('Campo "content" é obrigatório - deve ter htmlContent ou textContent');
    }

    // Construir personalizations corretamente
    const personalization: {
      to: EmailRecipient[];
      cc?: EmailRecipient[];
      bcc?: EmailRecipient[];
    } = {
      to: params.to
    };

    // Só adicionar cc e bcc se existirem e não estiverem vazios
    if (params.cc && params.cc.length > 0) {
      personalization.cc = params.cc;
    }
    
    if (params.bcc && params.bcc.length > 0) {
      personalization.bcc = params.bcc;
    }

    const payload: any = {
      from: params.from,
      personalizations: [personalization],
      subject: params.subject,
      content,
      // HACK: Adicionar também 'to' no nível raiz caso a Edge Function esteja procurando aqui
      to: params.to
    };

    // Só adicionar categories se existir
    if (params.categories && params.categories.length > 0) {
      payload.categories = params.categories;
    }

    console.log('SendGrid Payload (com hack to):', JSON.stringify(payload, null, 2));

    return payload;
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
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        empresaNome: params.empresaNome,
        proximosPassos: params.proximosPassos
      }),
      categories: ['candidato-aprovado', 'processo-seletivo']
    });
    
    return await this.sendEmail(payload);
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
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        empresaNome: params.empresaNome,
        feedback: params.feedback
      }),
      categories: ['candidato-rejeitado', 'processo-seletivo']
    });
    
    return await this.sendEmail(payload);
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
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.clienteEmail, name: params.clienteNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        clienteNome: params.clienteNome,
        vagaTitulo: params.vagaTitulo,
        candidatoContratado: params.candidatoContratado,
        consultorNome: params.consultorNome,
        dataFechamento: params.dataFechamento
      }),
      categories: ['posicao-fechada', 'cliente']
    });
    
    return await this.sendEmail(payload);
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
    // Debug e validação
    console.log('sendNotificacaoKanban - params:', {
      candidatoEmail: params.candidatoEmail,
      candidatoNome: params.candidatoNome,
      vagaTitulo: params.vagaTitulo,
      novoStatus: params.novoStatus
    });

    // Validação do email do candidato
    if (!params.candidatoEmail || params.candidatoEmail.trim() === '') {
      throw new Error('Email do candidato é obrigatório para envio de notificação');
    }

    const template = EMAIL_TEMPLATES.NOTIFICACAO_KANBAN;
    
    // Log específico do array 'to' antes de criar o payload
    const toArray = [{ email: params.candidatoEmail, name: params.candidatoNome }];
    console.log('sendNotificacaoKanban - array TO:', JSON.stringify(toArray, null, 2));
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: toArray,
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        novoStatus: params.novoStatus,
        consultorNome: params.consultorNome,
        observacoes: params.observacoes
      }),
      categories: ['kanban-update', 'status-change']
    });
    
    return await this.sendEmail(payload);
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
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        consultorNome: params.consultorNome,
        empresaNome: params.empresaNome
      }),
      categories: ['candidato-nao-aproveitado', 'triagem-inicial']
    });
    
    return await this.sendEmail(payload);
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
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        consultorNome: params.consultorNome,
        empresaNome: params.empresaNome
      }),
      categories: ['candidato-nao-aproveitado', 'entrevista-consultor']
    });
    
    return await this.sendEmail(payload);
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
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo,
        consultorNome: params.consultorNome,
        empresaNome: params.empresaNome
      }),
      categories: ['candidato-nao-aproveitado', 'entrevista-empresa']
    });
    
    return await this.sendEmail(payload);
  }

  /**
   * Envia email de currículo recebido (FASE 1)
   */
  async sendCurriculoRecebido(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CURRICULO_RECEBIDO;
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo
      }),
      categories: ['curriculo-recebido', 'fase-1']
    });
    
    return await this.sendEmail(payload);
  }

  /**
   * Envia convite para entrevista (FASE 2)
   */
  async sendConviteEntrevista(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CONVITE_ENTREVISTA;
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo
      }),
      categories: ['convite-entrevista', 'fase-2']
    });
    
    return await this.sendEmail(payload);
  }

  /**
   * Envia email de CV enviado ao cliente (FASE 3)
   */
  async sendCvEnviadoCliente(params: {
    candidatoEmail: string;
    candidatoNome: string;
    vagaTitulo: string;
    sender?: EmailSender;
  }): Promise<SendEmailResponse> {
    const template = EMAIL_TEMPLATES.CV_ENVIADO_CLIENTE;
    
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: [{ email: params.candidatoEmail, name: params.candidatoNome }],
      subject: template.subject,
      htmlContent: template.getHtmlContent({
        candidatoNome: params.candidatoNome,
        vagaTitulo: params.vagaTitulo
      }),
      categories: ['cv-enviado-cliente', 'fase-3']
    });
    
    return await this.sendEmail(payload);
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
    categories?: string[];
  }): Promise<SendEmailResponse> {
    const payload = this.createSendGridPayload({
      from: params.sender || DEFAULT_SENDER,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      categories: params.categories || ['custom-email']
    });
    
    return await this.sendEmail(payload);
  }

  /**
   * Método de teste para verificar payload gerado
   */
  async testPayloadGeneration(): Promise<SendGridRequest> {
    const payload = this.createSendGridPayload({
      from: DEFAULT_SENDER,
      to: [{ email: 'test@example.com', name: 'Test User' }],
      subject: 'Test Email - Lotus Recruit Hub',
      htmlContent: '<h1>Email de teste</h1><p>Este é um email de teste do sistema.</p>',
      categories: ['test', 'debug']
    });
    
    return payload;
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