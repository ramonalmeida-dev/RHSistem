-- Função para atribuir permissões automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION atribuir_permissoes_automaticas()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir permissões do role automaticamente
  INSERT INTO roles_permissoes (role_id, permissao_id)
  SELECT NEW.role_id, permissao_id
  FROM roles_permissoes
  WHERE role_id = NEW.role_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função quando um usuário é inserido
DROP TRIGGER IF EXISTS trg_atribuir_permissoes_usuario ON usuarios;
CREATE TRIGGER trg_atribuir_permissoes_usuario
  AFTER INSERT ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION atribuir_permissoes_automaticas();

-- Função para atualizar permissões quando o role do usuário é alterado
CREATE OR REPLACE FUNCTION atualizar_permissoes_usuario()
RETURNS TRIGGER AS $$
BEGIN
  -- Remover permissões antigas
  DELETE FROM roles_permissoes 
  WHERE role_id = OLD.role_id 
  AND permissao_id IN (
    SELECT permissao_id 
    FROM roles_permissoes 
    WHERE role_id = OLD.role_id
  );
  
  -- Inserir novas permissões
  INSERT INTO roles_permissoes (role_id, permissao_id)
  SELECT NEW.role_id, permissao_id
  FROM roles_permissoes
  WHERE role_id = NEW.role_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função quando o role do usuário é atualizado
DROP TRIGGER IF EXISTS trg_atualizar_permissoes_usuario ON usuarios;
CREATE TRIGGER trg_atualizar_permissoes_usuario
  AFTER UPDATE OF role_id ON usuarios
  FOR EACH ROW
  WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id)
  EXECUTE FUNCTION atualizar_permissoes_usuario(); 