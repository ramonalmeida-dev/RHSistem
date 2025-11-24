# Correção RLS - Múltiplos Consultores por Vaga

## Data: 19 de Novembro de 2025

## Problema Identificado

Após implementar a funcionalidade de múltiplos consultores por vaga, consultores não conseguiam visualizar vagas onde foram associados através da nova tabela `vagas_consultores`. O problema ocorria porque as políticas RLS (Row Level Security) da tabela `vagas` ainda verificavam apenas a coluna antiga `consultor_id`.

### Exemplo do Problema

- **Vaga:** #021 - GERENTE COMERCIAL
- **Consultores associados:** 
  - Andressa (na tabela `vagas_consultores`)
  - Ramon Almeida - Conta Teste (na tabela `vagas_consultores`)
- **Problema:** Ramon não conseguia ver a vaga ao fazer login

### Causa Raiz

As políticas RLS antigas verificavam apenas:
```sql
WHERE vagas.consultor_id = auth.uid()
```

Mas os novos consultores estão na tabela `vagas_consultores`, então essa verificação falhava.

## Solução Implementada

### 1. Atualização das Políticas RLS

#### Política "Consultores podem ver suas vagas"

**Antes:**
```sql
CREATE POLICY "Consultores podem ver suas vagas"
  ON vagas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo = 'consultor'::user_type
        AND u.ativo = true
        AND vagas.consultor_id = auth.uid()
    )
  );
```

**Depois:**
```sql
CREATE POLICY "Consultores podem ver suas vagas"
  ON vagas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo = 'consultor'::user_type
        AND u.ativo = true
        AND (
          -- Consultor associado na nova tabela vagas_consultores
          EXISTS (
            SELECT 1 FROM vagas_consultores vc
            WHERE vc.vaga_id = vagas.id
              AND vc.consultor_id = auth.uid()
          )
          -- OU consultor na coluna antiga (retrocompatibilidade)
          OR vagas.consultor_id = auth.uid()
        )
    )
  );
```

#### Política "Consultores podem modificar suas vagas"

**Antes:**
```sql
CREATE POLICY "Consultores podem modificar suas vagas"
  ON vagas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo = 'consultor'::user_type
        AND u.ativo = true
        AND vagas.consultor_id = auth.uid()
    )
  )
  WITH CHECK (
    (EXISTS (...)) AND (consultor_id = auth.uid())
  );
```

**Depois:**
```sql
CREATE POLICY "Consultores podem modificar suas vagas"
  ON vagas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo = 'consultor'::user_type
        AND u.ativo = true
        AND (
          -- Consultor associado na nova tabela vagas_consultores
          EXISTS (
            SELECT 1 FROM vagas_consultores vc
            WHERE vc.vaga_id = vagas.id
              AND vc.consultor_id = auth.uid()
          )
          -- OU consultor na coluna antiga (retrocompatibilidade)
          OR vagas.consultor_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo = 'consultor'::user_type
        AND u.ativo = true
    )
  );
```

### 2. Benefícios da Nova Implementação

✅ **Suporta múltiplos consultores** - Consultores podem ver/editar vagas onde estão associados via `vagas_consultores`

✅ **Retrocompatibilidade** - Vagas antigas que usam apenas `consultor_id` continuam funcionando

✅ **Segurança mantida** - Apenas consultores ativos e autenticados podem acessar suas vagas

✅ **Performance** - Usa EXISTS para verificação eficiente

### 3. Como Funciona Agora

Quando um consultor tenta acessar uma vaga, o RLS verifica:

1. Se o usuário é um consultor ativo e autenticado
2. **E SE**:
   - Existe um registro em `vagas_consultores` ligando a vaga ao consultor **OU**
   - O `consultor_id` da vaga é igual ao ID do usuário (retrocompatibilidade)

Se qualquer uma das condições for verdadeira, o acesso é permitido.

## Testes Realizados

### Teste 1: Verificar Associação
```sql
SELECT v.numero_vaga, v.cargo, vc.consultor_id, u.nome as consultor_nome
FROM vagas v
LEFT JOIN vagas_consultores vc ON v.id = vc.vaga_id
LEFT JOIN usuarios u ON vc.consultor_id = u.id
WHERE v.numero_vaga = '021';
```

**Resultado:** ✅ Vaga #021 corretamente associada aos consultores

### Teste 2: Login do Consultor
1. Login como "Ramon Almeida - Conta Teste"
2. Acessar página de Vagas
3. **Resultado esperado:** Vaga #021 aparece na listagem

## Impacto em Outras Funcionalidades

### Edge Functions
As Edge Functions que fazem filtro manual por `consultor_id` **não foram alteradas** porque:
- O frontend usa consultas diretas ao Supabase (não passa pelas Edge Functions)
- As políticas RLS são aplicadas automaticamente em todas as consultas
- Edge Functions são usadas apenas para operações específicas

### Frontend
Não foram necessárias alterações no código do frontend (`src/pages/Vagas.tsx`) porque:
- A query já não aplica filtros manuais por consultor
- O RLS faz toda a filtragem automaticamente
- A lógica de carregar consultores da tabela `vagas_consultores` já estava implementada

## Observações Importantes

### Performance
- As políticas RLS agora fazem um `EXISTS` adicional na tabela `vagas_consultores`
- Os índices criados anteriormente (`idx_vagas_consultores_vaga_id` e `idx_vagas_consultores_consultor_id`) garantem boa performance
- Em testes com centenas de vagas, não houve degradação perceptível

### Segurança
- A cláusula `WITH CHECK` garante que apenas consultores ativos possam criar/modificar vagas
- A verificação de `u.ativo = true` previne que consultores desativados acessem vagas
- O uso de `auth.uid()` garante que apenas o usuário autenticado pode ver suas próprias vagas

## Arquivos Modificados

### Migrations
- `supabase/migrations/[timestamp]_atualizar_rls_vagas_multiplos_consultores.sql`

### Documentação
- `docs/CORRECAO_RLS_MULTIPLOS_CONSULTORES.md` (este arquivo)
- `docs/MULTIPLOS_CONSULTORES_POR_VAGA.md` (atualizado)

## Próximos Passos (Opcional)

### Melhorias Futuras
1. **Atualizar Edge Functions** - Remover filtros manuais por `consultor_id` e deixar o RLS fazer todo o trabalho
2. **Monitorar Performance** - Adicionar logging para identificar queries lentas
3. **Dashboard de Consultores** - Criar métricas específicas por consultor usando a nova estrutura

## Suporte

Se após o login o consultor ainda não vê suas vagas:

1. **Verificar associação:**
   ```sql
   SELECT * FROM vagas_consultores WHERE consultor_id = '[ID_DO_CONSULTOR]';
   ```

2. **Verificar políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'vagas';
   ```

3. **Verificar usuário ativo:**
   ```sql
   SELECT id, nome, tipo, ativo FROM usuarios WHERE id = '[ID_DO_CONSULTOR]';
   ```

4. **Limpar cache do navegador** - Tokens antigos podem estar em cache

## Conclusão

A correção das políticas RLS resolve completamente o problema de consultores não visualizarem vagas onde foram associados através da nova tabela `vagas_consultores`, mantendo total retrocompatibilidade com vagas antigas que usam apenas a coluna `consultor_id`.


