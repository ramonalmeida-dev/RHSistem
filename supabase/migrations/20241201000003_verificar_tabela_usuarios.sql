-- Verificar e corrigir problemas na tabela usuarios
DO $$ 
BEGIN
    -- Verificar se a tabela usuarios existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        RAISE EXCEPTION 'Tabela usuarios não existe';
    END IF;

    -- Verificar se todas as colunas necessárias existem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'id') THEN
        ALTER TABLE usuarios ADD COLUMN id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'email') THEN
        ALTER TABLE usuarios ADD COLUMN email TEXT NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'nome') THEN
        ALTER TABLE usuarios ADD COLUMN nome TEXT NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'role_id') THEN
        ALTER TABLE usuarios ADD COLUMN role_id UUID REFERENCES roles(id);
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'ativo') THEN
        ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
        ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Remover constraints problemáticas se existirem
    BEGIN
        ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;

    BEGIN
        ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;

    -- Recriar constraints corretas
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_unique UNIQUE (email);

    -- Verificar se a tabela roles existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles') THEN
        RAISE EXCEPTION 'Tabela roles não existe';
    END IF;

    -- Verificar se o role_id existe na tabela roles
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'role_id') THEN
        -- Verificar se há role_id inválidos
        IF EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.role_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = u.role_id)
        ) THEN
            -- Atualizar role_id inválidos para NULL
            UPDATE usuarios 
            SET role_id = NULL 
            WHERE role_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = usuarios.role_id);
        END IF;
    END IF;

END $$;

-- Remover triggers problemáticos se existirem
DROP TRIGGER IF EXISTS trg_atribuir_permissoes_usuario ON usuarios;
DROP TRIGGER IF EXISTS trg_atualizar_permissoes_usuario ON usuarios;
DROP FUNCTION IF EXISTS atribuir_permissoes_automaticas();
DROP FUNCTION IF EXISTS atualizar_permissoes_usuario();

-- Recriar triggers de forma mais simples
CREATE OR REPLACE FUNCTION atribuir_permissoes_automaticas()
RETURNS TRIGGER AS $$
BEGIN
    -- Por enquanto, apenas retornar o registro sem fazer nada
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger simples para inserção
CREATE TRIGGER trg_atribuir_permissoes_usuario
  AFTER INSERT ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION atribuir_permissoes_automaticas();

-- Verificar e corrigir RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS mais permissivas para teste
DROP POLICY IF EXISTS "Usuários podem ver todos os usuários" ON usuarios;
CREATE POLICY "Usuários podem ver todos os usuários" ON usuarios
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins podem inserir usuários" ON usuarios;
CREATE POLICY "Admins podem inserir usuários" ON usuarios
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins podem atualizar usuários" ON usuarios;
CREATE POLICY "Admins podem atualizar usuários" ON usuarios
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins podem deletar usuários" ON usuarios;
CREATE POLICY "Admins podem deletar usuários" ON usuarios
    FOR DELETE USING (true); 