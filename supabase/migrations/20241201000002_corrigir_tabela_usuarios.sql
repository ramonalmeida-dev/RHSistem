-- Verificar e corrigir a tabela usuarios se necessário
DO $$ 
BEGIN
    -- Verificar se a tabela usuarios existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        -- Criar tabela usuarios se não existir
        CREATE TABLE usuarios (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            role_id UUID REFERENCES roles(id),
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Adicionar colunas se não existirem
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'role_id') THEN
            ALTER TABLE usuarios ADD COLUMN role_id UUID REFERENCES roles(id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'ativo') THEN
            ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
            ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
            ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON usuarios(role_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
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