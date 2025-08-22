# Correção do Trigger - Registro de Candidatos Externos

## Problema Identificado

O trigger criado para prevenir duplicação de usuários estava impedindo o registro de candidatos externos, causando o erro:

```json
{
    "code": "unexpected_failure",
    "message": "Database error saving new user"
}
```

## Causa do Problema

O trigger `trigger_validar_usuario()` estava sendo aplicado tanto na tabela `usuarios` quanto na tabela `candidatos_externos`, causando conflito no processo de registro de candidatos externos.

### Trigger Problemático
```sql
-- Trigger que estava causando problema
CREATE TRIGGER trigger_validar_usuario_candidatos_externos
  BEFORE INSERT OR UPDATE ON candidatos_externos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validar_usuario();
```

## Correção Implementada

### 1. Remoção do Trigger Problemático
```sql
-- Remover o trigger problemático
DROP TRIGGER IF EXISTS trigger_validar_usuario_candidatos_externos ON candidatos_externos;
```

### 2. Criação de Trigger Específico
```sql
-- Criar um trigger mais específico apenas para a tabela usuarios
CREATE OR REPLACE FUNCTION trigger_validar_usuario_interno()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Se está tentando criar um usuário com tipo 'consultor' ou 'admin'
  -- mas o email já existe na tabela candidatos_externos, impedir
  IF NEW.tipo IN ('consultor', 'admin') AND 
     EXISTS (
       SELECT 1 FROM candidatos_externos 
       WHERE email = NEW.email AND ativo = true
     ) THEN
    RAISE EXCEPTION 'Email já está registrado como candidato externo. Não é possível criar usuário interno.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Aplicar trigger apenas na tabela usuarios
CREATE TRIGGER trigger_validar_usuario_usuarios
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validar_usuario_interno();
```

## Resultado da Correção

### ✅ Registro de Candidatos Externos
- **Status**: Funcionando corretamente
- **Teste**: Candidato criado com sucesso
- **Integração**: Automática ao banco de currículos

### ✅ Proteção Contra Duplicação
- **Status**: Mantida
- **Teste**: Tentativa de criar usuário com email de candidato foi bloqueada
- **Mensagem**: "Email já está registrado como candidato externo. Não é possível criar usuário interno."

### ✅ Integração Automática
- **Status**: Funcionando perfeitamente
- **Teste**: Candidato integrado ao banco de currículos e kanban
- **Resultado**: 
  - Candidato criado em `candidatos_externos`
  - Integrado automaticamente em `candidatos`
  - Adicionado ao `banco_curriculos`
  - Aparece no kanban da vaga

## Fluxo Corrigido

```
1. Candidato se registra no portal externo
   ↓
2. Dados salvos em candidatos_externos ✅
   ↓
3. Candidato se candidata a uma vaga
   ↓
4. Sistema integra automaticamente:
   - Cria registro em candidatos ✅
   - Adiciona ao banco_curriculos ✅
   - Integra ao kanban da vaga ✅
   ↓
5. Consultores veem candidato no banco de currículos ✅
```

## Testes Realizados

### ✅ Teste de Registro de Candidato
```sql
-- Teste: Inserir um candidato externo (funcionou)
INSERT INTO candidatos_externos (
  nome, email, telefone, ativo, data_cadastro
) VALUES (
  'Candidato Teste',
  'candidato.teste@exemplo.com',
  '(11) 99999-9999',
  true,
  NOW()
);
```

### ✅ Teste de Proteção
```sql
-- Teste: Tentar criar usuário com email de candidato (bloqueado)
INSERT INTO usuarios (email, nome, tipo, ativo) 
VALUES ('testecandidato@teste.com', 'Usuário Teste', 'consultor', true);
-- Resultado: ERRO - Email já está registrado como candidato externo
```

### ✅ Teste de Integração
```sql
-- Teste: Aplicar candidato a vaga (funcionou)
SELECT aplicar_candidato_vaga(
  '1b941748-7bff-4112-8ec9-f8b9a58e7ce2'::uuid,
  '4fd174c8-36bf-4d75-a4d5-ae161b75adf4'::uuid,
  'Teste de candidatura após correção'
);
-- Resultado: Sucesso - Candidato integrado ao banco de currículos e kanban
```

## Verificação Final

### Banco de Currículos
```sql
SELECT bc.id, c.nome, c.email, c.origem, bc.observacoes
FROM banco_curriculos bc 
JOIN candidatos c ON bc.candidato_id = c.id
WHERE c.email = 'humberto@teste.com';
-- Resultado: Candidato presente com origem 'manual'
```

### Kanban de Vagas
```sql
SELECT cv.status_atual, cv.fonte_candidatura, c.nome, v.cargo
FROM candidatos_vagas cv
JOIN candidatos c ON cv.candidato_id = c.id
JOIN vagas v ON cv.vaga_id = v.id
WHERE c.email = 'humberto@teste.com';
-- Resultado: Candidato presente com fonte 'portal_externo'
```

## Benefícios da Correção

### Para Candidatos
- ✅ Registro funciona sem erros
- ✅ Integração automática ao sistema
- ✅ Aparecem no banco de currículos
- ✅ Visibilidade no kanban das vagas

### Para Consultores
- ✅ Candidatos aparecem no banco de currículos
- ✅ Podem visualizar e gerenciar candidatos
- ✅ Acesso centralizado a todos os currículos

### Para o Sistema
- ✅ Prevenção de duplicação mantida
- ✅ Integridade dos dados preservada
- ✅ Fluxo automatizado funcionando

## Monitoramento

### Logs Importantes
- Registros de candidatos externos
- Integrações automáticas
- Tentativas de criação incorreta de usuários

### Métricas Sugeridas
- Número de candidatos registrados por dia
- Taxa de sucesso da integração
- Erros de validação

## Conclusão

A correção foi **realizada com sucesso**, garantindo que:

1. **Registro de candidatos** funciona sem erros
2. **Proteção contra duplicação** é mantida
3. **Integração automática** funciona perfeitamente
4. **Fluxo completo** está operacional

O sistema agora permite o registro normal de candidatos externos enquanto mantém a proteção contra criação incorreta de usuários internos, proporcionando uma experiência fluida e segura para todos os usuários. 