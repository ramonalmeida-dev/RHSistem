-- Migration: Aumentar tamanho do campo tipo_arquivo na tabela curriculos
-- Data: 2025-01-15
-- Objetivo: Permitir tipos MIME maiores (de 50 para 100 caracteres)

-- Alterar o tipo da coluna tipo_arquivo para suportar tipos MIME maiores
ALTER TABLE public.curriculos 
ALTER COLUMN tipo_arquivo TYPE VARCHAR(100);

-- Comentário para documentação
COMMENT ON COLUMN public.curriculos.tipo_arquivo IS 
'Tipo MIME do arquivo do currículo (máximo 100 caracteres)';

