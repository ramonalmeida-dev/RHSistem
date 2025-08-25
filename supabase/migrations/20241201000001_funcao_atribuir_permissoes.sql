-- Função RPC para atribuir permissões automaticamente
CREATE OR REPLACE FUNCTION atribuir_permissoes_usuario(p_user_id UUID, p_role_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Verificar se o role existe
  IF NOT EXISTS (SELECT 1 FROM roles WHERE id = p_role_id) THEN
    RAISE EXCEPTION 'Role não encontrado';
  END IF;

  -- Atribuir permissões do role ao usuário (se necessário)
  -- Esta função pode ser expandida para lógica específica de permissões
  -- Por enquanto, apenas registra a atribuição
  
  -- Log da atribuição (opcional)
  INSERT INTO roles_permissoes (role_id, permissao_id)
  SELECT p_role_id, permissao_id
  FROM permissoes
  WHERE id IN (
    SELECT permissao_id 
    FROM roles_permissoes 
    WHERE role_id = p_role_id
  )
  ON CONFLICT (role_id, permissao_id) DO NOTHING;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 