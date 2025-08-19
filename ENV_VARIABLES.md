# 🌍 Variáveis de Ambiente - Vercel Deploy

## Configuração Obrigatória

Antes de fazer o deploy na Vercel, configure estas variáveis de ambiente:

### No Dashboard da Vercel:

1. Vá para: `Settings` → `Environment Variables`
2. Adicione as seguintes variáveis:

```bash
# Configurações do Supabase (OBRIGATÓRIAS)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Configurações do Ambiente
NODE_ENV=production

# Configurações Opcionais
VITE_APP_NAME=Lotus Recruit Hub
VITE_APP_VERSION=1.0.0
```

### Como Obter as Chaves do Supabase:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para: `Settings` → `API`
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API Keys** → `anon public` → `VITE_SUPABASE_ANON_KEY`

### Arquivo Local (.env.local):

Para desenvolvimento local, crie um arquivo `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=development
```

## Deploy na Vercel

### Opção 1: Via GitHub (Recomendado)

1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático

### Opção 2: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis (primeira vez)
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Comandos de Build na Vercel:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

## Verificação

Após o deploy, verifique se:

✅ As rotas estão funcionando (SPA routing)
✅ As chamadas para o Supabase estão funcionando
✅ O site carrega sem erros no console
✅ Todas as funcionalidades estão operacionais

## Solução de Problemas

### Erro 404 nas rotas:
- Verificar se `vercel.json` está configurado corretamente

### Erro de variáveis de ambiente:
- Verificar se as variáveis estão configuradas na Vercel
- Redeployer após adicionar variáveis

### Erro de build:
- Executar `npm run build` localmente primeiro
- Verificar logs de build na Vercel 