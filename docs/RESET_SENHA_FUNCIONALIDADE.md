# 🔑 Funcionalidade de Alteração de Senha (Admin)

## Visão Geral

Sistema de alteração de senhas pelo administrador no Lotus Recruit Hub, implementado com **Service Role** do Supabase para máxima segurança.

## 🚀 Funcionalidades Implementadas

### 1. Edge Function `alterar-senha-admin`
- **Localização**: `supabase/functions/alterar-senha-admin/index.ts`
- **Método**: POST
- **Autenticação**: Service Role + JWT do usuário admin
- **Funcionalidades**:
  - ✅ Verificação de permissões de admin
  - ✅ Validação de força da senha
  - ✅ Alteração via `supabase.auth.admin.updateUserById()`
  - ✅ Atualização da tabela `usuarios` (hash bcrypt)
  - ✅ Logs de segurança

### 2. Interface Admin

#### Modal `EditConsultorModal` - Edição de Usuário
- Seção dedicada para alteração de senha
- Campo com toggle para mostrar/ocultar senha
- Botão para gerar senha aleatória
- Validação em tempo real
- Feedback visual de sucesso/erro
- Integração com permissões de admin

### 3. Serviço TypeScript
- **Arquivo**: `src/lib/resetSenhaService.ts`
- **Métodos**:
  - `solicitarReset(email)` - Usa Supabase Auth
  - `atualizarSenha(newPassword)` - Usa Supabase Auth
  - `verificarSessaoRecuperacao()` - Verifica sessão ativa
  - `validatePasswordMatch(password, confirmPassword)`
  - `getPasswordCriteria()`

### 4. Hook Personalizado
- **Arquivo**: `src/hooks/usePasswordReset.ts`
- **Funcionalidades**:
  - Detecta sessões de recuperação automaticamente
  - Monitora mudanças na URL (hash)
  - Gerencia estados de loading e erro
  - Integração com Supabase Auth

## 🔧 Configuração

### Variáveis de Ambiente Necessárias
```env
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### Configuração do Supabase
- **Auth Settings**: Configurar URLs de redirecionamento
- **Email Templates**: Personalizar templates de recuperação
- **Site URL**: Definir URL base da aplicação
- **Redirect URLs**: Adicionar `/reset-senha` como URL permitida

### Sem Necessidade de Migrações
✅ **Vantagem**: O Supabase Auth gerencia tudo internamente
- Não precisa de tabelas customizadas
- Tokens gerenciados automaticamente
- Expiração automática de tokens
- Segurança robusta por padrão

## 🎨 Interface do Usuário

### Design System
- **Cores**: Gradientes azul/índigo
- **Componentes**: shadcn/ui
- **Ícones**: Lucide React
- **Animações**: Transições suaves
- **Responsividade**: Mobile-first

### Estados da Interface
1. **Loading**: Spinners animados
2. **Sucesso**: Ícones de check com feedback verde
3. **Erro**: Alertas vermelhos com mensagens claras
4. **Validação**: Critérios de senha em tempo real

## 🔐 Segurança

### Validações Implementadas
- **Email**: Formato válido e usuário ativo
- **Token**: Unicidade, expiração (1 hora), uso único
- **Senha**: Mínimo 8 caracteres, maiúscula, minúscula, número
- **CORS**: Headers configurados adequadamente

### Proteções
- Tokens expiram em 1 hora
- Tokens são de uso único (flag `used`)
- Senhas são hasheadas com bcrypt
- Não exposição de informações sensíveis

## 📱 Fluxo de Uso

### Para o Usuário
1. Acessa `/login` e clica em "Esqueceu sua senha?"
2. Insere email em `/recuperar-senha`
3. Recebe email com link (em desenvolvimento, link no console)
4. Clica no link que leva para `/reset-senha?token=xxx`
5. Define nova senha seguindo critérios
6. Confirma senha e finaliza processo
7. É redirecionado para login

### Para o Desenvolvedor
1. `resetPasswordForEmail()` gera token automaticamente
2. Supabase envia email com link de recuperação
3. Hook `usePasswordReset` detecta sessão de recuperação
4. `updateUser()` atualiza senha de forma segura
5. Sessão é invalidada automaticamente

## 🧪 Testes

### Testando Localmente
1. Configure as URLs no dashboard do Supabase
2. Inicie o servidor: `npm run dev`
3. Acesse `http://localhost:5173/login`
4. Clique em "Esqueceu sua senha?"
5. Insira um email de usuário existente no Auth
6. Verifique o email recebido
7. Clique no link e defina nova senha

### Validações a Testar
- [ ] Email inválido/inexistente
- [ ] Sessão de recuperação inválida/expirada
- [ ] Acesso direto à página sem sessão
- [ ] Senha fraca
- [ ] Senhas não coincidem
- [ ] Fluxo completo de reset

## 🔄 Integrações e Melhorias

### ✅ Já Implementado via Supabase Auth
- ✅ Envio automático de emails
- ✅ Templates de email customizáveis
- ✅ Rate limiting integrado
- ✅ Logs de auditoria do Auth
- ✅ Tokens seguros e temporários

### Melhorias Futuras
- Personalização avançada de templates
- Integração com provedores de email externos
- Notificações de mudança de senha
- Reset via SMS (usando Supabase Auth)

## 📋 Arquivos Criados/Modificados

### Novos Arquivos
- `src/pages/RecuperarSenha.tsx`
- `src/pages/ResetSenha.tsx`
- `src/lib/resetSenhaService.ts`
- `src/hooks/usePasswordReset.ts`
- `docs/RESET_SENHA_FUNCIONALIDADE.md`

### Arquivos Modificados
- `src/App.tsx` - Rotas adicionadas
- `src/pages/Login.tsx` - Link "Esqueceu sua senha?"
- `src/lib/supabase.ts` - Habilitado `detectSessionInUrl`

### Arquivos Removidos
- ~~`supabase/functions/reset-senha/`~~ - Edge function desnecessária
- ~~Tabela `password_reset_tokens`~~ - Supabase Auth gerencia internamente

## ✅ Status

- [x] Edge Function implementada
- [x] Tabela do banco criada
- [x] Páginas frontend criadas
- [x] Serviço TypeScript implementado
- [x] Rotas configuradas
- [x] Design responsivo
- [x] Validações de segurança
- [ ] Integração com serviço de email
- [ ] Testes automatizados
- [ ] Deploy em produção

## 🎯 Próximos Passos

1. **Integrar serviço de email** (Brevo/SendGrid)
2. **Implementar testes automatizados**
3. **Adicionar logs de auditoria**
4. **Configurar rate limiting**
5. **Deploy e monitoramento** 