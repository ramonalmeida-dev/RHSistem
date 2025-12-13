-- Migration: Atualizar função buscar_curriculos_por_candidato para incluir cargo_interesse
-- Data: 2025-01-15
-- Objetivo: Incluir o campo cargo_interesse na função de busca e corrigir validação do termo de busca

-- Remover função existente completamente
DROP FUNCTION IF EXISTS buscar_curriculos_por_candidato(text, text, integer, integer) CASCADE;

-- Recriar função com cargo_interesse incluído e validação corrigida
CREATE OR REPLACE FUNCTION buscar_curriculos_por_candidato(
  termo_busca text,
  termo_limpo text,
  offset_val integer DEFAULT 0,
  limit_val integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  candidato_id uuid,
  nome_arquivo text,
  url_storage text,
  tamanho_bytes bigint,
  tipo_arquivo text,
  cargo_interesse text,
  area_atuacao text,
  experiencia_anos integer,
  formacao text,
  localizacao text,
  disponibilidade text,
  avaliacao integer,
  observacoes text,
  linkedin_url text,
  portfolio_url text,
  status text,
  favorito boolean,
  created_at timestamptz,
  updated_at timestamptz,
  candidato jsonb
) AS $$
DECLARE
  v_termo_busca text;
BEGIN
  -- Validar termo de busca
  v_termo_busca := COALESCE(termo_busca, '');
  
  -- Se termo vazio, retornar vazio
  IF v_termo_busca = '' OR LENGTH(TRIM(v_termo_busca)) = 0 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    bc.id,
    bc.candidato_id,
    bc.nome_arquivo::text,
    bc.url_storage::text,
    bc.tamanho_bytes,
    bc.tipo_arquivo::text,
    bc.cargo_interesse::text,
    bc.area_atuacao::text,
    bc.experiencia_anos,
    bc.formacao::text,
    bc.localizacao::text,
    bc.disponibilidade::text,
    bc.avaliacao,
    bc.observacoes::text,
    bc.linkedin_url::text,
    bc.portfolio_url::text,
    bc.status::text,
    bc.favorito,
    bc.created_at,
    bc.updated_at,
    jsonb_build_object(
      'id', c.id,
      'nome', c.nome,
      'email', c.email,
      'telefone', c.telefone
    ) as candidato
  FROM banco_curriculos bc
  INNER JOIN candidatos c ON bc.candidato_id = c.id
  WHERE 
    c.nome ILIKE '%' || v_termo_busca || '%'
    OR c.email ILIKE '%' || v_termo_busca || '%'
    OR c.telefone ILIKE '%' || v_termo_busca || '%'
    OR (termo_limpo IS NOT NULL AND termo_limpo != '' AND c.telefone ILIKE '%' || termo_limpo || '%')
    OR (bc.cargo_interesse IS NOT NULL AND bc.cargo_interesse != '' AND bc.cargo_interesse ILIKE '%' || v_termo_busca || '%')
    OR (bc.localizacao IS NOT NULL AND bc.localizacao != '' AND bc.localizacao ILIKE '%' || v_termo_busca || '%')
  ORDER BY bc.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- Comentário para documentação
COMMENT ON FUNCTION buscar_curriculos_por_candidato IS 
'Busca currículos por dados do candidato (nome, email, telefone, cargo, localização). Inclui cargo_interesse no retorno e na busca. Valida termo de busca antes de executar.';

