-- Migration: Corrigir constraint UNIQUE no email para funcionar com ON CONFLICT
-- Data: 2025-11-28

-- 1. Remover o índice com expressão criado anteriormente
DROP INDEX IF EXISTS candidatos_email_unique_idx;

-- 2. Adicionar constraint UNIQUE simples no campo email
-- Isso permite usar ON CONFLICT (email) diretamente
ALTER TABLE candidatos 
ADD CONSTRAINT candidatos_email_key 
UNIQUE (email);

-- 3. Criar índice case-insensitive adicional para buscas (sem ser UNIQUE)
CREATE INDEX IF NOT EXISTS candidatos_email_lower_idx 
ON candidatos (LOWER(TRIM(email))) 
WHERE email IS NOT NULL AND deleted_at IS NULL;

-- 4. Comentários para documentação
COMMENT ON CONSTRAINT candidatos_email_key ON candidatos IS 
'Constraint UNIQUE no email para evitar duplicatas e permitir ON CONFLICT.';

COMMENT ON INDEX candidatos_email_lower_idx IS 
'Índice case-insensitive para buscas otimizadas por email.';


