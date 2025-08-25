-- Função para buscar currículos por dados do candidato (nome, email, telefone)
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
  area_atuacao text,
  experiencia_anos integer,
  formacao text,
  localizacao text,
  disponibilidade text,
  avaliacao numeric,
  observacoes text,
  linkedin_url text,
  portfolio_url text,
  status text,
  favorito boolean,
  created_at timestamptz,
  updated_at timestamptz,
  candidato jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.candidato_id,
    bc.nome_arquivo,
    bc.url_storage,
    bc.tamanho_bytes,
    bc.tipo_arquivo,
    bc.area_atuacao,
    bc.experiencia_anos,
    bc.formacao,
    bc.localizacao,
    bc.disponibilidade,
    bc.avaliacao,
    bc.observacoes,
    bc.linkedin_url,
    bc.portfolio_url,
    bc.status,
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
    c.nome ILIKE '%' || termo_busca || '%'
    OR c.email ILIKE '%' || termo_busca || '%'
    OR c.telefone ILIKE '%' || termo_busca || '%'
    OR c.telefone ILIKE '%' || termo_limpo || '%'
  ORDER BY bc.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql; 