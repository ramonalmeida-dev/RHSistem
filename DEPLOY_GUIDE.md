# 🚀 Guia Completo de Deploy - Vercel

## ✅ Pré-requisitos

Antes de fazer o deploy, certifique-se de que:

- ✅ Projeto está funcionando localmente (`npm run dev`)
- ✅ Variáveis de ambiente do Supabase estão configuradas
- ✅ Build local passa sem erros (`npm run build`)
- ✅ Testes estão passando (`npm run test:flow`)

## 🔧 Preparação para Deploy

### 1. Verificar o Projeto

```bash
# Executar verificação automática
npm run prebuild

# Se tudo passar, fazer build local
npm run build

# Testar build localmente
npm run preview
```

### 2. Configurar Variáveis de Ambiente

**Obtenha suas chaves do Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para: `Settings` → `API`
4. Copie:
   - **Project URL** 
   - **Project API Keys** → `anon public`

## 🌍 Deploy na Vercel

### Opção 1: Via GitHub (Recomendado)

1. **Push para GitHub:**
   ```bash
   git add .
   git commit -m "feat: projeto pronto para deploy"
   git push origin main
   ```

2. **Conectar na Vercel:**
   - Acesse: https://vercel.com
   - Clique "New Project"
   - Importe seu repositório GitHub
   - Configure conforme abaixo

3. **Configuração na Vercel:**
   
   **Framework Preset:** `Vite`
   
   **Build Settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Development Command:** `npm run dev`

4. **Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   NODE_ENV=production
   ```

5. **Deploy:**
   - Clique "Deploy"
   - Aguarde o build completar

### Opção 2: Via Vercel CLI

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variáveis na primeira execução
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy para produção
vercel --prod
```

### Opção 3: Script Automatizado

```bash
# Deploy completo com verificações
npm run vercel:deploy
```

## 📋 Checklist Pós-Deploy

Após o deploy, verifique:

### ✅ Funcionalidades Básicas:
- [ ] Site carrega sem erros
- [ ] Todas as rotas funcionam (navegação SPA)
- [ ] Login de admin funciona
- [ ] Dashboard carrega corretamente

### ✅ Fluxo de Candidato:
- [ ] Registro de candidato funciona
- [ ] Login de candidato funciona
- [ ] Candidatura em vaga funciona
- [ ] Dashboard do candidato mostra candidaturas

### ✅ Fluxo Administrativo:
- [ ] Criação de cliente funciona
- [ ] Criação de vaga funciona
- [ ] Questionário dinâmico funciona
- [ ] Kanban mostra candidatos
- [ ] Relatórios carregam

### ✅ Performance:
- [ ] Site carrega rapidamente
- [ ] Imagens otimizadas
- [ ] Console sem erros

## 🔧 Solução de Problemas

### Erro 404 nas Rotas
**Problema:** Rotas internas retornam 404
**Solução:** Verificar se `vercel.json` está configurado:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Erro de Build
**Problema:** Build falha na Vercel
**Soluções:**
1. Executar `npm run build` localmente primeiro
2. Verificar logs de build na Vercel
3. Verificar se todas as dependências estão no `package.json`

### Erro de Variáveis de Ambiente
**Problema:** Supabase não conecta
**Soluções:**
1. Verificar se variáveis estão configuradas na Vercel
2. Redeployer após adicionar variáveis
3. Verificar se as URLs estão corretas

### Erro de Performance
**Problema:** Site carrega lentamente
**Soluções:**
1. Verificar bundle size: `npm run build:analyze`
2. Otimizar imagens na pasta `public/`
3. Verificar se chunks estão sendo gerados corretamente

## 📊 Monitoramento

### Analytics da Vercel
- Acesse o dashboard da Vercel
- Vá para seu projeto
- Aba "Analytics" para métricas de performance

### Logs de Erro
- Aba "Functions" → "View Logs"
- Monitor de erros em tempo real

### Performance
- Aba "Speed Insights"
- Core Web Vitals

## 🔄 Atualizações

### Deploy Automático (GitHub)
- Cada push para `main` faz deploy automático
- Branches geram preview deploys

### Deploy Manual
```bash
# Atualizar código
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Ou via CLI
vercel --prod
```

## 🎯 URLs Importantes

Após o deploy, você terá:

- **URL de Produção:** `https://your-project.vercel.app`
- **URLs de Preview:** Para cada branch/PR
- **Admin:** `https://your-project.vercel.app/login`
- **Portal Candidato:** `https://your-project.vercel.app/candidato/login`

## 📞 Suporte

Em caso de problemas:

1. **Verificar logs na Vercel**
2. **Consultar documentação:** [ENV_VARIABLES.md](./ENV_VARIABLES.md)
3. **Executar testes localmente:** `npm run test:complete`
4. **Verificar configuração:** `npm run prebuild`

---

**🎉 Parabéns! Seu Lotus Recruit Hub está online!** 

Compartilhe a URL com sua equipe e comece a recrutar! 🌟 