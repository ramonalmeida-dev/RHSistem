# Correção: Posições Fechadas - Filtro por Consultor

## Problema Identificado

Ao acessar a página de posições fechadas como consultor, o sistema retornava o erro:

```
Returned type posicao_status does not match expected type text in column 12.
structure of query does not match function result type
```

## Causa do Problema

1. **Tipo incorreto na função RPC**: A função `get_posicoes_fechadas` estava declarando que retornava `status_posicao` como `text`, mas na tabela `posicoes_fechadas` a coluna é do tipo `posicao_status` (enum).

2. **Falta de filtro por consultor**: A página não estava filtrando as posições fechadas pelo `consultor_id` do usuário logado, permitindo que consultores vissem posições de outros consultores.

## Correções Implementadas

### 1. Correção da Função RPC `get_posicoes_fechadas`

**Arquivo**: `supabase/migrations/20241201000005_corrigir_funcao_get_posicoes_fechadas.sql`

```sql
-- Dropar a função existente
DROP FUNCTION IF EXISTS public.get_posicoes_fechadas(uuid, uuid, date, date);

-- Recriar a função com o tipo correto
CREATE OR REPLACE FUNCTION public.get_posicoes_fechadas(
  p_consultor_id uuid DEFAULT NULL::uuid, 
  p_empresa_id uuid DEFAULT NULL::uuid, 
  p_data_inicio date DEFAULT NULL::date, 
  p_data_fim date DEFAULT NULL::date
)
RETURNS TABLE(
  id uuid, 
  vaga_id uuid, 
  numero_vaga character varying, 
  cargo character varying, 
  empresa_id uuid, 
  empresa_nome character varying, 
  empresa_email character varying, 
  consultor_id uuid, 
  consultor_nome character varying, 
  data_recebimento date, 
  data_encerramento date, 
  status_posicao posicao_status, -- Corrigido: era text, agora é posicao_status
  candidatos_aprovados jsonb, 
  total_days integer, 
  observacoes text, 
  created_at timestamp with time zone
)
```

### 2. Correção da Função de Exportação

**Arquivo**: `supabase/migrations/20241201000006_corrigir_funcao_export_posicoes_fechadas_csv.sql`

```sql
-- Recriar a função usando get_posicoes_fechadas
CREATE OR REPLACE FUNCTION public.export_posicoes_fechadas_csv(
  p_consultor_id uuid DEFAULT NULL::uuid, 
  p_empresa_id uuid DEFAULT NULL::uuid, 
  p_data_inicio date DEFAULT NULL::date, 
  p_data_fim date DEFAULT NULL::date
)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  v_csv TEXT;
  v_record RECORD;
BEGIN
  -- Cabeçalho do CSV
  v_csv := 'Vaga,Cargo,Empresa,Consultor,Data Recebimento,Data Encerramento,Status,Candidatos Aprovados,Total Dias' || E'\n';
  
  -- Dados das posições fechadas usando a função get_posicoes_fechadas
  FOR v_record IN
    SELECT 
      numero_vaga,
      cargo,
      empresa_nome,
      consultor_nome,
      data_recebimento,
      data_encerramento,
      status_posicao,
      candidatos_aprovados,
      total_days
    FROM get_posicoes_fechadas(p_consultor_id, p_empresa_id, p_data_inicio, p_data_fim)
  LOOP
    -- ... lógica de formatação CSV
  END LOOP;
  
  RETURN v_csv;
END;
$function$;
```

### 3. Implementação do Filtro por Consultor no Frontend

**Arquivo**: `src/pages/relatorios/PosicoesFechadas.tsx`

```typescript
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

const PosicoesFechadas = () => {
  const { usuario } = useAuth();
  const { isConsultor, podeVerTodasPosicoesFechadas } = usePermissions();
  
  const loadPosicoesFechadas = async () => {
    setLoading(true);
    try {
      // Se for consultor e não tiver permissão para ver todas as posições, filtrar por consultor_id
      const filtersToApply = { ...filters };
      if (isConsultor() && !podeVerTodasPosicoesFechadas() && usuario?.id) {
        filtersToApply.consultor_id = usuario.id;
      }
      
      const data = await PosicoesFechadasService.list(filtersToApply);
      setPosicoesFechadas(data);
    } catch (error) {
      console.error('Erro ao carregar posições fechadas:', error);
      toast.error('Erro ao carregar posições fechadas');
    } finally {
      setLoading(false);
    }
  };
```

## Resultado

1. **Erro de tipo corrigido**: A função RPC agora retorna o tipo correto `posicao_status` em vez de `text`.

2. **Segurança implementada**: Consultores agora só veem posições fechadas de vagas onde são os consultores responsáveis.

3. **Exportação corrigida**: A função de exportação também respeita os filtros de consultor.

4. **Compatibilidade mantida**: Administradores e usuários com permissão `posicoes_fechadas_todas` ainda podem ver todas as posições.

## Testes Realizados

- ✅ Função `get_posicoes_fechadas` retorna dados corretamente
- ✅ Função `export_posicoes_fechadas_csv` gera CSV válido
- ✅ Filtro por consultor funciona corretamente
- ✅ Tipos de dados estão corretos

## Impacto

- **Positivo**: Melhoria na segurança e correção de bugs
- **Neutro**: Não há mudanças na funcionalidade para administradores
- **Positivo**: Consultores agora têm acesso adequado às suas posições fechadas 