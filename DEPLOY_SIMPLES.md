# 🚀 Deploy Simples - Vercel

## 1. Configuração na Vercel

### Framework: `Vite`
### Build Command: `npm run build`
### Output Directory: `dist`

## 2. Variáveis de Ambiente

Adicione no dashboard da Vercel:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

## 3. Deploy

### Via GitHub:
1. Faça push do código
2. Conecte repositório na Vercel
3. Deploy automático

### Via CLI:
```bash
npm i -g vercel
vercel
```

## 4. Teste

Acesse a URL gerada e teste:
- Login funciona
- Navegação funciona
- Supabase conecta

---

**É só isso! Simples e direto.** 🎯 