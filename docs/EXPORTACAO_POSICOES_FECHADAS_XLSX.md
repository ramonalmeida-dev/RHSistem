# Exportação de Posições Fechadas - Formato XLSX

## 🎯 Objetivo

Criar uma exportação em formato XLSX com duas seções distintas:
1. **POSIÇÕES APROVADAS** - Todas as posições com candidatos aprovados
2. **ADMISSÕES REALIZADAS** - Apenas posições com status 'contratado'

## 📊 Estrutura do Arquivo

### Formato XLSX com Formatação
- **Extensão**: `.xlsx`
- **Formatação**: Títulos com fundo verde
- **Cabeçalhos**: Cinza claro
- **Largura de colunas**: Otimizada para cada tipo de dado

### Estrutura das Seções

#### 1. POSIÇÕES APROVADAS
**Colunas:**
- Nº
- Posição Nº
- Data
- Consultor Nº
- Consultor Nome
- Empresa Nº
- Empresa Nome
- Cargo / Posição
- Salário
- Aprovado
- Data Aprovação
- Total Days

#### 2. ADMISSÕES REALIZADAS
**Colunas:**
- Nº
- Posição Nº
- Data
- Consultor Nº
- Consultor Nome
- Empresa Nº
- Empresa Nome
- Cargo / Posição
- Salário
- Admitido
- Data Admissão
- Total Days

## 🔧 Implementação Técnica

### 1. Função Backend (`export_posicoes_fechadas_xlsx`)

**Localização**: `supabase/functions/posicoes-fechadas/`

**Funcionalidades:**
- Busca posições fechadas com filtros
- Separa dados por seção (aprovadas vs contratadas)
- Retorna estrutura JSON organizada
- Formata datas no padrão DD/MM/YY
- Calcula total de dias automaticamente

**Parâmetros:**
```sql
p_consultor_id uuid DEFAULT NULL
p_empresa_id uuid DEFAULT NULL
p_data_inicio date DEFAULT NULL
p_data_fim date DEFAULT NULL
```

### 2. Serviço Frontend (`PosicoesFechadasService`)

**Método**: `exportToExcel()`

**Funcionalidades:**
- Chama função RPC do backend
- Gera arquivo XLSX com formatação
- Aplica estilos (fundo verde nos títulos)
- Define largura das colunas
- Faz download automático

### 3. Biblioteca XLSX

**Dependência**: `xlsx` (SheetJS)
- Geração de arquivos Excel
- Formatação de células
- Estilos e cores
- Múltiplas abas

## 📋 Estrutura de Dados

### Resposta da API
```json
{
  "sections": [
    {
      "title": "POSIÇÕES APROVADAS",
      "columns": ["Nº", "Posição Nº", "Data", ...],
      "rows": [
        {
          "row": ["1", "14", "02/06/25", "5", "Yhamin", ...]
        }
      ]
    },
    {
      "title": "ADMISSÕES REALIZADAS",
      "columns": ["Nº", "Posição Nº", "Data", ...],
      "rows": [
        {
          "row": ["1", "14", "02/06/25", "5", "Yhamin", ...]
        }
      ]
    }
  ]
}
```

### Mapeamento de Dados
- **Nº**: Contador sequencial
- **Posição Nº**: `numero_vaga`
- **Data**: `data_encerramento` (formato DD/MM/YY)
- **Consultor Nº**: `consultor_id`
- **Consultor Nome**: `consultor_nome`
- **Empresa Nº**: `empresa_id`
- **Empresa Nome**: `empresa_nome`
- **Cargo / Posição**: `cargo`
- **Salário**: `salario_vaga` (ou "99.999" se não informado)
- **Aprovado/Admitido**: `candidato.nome`
- **Data Aprovação/Admissão**: `candidato.data_aprovacao` (formato DD/MM/YY)
- **Total Days**: `total_days`

## 🎨 Formatação Visual

### Títulos das Seções
- **Fundo**: Verde (#008000)
- **Texto**: Branco, negrito
- **Alinhamento**: Centralizado
- **Altura da linha**: 30px

### Cabeçalhos das Colunas
- **Fundo**: Cinza claro (#E6E6E6)
- **Texto**: Negrito
- **Alinhamento**: Centralizado

### Largura das Colunas
```javascript
[
  { wch: 5 },   // Nº
  { wch: 12 },  // Posição Nº
  { wch: 10 },  // Data
  { wch: 12 },  // Consultor Nº
  { wch: 20 },  // Consultor Nome
  { wch: 12 },  // Empresa Nº
  { wch: 25 },  // Empresa Nome
  { wch: 25 },  // Cargo / Posição
  { wch: 12 },  // Salário
  { wch: 20 },  // Aprovado/Admitido
  { wch: 12 },  // Data Aprovação/Admissão
  { wch: 12 }   // Total Days
]
```

## 🚀 Como Usar

### 1. Na Interface
1. Acessar página "Posições Fechadas"
2. Aplicar filtros (opcional)
3. Clicar no botão "Exportar Excel"
4. Arquivo será baixado automaticamente

### 2. Programaticamente
```typescript
import { PosicoesFechadasService } from '@/lib/posicoesFechadasService';

// Exportar todas as posições
await PosicoesFechadasService.exportToExcel();

// Exportar com filtros
await PosicoesFechadasService.exportToExcel({
  consultor_id: 'uuid-do-consultor',
  empresa_id: 'uuid-da-empresa',
  data_inicio: '2025-01-01',
  data_fim: '2025-12-31'
});
```

## 📁 Nome do Arquivo

O arquivo é salvo com o nome:
```
posicoes-fechadas-YYYY-MM-DD.xlsx
```

Exemplo: `posicoes-fechadas-2025-08-29.xlsx`

## 🔍 Filtros Disponíveis

### Por Consultor
- Filtra posições de um consultor específico
- Parâmetro: `consultor_id`

### Por Empresa
- Filtra posições de uma empresa específica
- Parâmetro: `empresa_id`

### Por Período
- Filtra por data de encerramento
- Parâmetros: `data_inicio` e `data_fim`
- Formato: YYYY-MM-DD

## 🧪 Testes

### Teste de Exportação Completa
1. Acessar posições fechadas
2. Clicar em "Exportar Excel"
3. Verificar se arquivo é baixado
4. Abrir arquivo e verificar formatação

### Teste com Filtros
1. Aplicar filtros na página
2. Exportar Excel
3. Verificar se apenas dados filtrados estão no arquivo

### Teste de Formatação
1. Abrir arquivo Excel
2. Verificar se títulos têm fundo verde
3. Verificar se cabeçalhos têm fundo cinza
4. Verificar se larguras das colunas estão corretas

## 📝 Checklist de Validação

- [x] Função backend criada
- [x] Serviço frontend atualizado
- [x] Biblioteca XLSX instalada
- [x] Formatação visual implementada
- [x] Duas seções criadas
- [x] Filtros funcionando
- [x] Download automático
- [x] Nome do arquivo com data
- [x] Largura das colunas otimizada

## 🔄 Próximos Passos

1. **Testar com dados reais**: Validar com posições fechadas existentes
2. **Otimizar performance**: Verificar se há gargalos na geração
3. **Adicionar mais filtros**: Se necessário
4. **Melhorar formatação**: Ajustes visuais conforme feedback
5. **Documentar para usuários**: Criar guia de uso

## 🛠️ Comandos Úteis

### Instalar Dependência
```bash
npm install xlsx
```

### Testar Função Backend
```sql
SELECT export_posicoes_fechadas_xlsx();
```

### Verificar Dados
```sql
SELECT * FROM get_posicoes_fechadas();
``` 