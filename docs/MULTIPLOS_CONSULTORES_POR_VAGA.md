# Múltiplos Consultores por Vaga

## Resumo das Alterações

Implementação da funcionalidade que permite associar múltiplos consultores responsáveis a uma única vaga, tanto na criação quanto na edição de vagas.

## Data da Implementação
19 de Novembro de 2025

## Alterações no Banco de Dados

### Nova Tabela: `vagas_consultores`

Criada tabela de relacionamento N:N (muitos para muitos) entre vagas e consultores:

```sql
CREATE TABLE IF NOT EXISTS vagas_consultores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  consultor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vaga_id, consultor_id)
);
```

**Características:**
- Relacionamento único por par vaga-consultor (constraint UNIQUE)
- Deleção em cascata quando vaga ou consultor é removido
- Índices criados para melhor performance
- RLS (Row Level Security) habilitado com policies apropriadas

### Migração de Dados

Todos os dados existentes da coluna `consultor_id` da tabela `vagas` foram migrados automaticamente para a nova tabela `vagas_consultores`.

**Importante:** A coluna `consultor_id` foi mantida na tabela `vagas` para compatibilidade retroativa e armazena o primeiro consultor da lista.

## Alterações no Frontend

### 1. Novo Componente: `MultiSelect`

**Arquivo:** `src/components/ui/multi-select.tsx`

Componente de seleção múltipla reutilizável que permite:
- Selecionar múltiplos itens de uma lista
- Visualizar seleções como badges
- Remover itens selecionados facilmente
- Buscar itens na lista
- Exibir contador quando há muitos itens selecionados

### 2. Modal de Adicionar Vaga

**Arquivo:** `src/components/vagas/AddVagaModal.tsx`

**Alterações:**
- Interface `VagaData` atualizada: `consultorId: string` → `consultoresIds: string[]`
- Substituído `Select` por `MultiSelect` para seleção de consultores
- Validação alterada para exigir pelo menos um consultor
- Label atualizado para "Consultores Responsáveis *" (plural)

### 3. Modal de Editar Vaga

**Arquivo:** `src/components/vagas/EditVagaModal.tsx`

**Alterações:**
- Interface `VagaData` atualizada: `consultorId: string` → `consultoresIds: string[]`
- Substituído `Select` por `MultiSelect` para seleção de consultores
- Carregamento automático dos consultores existentes da tabela `vagas_consultores`
- Fallback para `consultor_id` antigo caso não existam registros na nova tabela
- Validação alterada para exigir pelo menos um consultor

### 4. Página de Vagas

**Arquivo:** `src/pages/Vagas.tsx`

**Alterações principais:**

#### Interface `Vaga`
```typescript
// Adicionado novo campo:
consultores?: Array<{
  nome: string;
  email: string;
}>;
```

#### Função `loadVagas()`
- Consulta otimizada para carregar consultores da tabela `vagas_consultores`
- Fallback para `consultor_id` antigo em vagas que ainda não foram migradas
- Mantém compatibilidade com código existente através do campo `consultor`

#### Função `handleAddVaga()`
- Criação de registros na tabela `vagas_consultores` para cada consultor selecionado
- Mantém o primeiro consultor em `consultor_id` para compatibilidade

#### Função `handleUpdateVaga()`
- Remoção dos consultores antigos da vaga
- Inserção dos novos consultores selecionados
- Recarregamento dos dados para exibir as mudanças

#### Filtros de Busca
- Filtro de consultores atualizado para buscar em todos os consultores da vaga
- Lista de consultores únicos extraída de todas as vagas (flatMap)

#### Exibição na Tabela
- Coluna de consultores exibe todos os nomes separados por vírgula
- Busca funciona em todos os consultores associados à vaga

## Compatibilidade

### Retrocompatibilidade
- A coluna `consultor_id` foi mantida na tabela `vagas`
- Código antigo que usa `vaga.consultor` continua funcionando
- Vagas antigas são automaticamente compatíveis através do fallback

### Forward Compatibility
- Todas as novas vagas usam a tabela `vagas_consultores`
- Sistema suporta tanto a estrutura antiga quanto a nova
- Migração gradual e transparente para os usuários

## Validações

### Frontend
- **Criação de vaga:** Obrigatório selecionar pelo menos 1 consultor
- **Edição de vaga:** Obrigatório manter pelo menos 1 consultor

### Backend (RLS Policies)
- Apenas administradores podem inserir/atualizar/deletar consultores de vagas
- Todos os usuários autenticados podem visualizar os consultores

## Testes Recomendados

### Casos de Teste

1. **Criar vaga com 1 consultor**
   - Verificar se o consultor aparece corretamente
   - Verificar se foi salvo em `vagas_consultores`

2. **Criar vaga com múltiplos consultores**
   - Verificar se todos aparecem na listagem
   - Verificar se todos foram salvos no banco

3. **Editar vaga adicionando consultores**
   - Adicionar mais consultores a uma vaga existente
   - Verificar se a lista é atualizada

4. **Editar vaga removendo consultores**
   - Remover consultores mantendo pelo menos 1
   - Verificar se não é possível remover todos

5. **Filtrar por consultor**
   - Filtrar vagas por um consultor específico
   - Verificar se aparecem todas as vagas onde ele está associado

6. **Buscar por nome de consultor**
   - Buscar no campo de pesquisa geral
   - Verificar se encontra vagas de todos os consultores

7. **Compatibilidade com vagas antigas**
   - Editar uma vaga antiga (antes da migração)
   - Verificar se os dados são migrados corretamente

## Possíveis Melhorias Futuras

1. **Notificações:** Enviar notificação para todos os consultores quando forem adicionados a uma vaga

2. **Permissões granulares:** Permitir que consultores vejam apenas as vagas onde estão associados

3. **Dashboard:** Mostrar métricas individuais por consultor

4. **Relatórios:** Incluir filtros e agrupamentos por múltiplos consultores

5. **Histórico:** Rastrear quando consultores são adicionados/removidos de vagas

6. **Consultor principal:** Adicionar conceito de "consultor principal" com responsabilidades especiais

## Arquivos Modificados

### Banco de Dados
- `supabase/migrations/[timestamp]_criar_tabela_vagas_consultores.sql`

### Frontend - Componentes
- `src/components/ui/multi-select.tsx` (novo)
- `src/components/vagas/AddVagaModal.tsx`
- `src/components/vagas/EditVagaModal.tsx`

### Frontend - Páginas
- `src/pages/Vagas.tsx`

### Documentação
- `docs/MULTIPLOS_CONSULTORES_POR_VAGA.md` (este arquivo)

## Suporte

Em caso de dúvidas ou problemas relacionados a esta funcionalidade, verifique:

1. As policies RLS da tabela `vagas_consultores` no Supabase
2. Os logs do console do navegador para erros de inserção
3. Se a migration foi executada corretamente no banco de dados
4. Se o usuário tem as permissões necessárias (admin)

## Notas Técnicas

### Performance
- A consulta de vagas agora faz múltiplas chamadas usando `Promise.all()` para carregar os consultores
- Índices foram criados nas colunas `vaga_id` e `consultor_id` para otimizar as consultas
- Considerar implementar uma view materializada se o número de vagas crescer significativamente

### Segurança
- RLS está habilitado na tabela `vagas_consultores`
- Apenas admins podem modificar associações
- Todos podem visualizar (necessário para listar vagas)


