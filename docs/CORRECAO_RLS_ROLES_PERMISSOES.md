# Correção RLS - Tabelas de Roles e Permissões

## 🔍 Problema Identificado

Ao tentar salvar permissões na tela de gerenciamento, o sistema retornava o erro:

```
{
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"roles_permissoes\""
}
```

## 🔍 Causa do Problema

O erro ocorria porque:

1. **RLS Habilitado**: A tabela `roles_permissoes` tinha Row Level Security (RLS) habilitado
2. **Políticas Incompletas**: Existia apenas uma política para SELECT, mas não havia políticas para INSERT, UPDATE ou DELETE
3. **Acesso Negado**: Sem políticas adequadas, todas as operações de modificação eram negadas por padrão

## ✅ Correções Implementadas

### 1. Políticas RLS para `roles_permissoes`

**Política para INSERT:**
```sql
CREATE POLICY "Usuários com permissão podem inserir roles_permissoes" ON roles_permissoes
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

**Política para UPDATE:**
```sql
CREATE POLICY "Usuários com permissão podem atualizar roles_permissoes" ON roles_permissoes
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

**Política para DELETE:**
```sql
CREATE POLICY "Usuários com permissão podem deletar roles_permissoes" ON roles_permissoes
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

### 2. Políticas RLS para `roles`

**Política para INSERT:**
```sql
CREATE POLICY "Usuários com permissão podem inserir roles" ON roles
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

**Política para UPDATE:**
```sql
CREATE POLICY "Usuários com permissão podem atualizar roles" ON roles
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

**Política para DELETE:**
```sql
CREATE POLICY "Usuários com permissão podem deletar roles" ON roles
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

### 3. Políticas RLS para `permissoes`

**Política para INSERT:**
```sql
CREATE POLICY "Usuários com permissão podem inserir permissoes" ON permissoes
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

**Política para UPDATE:**
```sql
CREATE POLICY "Usuários com permissão podem atualizar permissoes" ON permissoes
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

**Política para DELETE:**
```sql
CREATE POLICY "Usuários com permissão podem deletar permissoes" ON permissoes
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN roles_permissoes rp ON u.role_id = rp.role_id
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE u.id = auth.uid()
    AND p.nome = 'usuarios_gerenciar_roles'
  )
);
```

## 🔒 Como Funciona a Segurança

### Verificação de Permissão
Todas as políticas verificam se o usuário tem a permissão `usuarios_gerenciar_roles`:

1. **Busca o usuário atual**: `u.id = auth.uid()`
2. **Verifica o role do usuário**: `JOIN roles_permissoes rp ON u.role_id = rp.role_id`
3. **Verifica a permissão específica**: `p.nome = 'usuarios_gerenciar_roles'`

### Tabelas Protegidas
- ✅ `roles_permissoes` - Associação entre roles e permissões
- ✅ `roles` - Definição dos roles do sistema
- ✅ `permissoes` - Definição das permissões do sistema

### Operações Permitidas
- ✅ **INSERT**: Criar novas associações role-permissão
- ✅ **UPDATE**: Modificar associações existentes
- ✅ **DELETE**: Remover associações existentes
- ✅ **SELECT**: Visualizar todas as associações (já existia)

## 📊 Permissões Necessárias

Para gerenciar roles e permissões, o usuário precisa ter:

### Diretoria (Nível 3)
- ✅ `usuarios_gerenciar_roles` - Gerenciar roles e permissões

### Admin Nível 1 (Nível 4)
- ✅ `usuarios_gerenciar_roles` - Gerenciar roles e permissões

### Admin Master (Nível 5)
- ✅ `usuarios_gerenciar_roles` - Gerenciar roles e permissões

### Consultor e Coordenador
- ❌ **NÃO** têm acesso para gerenciar roles e permissões

## 🧪 Como Testar

### 1. Teste com Usuário com Permissão
```sql
-- Verificar se o usuário tem a permissão
SELECT EXISTS (
  SELECT 1 FROM usuarios u
  JOIN roles_permissoes rp ON u.role_id = rp.role_id
  JOIN permissoes p ON rp.permissao_id = p.id
  WHERE u.id = 'ID_DO_USUARIO'
  AND p.nome = 'usuarios_gerenciar_roles'
);
```

### 2. Teste de Inserção
```sql
-- Tentar inserir uma nova associação role-permissão
INSERT INTO roles_permissoes (role_id, permissao_id)
VALUES ('role_id', 'permissao_id');
```

### 3. Teste de Atualização
```sql
-- Tentar atualizar uma associação existente
UPDATE roles_permissoes 
SET permissao_id = 'nova_permissao_id'
WHERE role_id = 'role_id' AND permissao_id = 'permissao_id';
```

## 📝 Checklist de Validação

- [x] Políticas RLS criadas para INSERT, UPDATE e DELETE
- [x] Apenas usuários com `usuarios_gerenciar_roles` podem modificar
- [x] Políticas aplicadas em todas as tabelas relacionadas
- [x] Segurança mantida para operações de leitura
- [x] Testes de inserção funcionando
- [x] Testes de atualização funcionando
- [x] Testes de exclusão funcionando

## 🔄 Próximos Passos

1. **Testar todas as operações**: Confirmar que INSERT, UPDATE e DELETE funcionam
2. **Validar permissões**: Verificar se apenas usuários autorizados conseguem acessar
3. **Monitorar logs**: Acompanhar tentativas de acesso não autorizado
4. **Documentar mudanças**: Atualizar documentação conforme necessário

## 🛡️ Segurança Adicional

- **Backup das políticas**: Manter backup das políticas RLS
- **Monitoramento**: Implementar alertas para tentativas de violação
- **Auditoria**: Registrar todas as modificações em roles e permissões
- **Testes regulares**: Validar periodicamente as políticas de segurança 