-- Migration: Adicionar campo cargo_interesse ao banco de currículos
-- Data: 2025-11-26
-- Objetivo: Permitir especificação de cargo além de área de atuação

-- 1. Adicionar coluna cargo_interesse na tabela banco_curriculos
ALTER TABLE banco_curriculos 
ADD COLUMN IF NOT EXISTS cargo_interesse VARCHAR(255);

-- 2. Criar índice para melhorar buscas por cargo
CREATE INDEX IF NOT EXISTS idx_banco_curriculos_cargo_interesse 
ON banco_curriculos USING GIN (to_tsvector('portuguese', cargo_interesse));

-- 3. Criar ou atualizar função RPC adicionar_curriculo_manual
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

  -- 2. Adicionar ao banco de currículos
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
    p_cargo,                      -- Novo campo
    p_area_atuacao,
    p_experiencia_anos,
    p_formacao,
    p_localizacao,
    p_disponibilidade,
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
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Comentário na coluna para documentação
COMMENT ON COLUMN banco_curriculos.cargo_interesse IS 
'Cargo específico do candidato (ex: Analista de Marketing Pleno, Desenvolvedor Full Stack). Alinha com o campo cargo das vagas para facilitar buscas.';

-- 5. Grant de permissões (ajustar conforme suas roles)
GRANT EXECUTE ON FUNCTION adicionar_curriculo_manual TO authenticated;

