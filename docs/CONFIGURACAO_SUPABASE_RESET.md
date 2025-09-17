# 🔧 Configuração do Supabase para Reset de Senha

## Passos Obrigatórios

### 1. Configurar Site URL
No dashboard do Supabase, vá em:
- **Authentication** → **Settings** → **General**
- **Site URL**: `http://localhost:5173` (desenvolvimento)
- **Site URL**: `https://seu-dominio.com` (produção)

### 2. Configurar Redirect URLs
Na mesma seção:
- **Redirect URLs**: 
  - `http://localhost:5173/reset-senha` (desenvolvimento)
  - `https://seu-dominio.com/reset-senha` (produção)

### 3. Verificar Email Templates
Em **Authentication** → **Email Templates**:
- **Reset Password**: Verificar se o template está ativo
- **Link**: Deve apontar para `{{ .SiteURL }}/reset-senha`

### 4. Verificar Configuração de Email
Em **Authentication** → **Settings** → **SMTP Settings**:
- Configurar provedor de email (ou usar o padrão do Supabase)

## Teste Local

### Pré-requisitos
1. Usuário deve existir na tabela `auth.users` do Supabase
2. Email do usuário deve estar confirmado
3. URLs configuradas corretamente

### Como Testar
1. Acesse `http://localhost:5173/recuperar-senha`
2. Digite um email válido de usuário existente
3. Verifique o email recebido
4. Clique no link do email
5. Deve redirecionar para `/reset-senha` com tokens na URL

### URL de Exemplo
O link do email deve ser algo como:
```
http://localhost:5173/reset-senha#access_token=eyJ...&expires_in=3600&refresh_token=...&token_type=bearer&type=recovery
```

## Solução de Problemas

### "Sessão Inválida"
- ✅ Verificar se as URLs estão configuradas no Supabase
- ✅ Confirmar que o usuário existe no Auth
- ✅ Verificar se o email foi enviado
- ✅ Verificar se o link não expirou (1 hora por padrão)

### "Email não chegou"
- ✅ Verificar configuração SMTP
- ✅ Verificar caixa de spam
- ✅ Confirmar que o email existe no Auth

### Console Logs
Abra o DevTools e verifique os logs:
- URL com tokens
- Status da sessão
- Erros de autenticação

## Configuração Avançada

### Custom Email Provider
Para usar SendGrid, Mailgun, etc:
```sql
-- No SQL Editor do Supabase
UPDATE auth.config 
SET smtp_host = 'smtp.sendgrid.net',
    smtp_port = 587,
    smtp_user = 'apikey',
    smtp_pass = 'sua-api-key',
    smtp_sender_name = 'Lotus Recruit Hub',
    smtp_sender = 'noreply@seudominio.com';
```

### Template Personalizado
HTML do template de reset:
```html
<h2>Redefinir Senha - Lotus Recruit Hub</h2>
<p>Você solicitou a redefinição de sua senha.</p>
<p><a href="{{ .ConfirmationURL }}">Clique aqui para redefinir sua senha</a></p>
<p>Este link expira em 1 hora.</p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
``` 