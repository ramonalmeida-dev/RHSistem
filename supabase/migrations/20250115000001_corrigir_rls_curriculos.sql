-- Migration: Corrigir política RLS da tabela curriculos
-- Data: 2025-01-15
-- Objetivo: Adicionar cláusula WITH CHECK explícita para permitir INSERTs

-- 1. Remover política existente
DROP POLICY IF EXISTS "Apenas sistema pode acessar curriculos" ON public.curriculos;

-- 2. Recriar política com WITH CHECK explícito para INSERTs
CREATE POLICY "Apenas sistema pode acessar curriculos"
ON public.curriculos
FOR ALL
USING (
  auth.role() = 'authenticated'::text 
  AND NOT EXISTS (
    SELECT 1
    FROM candidatos_externos ce
    WHERE ce.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  auth.role() = 'authenticated'::text 
  AND NOT EXISTS (
    SELECT 1
    FROM candidatos_externos ce
    WHERE ce.auth_user_id = auth.uid()
  )
);

-- 3. Comentário para documentação
COMMENT ON POLICY "Apenas sistema pode acessar curriculos" ON public.curriculos IS 
'Permite que usuários autenticados do sistema interno (não candidatos externos) acessem a tabela curriculos';

