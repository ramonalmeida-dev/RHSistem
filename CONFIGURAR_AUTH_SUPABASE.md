# 🔧 Configuração Auth Supabase - Sem Confirmação de Email

## 📋 Configurações no Dashboard Supabase

Para permitir que candidatos se registrem e façam login imediatamente sem confirmação de email:

### 1. Acessar Configurações de Auth
1. Acesse o [Dashboard Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** > **Settings**

### 2. Configurar Email Templates
1. Na seção **Auth Settings**:
   - ✅ **Enable email confirmations**: **DESABILITAR**
   - ✅ **Enable email change confirmations**: **DESABILITAR**
   - ✅ **Enable secure email change**: **MANTER ATIVADO**

### 3. Configurações Avançadas
Na seção **Security**:
- ✅ **Enable database password hashing**: **ATIVADO**
- ✅ **Enable row level security**: **ATIVADO**

### 4. Site URL
Em **Site URL**, adicione:
```
http://localhost:5173
```
(Para desenvolvimento local)

Para produção, adicione:
```
https://seudominio.vercel.app
```

## 🚀 Como Funciona Agora

### Fluxo de Registro:
1. **Usuário registra** → `supabase.auth.signUp()`
2. **Sem confirmação de email** → usuário fica ativo imediatamente
3. **Login automático** → `supabase.auth.signInWithPassword()`
4. **Redirecionamento** → dashboard do candidato

### Logs de Debug:
O sistema agora mostra logs detalhados:
- 🚀 Iniciando registro
- ✅ Usuário criado no Auth
- 📝 Criando candidato na tabela
- ✅ Candidato criado na tabela
- 🔄 Fazendo login automático (se necessário)
- ✅ Login automático realizado

## 🔍 Troubleshooting

### Se ainda pedir confirmação de email:
1. Verifique se **Enable email confirmations** está DESABILITADO
2. Limpe o cache do navegador
3. Teste com email diferente

### Se login automático falhar:
- O sistema mostra: "Conta criada com sucesso! Agora você pode fazer login."
- Usuário pode fazer login manualmente na tela de login

## ✅ Resultado Esperado

Após essas configurações:
1. **Registro** → Imediato, sem email
2. **Login** → Automático após registro
3. **Dashboard** → Acesso direto
4. **Upload** → Funcionando com RLS
5. **Candidatura** → Processamento normal

---

💡 **Nota**: Para produção, considere reativar confirmação de email para maior segurança. 