// Serviço de Email Automático para o Sistema de Recrutamento
// Baseado nos templates do arquivo Emails.txt

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  triggerStatus: string[];
}

export interface EmailData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  consultantName: string;
  customMessage?: string;
}

// Templates de email baseados no arquivo Emails.txt
export const emailTemplates: EmailTemplate[] = [
  {
    id: "triagem_inicial",
    name: "Não foram aproveitados ainda na triagem inicial",
    subject: "Agradecimento por sua candidatura",
    body: `Olá [Nome],

Agradecemos por ter se candidatado à vaga [Título da Vaga] e pelo interesse em fazer parte de nossa rede de talentos.

Após análise, seu perfil não foi selecionado para continuidade neste processo específico. No entanto, seu currículo permanecerá ativo em nosso banco de dados para futuras oportunidades compatíveis com sua experiência.

Seguimos à disposição e desejamos sucesso em sua trajetória profissional.

Atenciosamente,  
[Consultor]`,
    triggerStatus: ["reprovado"]
  },
  {
    id: "entrevista_consultor",
    name: "Foram entrevistados pelo consultor, mas não seguirão para entrevista na empresa",
    subject: "Agradecimento por sua participação no processo seletivo",
    body: `Olá [Nome],

Agradecemos por sua participação na entrevista referente à vaga [Título da Vaga] e pelo tempo dedicado para compartilhar sua trajetória profissional conosco.

Após avaliação, identificamos que neste momento o perfil buscado pela empresa segue em outra direção. Entretanto, seu currículo continuará ativo para futuras vagas que estejam alinhadas à sua experiência.

Foi um prazer conhecê-lo(a) e esperamos poder contar com sua participação novamente.

Atenciosamente,  
[Consultor]`,
    triggerStatus: ["reprovado"]
  },
  {
    id: "entrevista_empresa",
    name: "Foram entrevistados pela empresa, mas não serão aproveitados agora",
    subject: "Retorno sobre o processo seletivo",
    body: `Olá [Nome],

Foi um prazer contar com sua participação nas etapas do processo seletivo para a vaga [Título da Vaga].

Após criteriosa análise, informamos que, neste momento, o processo seguirá com outro(a) candidato(a). Gostaríamos de reforçar que sua experiência e competências foram muito bem avaliadas, e por isso manteremos seu currículo ativo para futuras oportunidades.

Agradecemos novamente pela disponibilidade e desejamos muito sucesso em sua carreira.

Atenciosamente,  
[Consultor]`,
    triggerStatus: ["reprovado"]
  },
  {
    id: "cv_enviado",
    name: "CV enviado para o cliente",
    subject: "Seu currículo foi enviado para análise",
    body: `Olá [Nome],

Informamos que seu currículo foi enviado para análise na empresa [Empresa] para a vaga [Título da Vaga].

Aguardaremos o retorno da empresa e entraremos em contato assim que houver novidades sobre o processo seletivo.

Agradecemos sua paciência e interesse.

Atenciosamente,  
[Consultor]`,
    triggerStatus: ["curriculo_enviado"]
  },
  {
    id: "entrevista_agendada",
    name: "Entrevista agendada",
    subject: "Entrevista agendada - [Título da Vaga]",
    body: `Olá [Nome],

Sua entrevista para a vaga [Título da Vaga] na empresa [Empresa] foi agendada.

Em breve você receberá os detalhes da entrevista por e-mail ou telefone.

Boa sorte!

Atenciosamente,  
[Consultor]`,
    triggerStatus: ["entrevista_agendada"]
  },
  {
    id: "aprovado",
    name: "Candidato aprovado",
    subject: "Parabéns! Você foi aprovado(a)!",
    body: `Olá [Nome],

Temos o prazer de informar que você foi aprovado(a) para a vaga [Título da Vaga] na empresa [Empresa]!

Em breve entraremos em contato para os próximos passos do processo de contratação.

Parabéns!

Atenciosamente,  
[Consultor]`,
    triggerStatus: ["aprovado"]
  }
];

// Função para substituir placeholders no template
export function replaceEmailPlaceholders(template: string, data: EmailData): string {
  return template
    .replace(/\[Nome\]/g, data.candidateName)
    .replace(/\[Título da Vaga\]/g, data.jobTitle)
    .replace(/\[Empresa\]/g, data.companyName)
    .replace(/\[Consultor\]/g, data.consultantName);
}

// Função para obter template baseado no status
export function getEmailTemplateByStatus(status: string): EmailTemplate | null {
  return emailTemplates.find(template => 
    template.triggerStatus.includes(status)
  ) || null;
}

// Função para gerar email completo
export function generateEmail(status: string, data: EmailData): { subject: string; body: string } | null {
  const template = getEmailTemplateByStatus(status);
  if (!template) return null;

  return {
    subject: replaceEmailPlaceholders(template.subject, data),
    body: replaceEmailPlaceholders(template.body, data)
  };
}

// Função para enviar email (simulação - em produção seria integrado com serviço de email)
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    // Aqui seria integrado com serviço de email real (SendGrid, AWS SES, etc.)
    // Em desenvolvimento, apenas simula o envio
    
    // Simulação de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

// Função para enviar email automático baseado no status
export async function sendAutomaticEmail(
  candidateEmail: string, 
  status: string, 
  data: EmailData
): Promise<boolean> {
  const email = generateEmail(status, data);
  if (!email) {
    // Nenhum template encontrado para o status
    return false;
  }

  return await sendEmail(candidateEmail, email.subject, email.body);
} 