-- Migration: Corrigir função adicionar_curriculo_manual para usar cast correto de ENUM
-- Data: 2025-11-28
-- Objetivo: Adicionar cast explícito para o tipo disponibilidade_candidato

-- 1. Remover função existente (com lista de argumentos completa)
DROP FUNCTION IF EXISTS adicionar_curriculo_manual(
  text, text, text, text, text, integer, text, text, text, integer, text, text, text, text, text, bigint, text
);

-- 2. Recriar função com cast correto
CREATE OR REPLACE FUNCTION adicionar_curriculo_manual(
  p_nome VARCHAR,
  p_email VARCHAR,
  p_telefone VARCHAR,
  p_cargo VARCHAR DEFAULT NULL,
  p_area_atuacao VARCHAR DEFAULT NULL,
  p_experiencia_anos INTEGER DEFAULT 0,
  p_formacao VARCHAR DEFAULT NULL,
  p_localizacao VARCHAR DEFAULT NULL,
  p_disponibilidade VARCHAR DEFAULT 'disponivel',
  p_avaliacao INTEGER DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_linkedin_url VARCHAR DEFAULT NULL,
  p_portfolio_url VARCHAR DEFAULT NULL,
  p_nome_arquivo VARCHAR DEFAULT NULL,
  p_url_storage VARCHAR DEFAULT NULL,
  p_tamanho_bytes BIGINT DEFAULT 0,
  p_tipo_arquivo VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_candidato_id UUID;
  v_curriculo_id UUID;
BEGIN
  -- 1. Criar ou buscar candidato (ON CONFLICT atualiza se email já existe)
  INSERT INTO candidatos (nome, email, telefone, origem)
  VALUES (p_nome, p_email, p_telefone, 'banco_manual')
  ON CONFLICT (email) DO UPDATE 
    SET nome = EXCLUDED.nome, 
        telefone = EXCLUDED.telefone,
        updated_at = NOW()
  RETURNING id INTO v_candidato_id;

  -- 2. Adicionar ao banco de currículos com cast correto para o tipo ENUM
  INSERT INTO banco_curriculos (
    candidato_id,
    nome_arquivo,
    url_storage,
    tamanho_bytes,
    tipo_arquivo,
    cargo_interesse,
    area_atuacao,
    experiencia_anos,
    formacao,
    localizacao,
    disponibilidade,
    avaliacao,
    observacoes,
    linkedin_url,
    portfolio_url,
    status,
    favorito,
    created_at,
    updated_at
  ) VALUES (
    v_candidato_id,
    p_nome_arquivo,
    p_url_storage,
    p_tamanho_bytes,
    p_tipo_arquivo,
    p_cargo,
    p_area_atuacao,
    p_experiencia_anos,
    p_formacao,
    p_localizacao,
    p_disponibilidade::disponibilidade_candidato,  -- ✅ CAST ADICIONADO
    p_avaliacao,
    p_observacoes,
    p_linkedin_url,
    p_portfolio_url,
    'ativo',
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_curriculo_id;

  -- 3. Retornar sucesso com IDs criados
  RETURN json_build_object(
    'success', true,
    'candidato_id', v_candidato_id,
    'curriculo_id', v_curriculo_id,
    'message', 'Currículo adicionado com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, retornar detalhes
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant de permissões
GRANT EXECUTE ON FUNCTION adicionar_curriculo_manual TO authenticated;

-- 4. Comentário para documentação
COMMENT ON FUNCTION adicionar_curriculo_manual IS 
'Adiciona um currículo manualmente ao banco de currículos. Cria ou atualiza o candidato se o email já existir.';


