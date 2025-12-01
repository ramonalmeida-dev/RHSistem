-- Migration: Adicionar constraint UNIQUE no email da tabela candidatos
-- Data: 2025-11-28
-- Objetivo: Permitir uso de ON CONFLICT (email) na função adicionar_curriculo_manual

-- 1. Primeiro, vamos limpar possíveis duplicatas existentes (mantendo o mais antigo)
-- Isso é necessário antes de adicionar a constraint UNIQUE
WITH duplicados AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(email)) 
      ORDER BY created_at ASC
    ) as rn
  FROM candidatos
  WHERE email IS NOT NULL 
    AND TRIM(email) != ''
    AND deleted_at IS NULL
)
UPDATE candidatos
SET email = email || '_dup_' || id::text
WHERE id IN (
  SELECT id FROM duplicados WHERE rn > 1
);

-- 2. Adicionar constraint UNIQUE no email (ignorando case e espaços)
-- Usando expressão para garantir unicidade case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS candidatos_email_unique_idx 
ON candidatos (LOWER(TRIM(email))) 
WHERE email IS NOT NULL 
  AND TRIM(email) != '' 
  AND deleted_at IS NULL;

-- 3. Comentário para documentação
COMMENT ON INDEX candidatos_email_unique_idx IS 
'Constraint UNIQUE case-insensitive no email. Ignora registros soft-deleted e emails vazios.';


