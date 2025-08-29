# Correção - Função de Exportação XLSX

## 🔍 Problema Identificado

Ao tentar exportar posições fechadas para XLSX, o sistema retornava o erro:

```
POST https://ustodblurmtaoexntmru.supabase.co/rest/v1/rpc/export_posicoes_fechadas_xlsx 400 (Bad Request)
{code: '42703', details: null, hint: null, message: 'column pf.total_days does not exist'}
```

## 🔍 Causa do Problema

A função `export_posicoes_fechadas_xlsx` estava tentando acessar colunas que não existem na tabela `posicoes_fechadas`:

1. ❌ **`pf.total_days`** - Coluna inexistente
2. ❌ **`u.cpf`** - Coluna inexistente na tabela `usuarios`

## ✅ Correções Implementadas

### 1. Cálculo Dinâmico de `total_days`

**Antes:**
```sql
pf.total_days
```

**Depois:**
```sql
CASE 
  WHEN pf.data_recebimento IS NOT NULL AND pf.data_encerramento IS NOT NULL 
  THEN (pf.data_encerramento - pf.data_recebimento)::INTEGER
  ELSE 0
END as total_days
```

### 2. Remoção de Coluna Inexistente

**Removido:**
```sql
u.cpf as consultor_cpf
```

**Motivo:** A tabela `usuarios` não possui coluna `cpf`

### 3. Estrutura Final da Query

```sql
SELECT 
  pf.id,
  pf.numero_vaga,
  pf.cargo,
  pf.empresa_id,
  pf.empresa_nome,
  pf.consultor_id,
  pf.consultor_nome,
  pf.data_recebimento,
  pf.data_encerramento,
  pf.status_posicao,
  pf.candidatos_aprovados,
  -- Calcular total_days dinamicamente
  CASE 
    WHEN pf.data_recebimento IS NOT NULL AND pf.data_encerramento IS NOT NULL 
    THEN (pf.data_encerramento - pf.data_recebimento)::INTEGER
    ELSE 0
  END as total_days,
  -- Buscar dados adicionais
  c.cnpj as empresa_cnpj,
  v.salario as salario_vaga
FROM posicoes_fechadas pf
JOIN vagas v ON pf.vaga_id = v.id
JOIN clientes c ON pf.empresa_id = c.id
WHERE v.status = 'encerrada'
  AND (p_consultor_id IS NULL OR pf.consultor_id = p_consultor_id)
  AND (p_empresa_id IS NULL OR pf.empresa_id = p_empresa_id)
  AND (p_data_inicio IS NULL OR pf.data_encerramento >= p_data_inicio)
  AND (p_data_fim IS NULL OR pf.data_encerramento <= p_data_fim)
ORDER BY pf.data_encerramento DESC
```

## 📊 Resultado do Teste

A função agora retorna dados corretamente:

### POSIÇÕES APROVADAS
- ✅ Vaga "009" - 1 candidato aprovado
- ✅ Vaga "06" - 2 candidatos aprovados

### ADMISSÕES REALIZADAS
- ✅ Vaga "06" - 2 candidatos contratados (status 'contratado')

### Dados de Exemplo:
```json
{
  "sections": [
    {
      "title": "POSIÇÕES APROVADAS",
      "rows": [
        {
          "row": ["1", "009", "29/08/25", "87505681-7d65-4731-adc0-234e8f5db2ee", "Rocha", "277bca0f-808a-4740-a622-49b66b0a620c", "GESTAO JOIAS SOFTWARE LTDA", "teste", "6.000", "287382738", "29/08/25", "200"]
        }
      ]
    },
    {
      "title": "ADMISSÕES REALIZADAS",
      "rows": [
        {
          "row": ["1", "06", "25/08/25", "74b5e55a-23a5-4dbc-bd6c-cd2760eae824", "ANDRESSA", "195f6cb3-ebe1-42cb-b951-76b959832da3", "TESTE ANDRESSA", "teste", "10", "TESTE", "26/08/25", "1"]
        }
      ]
    }
  ]
}
```

## 🔧 Estrutura das Tabelas

### Tabela `posicoes_fechadas`
```sql
- id (uuid)
- vaga_id (uuid)
- numero_vaga (varchar)
- cargo (varchar)
- empresa_id (uuid)
- empresa_nome (varchar)
- empresa_email (varchar)
- consultor_id (uuid)
- consultor_nome (varchar)
- data_recebimento (date)
- data_encerramento (date)
- status_posicao (enum)
- candidatos_aprovados (jsonb)
- observacoes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela `usuarios`
```sql
- id (uuid)
- email (varchar)
- senha_hash (varchar)
- nome (varchar)
- tipo (enum)
- ativo (boolean)
- created_at (timestamp)
- updated_at (timestamp)
- role_id (uuid)
```

## 🧪 Como Testar

### 1. Teste da Função Backend
```sql
SELECT export_posicoes_fechadas_xlsx();
```

### 2. Teste na Interface
1. Acessar página "Posições Fechadas"
2. Clicar em "Exportar Excel"
3. Verificar se arquivo é baixado sem erros

### 3. Verificar Arquivo Gerado
1. Abrir arquivo XLSX
2. Verificar se há duas abas (POSIÇÕES APROVADAS e ADMISSÕES REALIZADAS)
3. Verificar se formatação está correta (fundo verde nos títulos)

## 📝 Checklist de Validação

- [x] Erro de coluna `total_days` corrigido
- [x] Erro de coluna `cpf` corrigido
- [x] Função retorna dados corretamente
- [x] Cálculo de total_days funcionando
- [x] Separação por seções funcionando
- [x] Formatação de datas correta (DD/MM/YY)
- [x] Filtros funcionando
- [x] Download automático funcionando

## 🔄 Próximos Passos

1. **Testar com dados reais**: Validar com mais posições fechadas
2. **Otimizar performance**: Se necessário para grandes volumes
3. **Adicionar mais filtros**: Se solicitado pelos usuários
4. **Melhorar formatação**: Ajustes visuais conforme feedback

## 🛠️ Comandos Úteis

### Verificar Estrutura das Tabelas
```sql
-- Verificar colunas da tabela posicoes_fechadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posicoes_fechadas';

-- Verificar colunas da tabela usuarios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios';
```

### Testar Função
```sql
-- Testar função sem filtros
SELECT export_posicoes_fechadas_xlsx();

-- Testar função com filtros
SELECT export_posicoes_fechadas_xlsx(
  p_consultor_id := 'uuid-do-consultor',
  p_data_inicio := '2025-01-01',
  p_data_fim := '2025-12-31'
);
``` 