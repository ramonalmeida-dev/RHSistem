# Backend - Lotus Recruit Hub

## 🚀 Estrutura do Projeto

```
supabase/
├── config.toml              # Configuração do Supabase
├── types.ts                 # Tipos TypeScript
├── functions/               # Edge Functions
│   ├── auth-login/          # Autenticação
│   ├── usuarios/            # CRUD de usuários
│   ├── clientes/            # CRUD de clientes
│   ├── vagas/               # CRUD de vagas
│   ├── candidatos/          # CRUD de candidatos
│   ├── candidatos-vagas/    # Relacionamento candidato-vaga
│   ├── historico-status/    # Histórico de mudanças
│   ├── curriculos/          # Upload de currículos
│   ├── stats/               # Estatísticas
│   └── relatorios/          # Relatórios
├── migrations/              # Migrações do banco
└── seed/                    # Dados iniciais
```

## 📋 Pré-requisitos

1. **Supabase CLI** instalado
2. **Node.js** 18+ 
3. **Deno** (para Edge Functions)

## 🔧 Configuração

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Inicializar Projeto

```bash
supabase init
```

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# JWT Secret (para Edge Functions)
JWT_SECRET=your-super-secret-jwt-key-here
```

### 5. Conectar ao Projeto Remoto

```bash
supabase link --project-ref your-project-ref
```

## 🗄️ Banco de Dados

### Aplicar Migrações

```bash
# Aplicar todas as migrações
supabase db push

# Aplicar migração específica
supabase db push --include-all
```

### Reset do Banco (Desenvolvimento)

```bash
supabase db reset
```

### Verificar Status

```bash
supabase status
```

## 🔧 Edge Functions

### Deploy das Funções

```bash
# Deploy de todas as funções
supabase functions deploy

# Deploy de função específica
supabase functions deploy auth-login
```

### Desenvolvimento Local

```bash
# Iniciar Supabase local
supabase start

# Deploy local das funções
supabase functions serve
```

### Testar Funções

```bash
# Testar função de login
curl -X POST http://localhost:54321/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"senha123"}'
```

## 🔐 Autenticação

### Criar Primeiro Usuário Admin

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute:

```sql
INSERT INTO usuarios (email, senha_hash, nome, tipo, ativo)
VALUES (
  'admin@lotusrecruit.com',
  '$2b$10$...', -- Hash da senha usando bcrypt
  'Administrador',
  'admin',
  true
);
```

### Gerar Hash de Senha

```bash
# Usando Node.js
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('senha123', 10).then(hash => console.log(hash));
"
```

## 📊 Estrutura das Tabelas

### Usuários
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `senha_hash` (VARCHAR)
- `nome` (VARCHAR)
- `tipo` (ENUM: 'admin', 'consultor')
- `ativo` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Clientes
- `id` (UUID, PK)
- `razao_social` (VARCHAR)
- `cnpj` (VARCHAR, UNIQUE)
- `inscricao_estadual` (VARCHAR)
- `endereco_completo` (TEXT)
- `prazo_pagamento` (VARCHAR)
- `contato`, `celular`, `email` (VARCHAR)
- `ativo` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Vagas
- `id` (UUID, PK)
- `numero_vaga` (VARCHAR, UNIQUE)
- `empresa_id` (UUID, FK)
- `consultor_id` (UUID, FK)
- `cargo` (VARCHAR)
- `salario`, `local_trabalho` (VARCHAR)
- `data_*` (DATE) - várias datas do processo
- `perfil_word`, `informacoes_complementares`, `questionario_tecnico`, `observacoes` (TEXT)
- `status` (ENUM: 'ativa', 'pausada', 'fechada')
- `created_at`, `updated_at` (TIMESTAMP)

### Candidatos
- `id` (UUID, PK)
- `nome` (VARCHAR)
- `email`, `telefone` (VARCHAR)
- `deleted_at` (TIMESTAMP) - Soft delete
- `created_at`, `updated_at` (TIMESTAMP)

### Candidatos_Vagas (N:N)
- `id` (UUID, PK)
- `candidato_id` (UUID, FK)
- `vaga_id` (UUID, FK)
- `status_atual` (ENUM dos status do kanban)
- `data_candidatura` (TIMESTAMP)
- `observacoes` (TEXT)
- `avaliacao` (INTEGER 1-5)
- `created_at`, `updated_at` (TIMESTAMP)

### Histórico_Status
- `id` (UUID, PK)
- `candidato_vaga_id` (UUID, FK)
- `status_anterior`, `status_novo` (ENUM)
- `usuario_id` (UUID, FK)
- `comentario` (TEXT)
- `created_at` (TIMESTAMP)

### Currículos
- `id` (UUID, PK)
- `candidato_id` (UUID, FK)
- `vaga_id` (UUID, FK)
- `nome_arquivo` (VARCHAR)
- `url_storage` (TEXT)
- `tamanho_bytes` (BIGINT)
- `tipo_arquivo` (VARCHAR)
- `created_at` (TIMESTAMP)

## 🔒 Políticas de Segurança (RLS)

### Usuários
- Usuários só veem seus próprios dados
- Admin vê todos os usuários

### Clientes
- Todos os usuários autenticados podem ver/editar

### Vagas
- Consultores só veem suas vagas
- Admin vê todas as vagas

### Candidatos
- Consultores só veem candidatos de suas vagas
- Admin vê todos os candidatos

### Currículos
- Consultores só veem currículos de suas vagas
- Admin vê todos os currículos

## 📈 Status do Kanban

1. **selecionando** - Candidatos em análise inicial
2. **curriculo_enviado** - Currículos enviados ao cliente
3. **entrevista_agendada** - Entrevistas marcadas
4. **entrevista_realizada** - Entrevistas concluídas
5. **aprovado** - Candidatos aprovados
6. **reprovado** - Candidatos reprovados
7. **desistiu** - Candidatos que desistiram

## 🚀 Deploy

### 1. Preparar para Produção

```bash
# Verificar configurações
supabase status

# Aplicar migrações
supabase db push

# Deploy das funções
supabase functions deploy
```

### 2. Configurar Variáveis de Ambiente

No Supabase Dashboard:
1. Vá para Settings > API
2. Configure as variáveis de ambiente para as Edge Functions

### 3. Configurar Storage

```bash
# Criar bucket para currículos
supabase storage create curriculos

# Configurar políticas de acesso
supabase storage policy create curriculos
```

## 🧪 Testes

### Testar API

```bash
# Testar autenticação
curl -X POST https://your-project.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"senha123"}'

# Testar listagem de clientes
curl -X GET https://your-project.supabase.co/functions/v1/clientes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Testar Upload

```bash
# Testar upload de currículo
curl -X POST https://your-project.supabase.co/functions/v1/curriculos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "candidato_id=uuid" \
  -F "vaga_id=uuid" \
  -F "arquivo=@curriculo.pdf"
```

## 🔍 Monitoramento

### Logs das Edge Functions

```bash
# Ver logs em tempo real
supabase functions logs --follow

# Ver logs de função específica
supabase functions logs auth-login
```

### Métricas

- Acesse o Supabase Dashboard
- Vá para Analytics > Functions
- Monitore performance e erros

## 🛠️ Desenvolvimento

### Estrutura de uma Edge Function

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Sua lógica aqui
    return new Response(
      JSON.stringify({ data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { message: 'Erro interno' } }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### Boas Práticas

1. **Sempre usar CORS headers**
2. **Validar entrada de dados**
3. **Tratar erros adequadamente**
4. **Usar autenticação em todas as rotas**
5. **Implementar rate limiting**
6. **Logar operações importantes**

## 📚 Recursos Adicionais

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage API](https://supabase.com/docs/guides/storage)

## 🤝 Contribuição

1. Crie uma branch para sua feature
2. Implemente as mudanças
3. Teste localmente
4. Crie um Pull Request
5. Aguarde review e merge

---

**Nota:** Este backend está configurado para funcionar com o frontend React existente. Certifique-se de que as URLs e configurações estejam alinhadas entre frontend e backend. 