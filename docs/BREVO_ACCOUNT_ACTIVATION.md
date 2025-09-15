# 🔧 Ativação da Conta Brevo - Guia Completo

## 🚨 Problema Atual

**Erro**: `SMTP account is not yet activated. Please contact us at contact@brevo.com to request activation`

**Causa**: Contas novas da Brevo precisam de ativação manual para envio de emails transacionais.

## ✅ Solução Imediata (Desenvolvimento)

### Sistema de Fallback Implementado
O sistema agora detecta automaticamente quando a conta não está ativada e:

1. **Simula o envio** do email
2. **Atualiza o status** do candidato normalmente  
3. **Mostra notificação** de sucesso com indicação de simulação
4. **Registra logs** para acompanhamento

### Como Funciona
```typescript
// Quando erro de conta não ativada é detectado:
if (shouldUseFallback(emailResult.error)) {
  // Simula envio
  simulateEmail({
    to: candidate.email,
    subject: templateInfo.name,
    template: emailConfig.templateType
  });
  
  // Mostra sucesso simulado
  toast.success(`📧 Email simulado para ${candidate.name} (Conta Brevo não ativada)`);
}
```

## 🔄 Solução Definitiva (Produção)

### Passo 1: Contatar Brevo
📧 **Email**: contact@brevo.com

**Assunto**: Solicitação de Ativação SMTP - Conta [SEU_EMAIL]

**Mensagem**:
```
Olá equipe Brevo,

Gostaria de solicitar a ativação da minha conta SMTP para envio de emails transacionais.

Detalhes da conta:
- Email: [seu_email@dominio.com]
- Tipo de uso: Emails transacionais para sistema de recrutamento
- Volume estimado: [X emails por dia/mês]

Aguardo retorno.

Atenciosamente,
[Seu Nome]
```

### Passo 2: Aguardar Ativação
- ⏱️ **Tempo**: 24-48 horas úteis
- 📧 **Confirmação**: Brevo enviará email confirmando ativação
- ✅ **Teste**: Após ativação, testar envio real

### Passo 3: Configurar Domínio (Recomendado)
1. **Verificar domínio** no painel Brevo
2. **Configurar SPF/DKIM** para melhor entregabilidade
3. **Usar email do domínio** como remetente

## 🛠️ Configuração Atual vs Recomendada

### ❌ Configuração Atual (Temporária)
```typescript
const DEFAULT_SENDER = {
  name: 'Lotus Recruit Hub',
  email: 'noreply@lotusrecruithub.com' // Email não verificado
};
```

### ✅ Configuração Recomendada (Após Ativação)
```typescript
const DEFAULT_SENDER = {
  name: 'Lotus Recruit Hub',
  email: 'noreply@seudominio.com' // Email do seu domínio verificado
};
```

## 📊 Monitoramento Durante Desenvolvimento

### Logs de Emails Simulados
- **Local**: Console do navegador
- **Formato**: `📧 EMAIL SIMULADO: { para, assunto, template, timestamp }`
- **Persistência**: Mantém últimos 50 emails simulados

### Exemplo de Log
```javascript
📧 EMAIL SIMULADO: {
  para: "ramon@testessss.com",
  assunto: "Não aproveitado - Triagem",
  template: "triagem",
  timestamp: "13/01/2025 14:30:25"
}
```

## 🔍 Como Verificar se Conta Foi Ativada

### Teste Manual
1. Mover candidato no Kanban
2. Escolher "Sim" para enviar email
3. Verificar toast de notificação:
   - ✅ **Ativada**: "Email enviado para [Nome]"
   - ⚠️ **Não ativada**: "📧 Email simulado para [Nome] (Conta Brevo não ativada)"

### Teste via API
```bash
curl --request POST \
  --url https://api.brevo.com/v3/smtp/email \
  --header 'accept: application/json' \
  --header 'api-key: SUA_API_KEY' \
  --header 'content-type: application/json' \
  --data '{
    "sender": {"name": "Teste", "email": "seu@email.com"},
    "to": [{"email": "teste@email.com", "name": "Teste"}],
    "subject": "Teste de Ativação",
    "htmlContent": "<p>Teste</p>"
  }'
```

## 🚀 Após Ativação da Conta

### Checklist
- [ ] Receber confirmação da Brevo
- [ ] Testar envio real no sistema
- [ ] Configurar domínio próprio (opcional)
- [ ] Configurar SPF/DKIM (recomendado)
- [ ] Monitorar taxa de entrega
- [ ] Desabilitar logs de simulação (opcional)

### Configurações Avançadas
```typescript
// Após ativação, você pode:
1. Usar templates da Brevo (templateId)
2. Configurar webhooks para tracking
3. Implementar listas de contatos
4. Usar segmentação avançada
```

## 📈 Métricas Pós-Ativação

### KPIs Importantes
- **Taxa de Entrega**: >95%
- **Taxa de Abertura**: 20-30%
- **Taxa de Bounce**: <5%
- **Reclamações de Spam**: <0.1%

### Monitoramento
- Dashboard Brevo para estatísticas
- Webhooks para eventos em tempo real
- Logs do sistema para debugging

## 🔧 Troubleshooting

### Problemas Comuns Pós-Ativação

#### 1. Emails na Pasta Spam
**Solução**: Configurar SPF, DKIM e DMARC

#### 2. Taxa de Bounce Alta
**Solução**: Validar emails antes do envio

#### 3. Limite de Envio Atingido
**Solução**: Verificar plano Brevo e fazer upgrade se necessário

#### 4. Domínio Não Verificado
**Solução**: Adicionar registros DNS conforme instruções Brevo

## 📞 Suporte

### Contatos Brevo
- **Email**: contact@brevo.com
- **Suporte Técnico**: Via painel Brevo
- **Documentação**: https://developers.brevo.com/

### Suporte Interno
- **Logs**: Console do navegador
- **Fallback**: Sistema automático durante desenvolvimento
- **Monitoramento**: Toast notifications no sistema

---

**Status Atual**: 🟡 Conta não ativada - Sistema em modo fallback  
**Próximo Passo**: Contatar contact@brevo.com para ativação  
**ETA**: 24-48h após solicitação 