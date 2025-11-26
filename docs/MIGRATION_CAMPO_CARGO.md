# Migration: Adicionar Campo Cargo ao Banco de Currículos

## Objetivo
Adicionar o campo `cargo_interesse` à tabela `banco_curriculos` e criar a função RPC necessária para o cadastro manual de currículos.

## Arquivo de Migration
`supabase/migrations/20241126000001_adicionar_campo_cargo_curriculos.sql`

## O Que Foi Criado

### 1. Nova Coluna
```sql
cargo_interesse VARCHAR(255)
```
- Campo para armazenar cargo específico do candidato
- Opcional (pode ser NULL)
- Exemplos: "Analista de Marketing Pleno", "Desenvolvedor Full Stack", "Designer UI/UX"

### 2. Índice de Busca
```sql
idx_banco_curriculos_cargo_interesse
```
- Tipo: GIN (Generalized Inverted Index)
- Otimizado para busca em português
- Permite buscas rápidas por palavras-chave no cargo

### 3. Função RPC
```sql
adicionar_curriculo_manual(...)
```
- Aceita todos os parâmetros do formulário
- Cria ou atualiza candidato (ON CONFLICT por email)
- Adiciona currículo ao banco
- Retorna JSON com sucesso/erro

## Como Aplicar a Migration

### Opção 1: Usando Supabase CLI (Recomendado)
```bash
# Aplicar migration localmente
supabase db push

# Ou aplicar em produção
supabase db push --linked
```

### Opção 2: Usando Dashboard do Supabase
1. Acessar: https://supabase.com/dashboard
2. Selecionar seu projeto
3. Ir em: **SQL Editor**
4. Criar nova query
5. Copiar todo o conteúdo do arquivo:
   `supabase/migrations/20241126000001_adicionar_campo_cargo_curriculos.sql`
6. Executar a query
7. Verificar se não há erros

### Opção 3: Usando MCP Tools (Se disponível)
```typescript
// Usar ferramenta do Supabase MCP
mcp_supabase2_apply_migration({
  project_id: "seu-project-id",
  name: "adicionar_campo_cargo_curriculos",
  query: "-- conteúdo da migration --"
})
```

## Validação Pós-Migration

### Verificar Coluna Criada
```sql
-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'banco_curriculos'
AND column_name = 'cargo_interesse';

-- Esperado:
-- cargo_interesse | character varying | YES
```

### Verificar Índice
```sql
-- Listar índices da tabela
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'banco_curriculos'
AND indexname = 'idx_banco_curriculos_cargo_interesse';
```

### Testar Função RPC
```sql
-- Teste simples
SELECT adicionar_curriculo_manual(
  'João Silva',                    -- p_nome
  'joao@exemplo.com',             -- p_email
  '(11) 99999-9999',              -- p_telefone
  'Analista de Marketing Pleno',  -- p_cargo (NOVO)
  'marketing',                     -- p_area_atuacao
  5,                              -- p_experiencia_anos
  'Administração',                -- p_formacao
  'São Paulo, SP',                -- p_localizacao
  'disponivel',                   -- p_disponibilidade
  4,                              -- p_avaliacao
  'Candidato qualificado',        -- p_observacoes
  'https://linkedin.com/in/joao', -- p_linkedin_url
  'https://portfolio.com',        -- p_portfolio_url
  'curriculo_joao.pdf',           -- p_nome_arquivo
  'banco_curriculos/123_curriculo.pdf', -- p_url_storage
  1024000,                        -- p_tamanho_bytes
  'application/pdf'               -- p_tipo_arquivo
);

-- Resultado esperado:
-- {"success": true, "candidato_id": "uuid...", "curriculo_id": "uuid..."}
```

## Rollback (Se Necessário)

Caso precise reverter a migration:

```sql
-- Remover índice
DROP INDEX IF EXISTS idx_banco_curriculos_cargo_interesse;

-- Remover função
DROP FUNCTION IF EXISTS adicionar_curriculo_manual;

-- Remover coluna (CUIDADO: perde dados!)
ALTER TABLE banco_curriculos DROP COLUMN IF EXISTS cargo_interesse;
```

## Benefícios Após Migration

### Buscas Otimizadas
```sql
-- Buscar por cargo (rápido com índice GIN)
SELECT * FROM banco_curriculos
WHERE to_tsvector('portuguese', cargo_interesse) @@ to_tsquery('portuguese', 'analista & marketing');

-- Buscar simples (case-insensitive)
SELECT * FROM banco_curriculos
WHERE cargo_interesse ILIKE '%analista%';

-- Combinar com outros filtros
SELECT * FROM banco_curriculos
WHERE cargo_interesse ILIKE '%desenvolvedor%'
AND disponibilidade = 'disponivel'
AND avaliacao >= 4;
```

### Relatórios
```sql
-- Listar cargos mais comuns
SELECT cargo_interesse, COUNT(*) as total
FROM banco_curriculos
WHERE cargo_interesse IS NOT NULL
GROUP BY cargo_interesse
ORDER BY total DESC
LIMIT 10;
```

## Status

- ✅ Frontend atualizado
- ✅ Migration SQL criada
- ⏳ Aguardando aplicação no banco de dados
- ⏳ Testes pós-migration pendentes

---

**Próxima ação:** Aplicar migration no Supabase

