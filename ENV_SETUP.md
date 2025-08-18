# Configuração das Variáveis de Ambiente

## Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ustodblurmtaoexntmru.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdG9kYmx1cm10YW9leG50bXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTIzNzcsImV4cCI6MjA3MDc2ODM3N30.MQ8P-GR0uCRUQHuRNDUxbVoLbEf2mFQN5K37qM3We2k
```

## Passos:

1. Crie um arquivo chamado `.env` na raiz do projeto (mesmo nível do `package.json`)
2. Cole o conteúdo acima no arquivo
3. Salve o arquivo
4. Reinicie o servidor de desenvolvimento (`npm run dev`)

## Nota:
- O arquivo `.env` está no `.gitignore` e não será commitado
- Estas são as credenciais do seu projeto Supabase
- Nunca compartilhe estas credenciais publicamente 