# Correção do RLS - Tabela Candidatos

## Problema Identificado

O erro `"new row violates row-level security policy for table \"candidatos\""` estava ocorrendo quando candidatos externos tentavam se candidatar a vagas, impedindo a integração automática ao sistema interno.

## Causa Raiz do Problema

### Política RLS Restritiva
A tabela `candidatos` possui RLS (Row Level Security) ativo com uma política que impede candidatos externos de acessar a tabela:

```sql
-- Política RLS na tabela candidatos
qual: "((auth.role() = 'authenticated'::text) AND (NOT (EXISTS ( SELECT 1 FROM candidatos_externos ce WHERE (ce.auth_user_id = auth.uid())))))"
```

### Conflito Identificado
1. **Candidato se candidata** → Função `aplicar_candidato_vaga` é chamada
2. **Função tenta inserir** → Na tabela `candidatos` para integrar candidato externo
3. **RLS bloqueia** → Política impede candidatos externos de acessar tabela `candidatos`
4. **Erro retornado** → "new row violates row-level security policy"

## Correção Implementada

### Função Corrigida com SECURITY DEFINER
```sql
CREATE OR REPLACE FUNCTION public.aplicar_candidato_vaga(
  p_candidato_id uuid, 
  p_vaga_id uuid, 
  p_observacoes text DEFAULT NULL::text, 
  p_curriculo_url text DEFAULT NULL::text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER  -- ✅ Adicionado para contornar RLS
AS $function$
-- ... resto da função ...
```

### Verificação de Duplicação no Kanban
```sql
-- ✅ Verificar se já existe no kanban antes de inserir
IF NOT EXISTS (
  SELECT 1 FROM candidatos_vagas
  WHERE candidato_id = candidato_interno_id AND vaga_id = p_vaga_id
) THEN
  -- Inserir no kanban (candidatos_vagas)
  INSERT INTO candidatos_vagas (
    candidato_id,
    vaga_id,
    status_atual,
    data_candidatura,
    observacoes,
    fonte_candidatura
  ) VALUES (
    candidato_interno_id,
    p_vaga_id,
    'curriculo_enviado',
    NOW(),
    'Candidatura via portal externo',
    'portal_externo'
  );
END IF;
```

## Fluxo Corrigido

### ✅ Processo de Candidatura
```
1. Candidato externo se candidata a uma vaga
   ↓
2. Função aplicar_candidato_vaga() é chamada
   ↓
3. SECURITY DEFINER contorna RLS ✅
   ↓
4. Verifica se candidato interno existe
   ↓
5. Cria candidato interno se necessário ✅
   ↓
6. Integra ao banco de currículos ✅
   ↓
7. Adiciona ao kanban (se não existir) ✅
   ↓
8. Retorna sucesso ✅
```

## Testes Realizados

### ✅ Teste de Candidatura
```sql
-- Teste: Aplicar candidato a uma vaga (funcionou)
SELECT aplicar_candidato_vaga(
  'a2a04898-9942-4557-a8d0-ede6e6f4b6e5'::uuid,
  '4fd174c8-36bf-4d75-a4d5-ae161b75adf4'::uuid,
  'Teste de candidatura após correção do RLS',
  'https://ustodblurmtaoexntmru.supabase.co/storage/v1/object/public/curriculos/1755889140686_Ramon.pdf'
);
-- Resultado: ✅ Sucesso - Candidato integrado ao banco de currículos e kanban
```

### ✅ Verificação de Integração
```sql
-- Verificar banco de currículos
SELECT bc.id, c.nome, c.email, c.origem, bc.observacoes
FROM banco_curriculos bc 
JOIN candidatos c ON bc.candidato_id = c.id
WHERE c.email = 'candidato.teste.rls@exemplo.com';
-- Resultado: ✅ Candidato presente com origem 'portal_externo'

-- Verificar kanban
SELECT cv.status_atual, cv.fonte_candidatura, c.nome, v.cargo
FROM candidatos_vagas cv
JOIN candidatos c ON cv.candidato_id = c.id
JOIN vagas v ON cv.vaga_id = v.id
WHERE c.email = 'candidato.teste.rls@exemplo.com';
-- Resultado: ✅ Candidato presente com fonte 'portal_externo'
```

## Benefícios da Correção

### Para Candidatos
- ✅ Candidatura funciona sem erros
- ✅ Integração automática ao sistema
- ✅ Aparecem no banco de currículos
- ✅ Visibilidade no kanban das vagas

### Para Consultores
- ✅ Candidatos aparecem no banco de currículos
- ✅ Podem visualizar e gerenciar candidatos
- ✅ Acesso centralizado a todos os currículos

### Para o Sistema
- ✅ RLS mantido para segurança
- ✅ Integração automática funcionando
- ✅ Prevenção de duplicação no kanban
- ✅ Fluxo completo operacional

## Estrutura Final

### Função de Candidatura
- **Nome**: `aplicar_candidato_vaga()`
- **Segurança**: `SECURITY DEFINER` para contornar RLS
- **Funcionalidade**: 
  - Integra candidato externo ao sistema interno
  - Adiciona ao banco de currículos
  - Inclui no kanban da vaga
- **Status**: ✅ Corrigida

### Políticas RLS
- **Tabela candidatos**: Mantida para segurança geral
- **Função de integração**: Contorna RLS quando necessário
- **Status**: ✅ Funcionando

### Integração Automática
- **Banco de currículos**: Candidatos integrados automaticamente
- **Kanban**: Candidatos aparecem na vaga
- **Status**: ✅ Funcionando

## Monitoramento

### Logs Importantes
- Candidaturas de candidatos externos
- Integrações automáticas
- Erros de RLS (se houver)

### Métricas Sugeridas
- Número de candidaturas por dia
- Taxa de sucesso da integração
- Candidatos no banco de currículos
- Candidatos no kanban

## Conclusão

A correção foi **realizada com sucesso**, resolvendo o conflito entre:

1. **RLS da tabela candidatos** → Mantido para segurança
2. **Função de integração** → Contorna RLS quando necessário
3. **Candidatura de candidatos externos** → Funciona sem erros
4. **Integração automática** → Funciona perfeitamente

O sistema agora permite que candidatos externos se candidatem a vagas sem problemas, enquanto mantém a segurança do RLS e a integração automática ao sistema interno, proporcionando uma experiência fluida e segura para todos os usuários. 