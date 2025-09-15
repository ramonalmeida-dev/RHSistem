# 📧 Integração Brevo Email - Lotus Recruit Hub

## 📋 Visão Geral

O módulo de email Brevo fornece uma solução completa e reutilizável para envio de emails transacionais no sistema Lotus Recruit Hub. Inclui templates pré-definidos para diferentes contextos do processo de recrutamento e uma API flexível para emails personalizados.

## 🏗️ Arquitetura

### Frontend (`src/lib/brevoEmailService.ts`)
- **Serviço Principal**: `BrevoEmailService` - classe singleton para gerenciar envios
- **Templates**: Templates HTML pré-definidos para diferentes cenários
- **Tipos TypeScript**: Interfaces completas para tipagem segura
- **Validação**: Funções utilitárias para validação de emails

### Backend (`supabase/functions/brevo-email/`)
- **Edge Function**: Função serverless para integração com API Brevo
- **Validação**: Validação robusta de dados de entrada
- **Error Handling**: Tratamento completo de erros
- **CORS**: Suporte completo para requisições cross-origin

### Componentes React
- **EmailModal**: Modal reutilizável para composição de emails
- **useBrevoEmail**: Hook personalizado para facilitar uso

## 🔧 Configuração

### 1. API Key Brevo
A chave da API está configurada na Edge Function:
```typescript
const BREVO_API_KEY = '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';
```

### 2. Email Remetente Padrão
Configure o email verificado na Brevo:
```typescript
export const DEFAULT_SENDER: EmailSender = {
  name: 'Lotus Recruit Hub',
  email: 'noreply@lotusrecruithub.com' // Substitua pelo email verificado
};
```

## 📧 Templates Disponíveis

### 1. Candidato Aprovado
```typescript
await brevoEmailService.sendCandidatoAprovado({
  candidatoEmail: 'candidato@email.com',
  candidatoNome: 'João Silva',
  vagaTitulo: 'Desenvolvedor Frontend',
  empresaNome: 'Tech Corp',
  proximosPassos: 'Aguarde contato do RH em 48h'
});
```

### 2. Candidato Rejeitado
```typescript
await brevoEmailService.sendCandidatoRejeitado({
  candidatoEmail: 'candidato@email.com',
  candidatoNome: 'João Silva',
  vagaTitulo: 'Desenvolvedor Frontend',
  empresaNome: 'Tech Corp',
  feedback: 'Perfil não se adequa aos requisitos técnicos'
});
```

### 3. Posição Fechada
```typescript
await brevoEmailService.sendPosicaoFechada({
  clienteEmail: 'cliente@empresa.com',
  clienteNome: 'Maria Santos',
  vagaTitulo: 'Desenvolvedor Frontend',
  candidatoContratado: 'João Silva',
  consultorNome: 'Ana Costa',
  dataFechamento: '15/01/2024'
});
```

### 4. Notificação Kanban
```typescript
await brevoEmailService.sendNotificacaoKanban({
  candidatoEmail: 'candidato@email.com',
  candidatoNome: 'João Silva',
  vagaTitulo: 'Desenvolvedor Frontend',
  novoStatus: 'Entrevista Técnica',
  consultorNome: 'Ana Costa',
  observacoes: 'Entrevista agendada para 20/01 às 14h'
});
```

## 🎯 Uso Prático

### 1. Hook useBrevoEmail
```typescript
import { useBrevoEmail } from '@/hooks/useBrevoEmail';

function MeuComponente() {
  const { sendCandidatoAprovado, isLoading, error } = useBrevoEmail();

  const handleAprovarCandidato = async () => {
    await sendCandidatoAprovado({
      candidatoEmail: 'candidato@email.com',
      candidatoNome: 'João Silva',
      vagaTitulo: 'Desenvolvedor Frontend',
      empresaNome: 'Tech Corp'
    });
  };

  return (
    <button 
      onClick={handleAprovarCandidato} 
      disabled={isLoading}
    >
      {isLoading ? 'Enviando...' : 'Aprovar Candidato'}
    </button>
  );
}
```

### 2. Modal de Email
```typescript
import { EmailModal } from '@/components/email/EmailModal';

function MeuComponente() {
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setEmailModalOpen(true)}>
        Enviar Email
      </button>
      
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        defaultRecipient={{ email: 'candidato@email.com', name: 'João Silva' }}
        defaultTemplate="CANDIDATO_APROVADO"
        templateParams={{
          candidatoNome: 'João Silva',
          vagaTitulo: 'Desenvolvedor Frontend',
          empresaNome: 'Tech Corp'
        }}
      />
    </>
  );
}
```

### 3. Email Personalizado
```typescript
await brevoEmailService.sendCustomEmail({
  to: [{ email: 'destinatario@email.com', name: 'Nome Destinatário' }],
  subject: 'Assunto Personalizado',
  htmlContent: '<h1>Olá!</h1><p>Este é um email personalizado.</p>',
  tags: ['custom', 'manual-send']
});
```

## 🔄 Integração com Kanban

### Exemplo de uso no KanbanBoard:
```typescript
import { useBrevoEmail } from '@/hooks/useBrevoEmail';

function KanbanBoard() {
  const { sendNotificacaoKanban } = useBrevoEmail();

  const handleStatusChange = async (candidato: any, novoStatus: string) => {
    // Atualizar status no banco
    await updateCandidatoStatus(candidato.id, novoStatus);
    
    // Enviar notificação por email
    await sendNotificacaoKanban({
      candidatoEmail: candidato.email,
      candidatoNome: candidato.nome,
      vagaTitulo: candidato.vaga.titulo,
      novoStatus,
      consultorNome: 'Ana Costa',
      observacoes: 'Status atualizado automaticamente'
    });
  };
}
```

## 🔄 Integração com Fechamento de Vagas

### Exemplo no fluxo de posições fechadas:
```typescript
import { useBrevoEmail } from '@/hooks/useBrevoEmail';

function PosicoesFechadas() {
  const { sendPosicaoFechada } = useBrevoEmail();

  const handleFecharPosicao = async (vaga: any, candidatoContratado: any) => {
    // Fechar posição no banco
    await fecharPosicao(vaga.id, candidatoContratado.id);
    
    // Notificar cliente
    await sendPosicaoFechada({
      clienteEmail: vaga.cliente.email,
      clienteNome: vaga.cliente.nome,
      vagaTitulo: vaga.titulo,
      candidatoContratado: candidatoContratado.nome,
      consultorNome: 'Ana Costa',
      dataFechamento: new Date().toLocaleDateString('pt-BR')
    });
  };
}
```

## 🛠️ Personalização de Templates

### Criando novos templates:
```typescript
// Adicionar ao EMAIL_TEMPLATES em brevoEmailService.ts
NOVO_TEMPLATE: {
  subject: 'Assunto do Template',
  getHtmlContent: (params: { param1: string; param2: string }) => `
    <html>
      <head>
        <style>
          /* CSS personalizado */
        </style>
      </head>
      <body>
        <h1>Olá ${params.param1}!</h1>
        <p>${params.param2}</p>
      </body>
    </html>
  `
}
```

### Adicionando método ao serviço:
```typescript
async sendNovoTemplate(params: {
  email: string;
  nome: string;
  param1: string;
  param2: string;
}): Promise<SendEmailResponse> {
  const template = EMAIL_TEMPLATES.NOVO_TEMPLATE;
  
  return await this.sendEmail({
    sender: DEFAULT_SENDER,
    to: [{ email: params.email, name: params.nome }],
    subject: template.subject,
    htmlContent: template.getHtmlContent({
      param1: params.param1,
      param2: params.param2
    }),
    tags: ['novo-template']
  });
}
```

## 🔍 Monitoramento e Logs

### Logs da Edge Function
```typescript
// Logs automáticos incluem:
console.log('Enviando email via Brevo:', {
  to: emails_destinatarios,
  subject: assunto,
  sender: remetente
});

console.log('Email enviado com sucesso:', responseData);
console.error('Erro na API Brevo:', errorDetails);
```

### Verificação de Status
```typescript
const result = await brevoEmailService.sendEmail(request);

if (result.success) {
  console.log('Email enviado:', result.messageId);
} else {
  console.error('Erro:', result.error);
}
```

## 🚨 Tratamento de Erros

### Tipos de Erro Comuns:
1. **Validação**: Email inválido, campos obrigatórios
2. **API Brevo**: Quota excedida, email não verificado
3. **Rede**: Timeout, conexão perdida
4. **Interno**: Erro na Edge Function

### Exemplo de Tratamento:
```typescript
try {
  const result = await brevoEmailService.sendCandidatoAprovado(params);
  
  if (!result.success) {
    // Log específico do erro
    console.error('Falha no envio:', result.error);
    
    // Notificar usuário
    toast.error(`Não foi possível enviar o email: ${result.error}`);
    
    // Opcional: tentar novamente ou salvar para reenvio posterior
  }
} catch (error) {
  console.error('Erro crítico:', error);
  toast.error('Erro interno do sistema');
}
```

## 📊 Métricas e Analytics

### Tags para Rastreamento:
- `candidato-aprovado`: Emails de aprovação
- `candidato-rejeitado`: Emails de rejeição  
- `posicao-fechada`: Notificações de fechamento
- `kanban-update`: Atualizações de status
- `custom-email`: Emails personalizados
- `manual-send`: Envios manuais

### Exemplo de Uso:
```typescript
await brevoEmailService.sendEmail({
  // ... outros parâmetros
  tags: ['candidato-aprovado', 'vaga-urgente', 'q1-2024']
});
```

## 🔐 Segurança

### Validações Implementadas:
- ✅ Validação de formato de email
- ✅ Sanitização de HTML básica
- ✅ Validação de campos obrigatórios
- ✅ Rate limiting via Brevo
- ✅ CORS configurado

### Recomendações:
- Manter API key segura (considerar variáveis de ambiente)
- Validar permissões antes de enviar emails
- Implementar logs de auditoria
- Monitorar uso da quota Brevo

## 🚀 Deploy e Produção

### Checklist de Deploy:
- [ ] API key Brevo configurada
- [ ] Email remetente verificado na Brevo
- [ ] Edge Function deployada
- [ ] Templates testados
- [ ] Logs configurados
- [ ] Monitoramento ativo

### Variáveis de Ambiente (Recomendado):
```typescript
// Substituir hardcoded por:
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const DEFAULT_SENDER_EMAIL = Deno.env.get('DEFAULT_SENDER_EMAIL');
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs da Edge Function
2. Testar API Brevo diretamente
3. Validar configurações de DNS/SPF
4. Consultar documentação Brevo: https://developers.brevo.com/

---

**Módulo criado em**: Janeiro 2025  
**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0 