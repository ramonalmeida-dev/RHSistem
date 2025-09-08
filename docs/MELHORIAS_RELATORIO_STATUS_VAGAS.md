# Melhorias no Relatório de Status de Vagas

## 📋 Resumo das Alterações

Este documento descreve as melhorias implementadas no relatório de Status de Vagas conforme solicitação dos administradores (Cleiton, Gabriella e Humberto).

## ✨ Novos Campos Adicionados

### 1. **Consultor**
- **Localização**: Nova coluna no relatório
- **Descrição**: Nome do consultor responsável pela vaga
- **Fonte**: Tabela `usuarios` via relacionamento `consultor_id` na vaga

### 2. **Salário**
- **Localização**: Nova coluna no relatório
- **Descrição**: Faixa salarial da vaga
- **Fonte**: Campo `salario` da tabela `vagas`
- **Exibição**: Mostra "-" quando não informado

### 3. **Data do Status**
- **Localização**: Nova coluna para cada candidato
- **Descrição**: Data específica da mudança para o status atual
- **Lógica**:
  - Para status "AGUARDANDO": Data da remessa (data_candidatura)
  - Para outros status: Data registrada no histórico de mudanças de status
  - Busca na tabela `historico_status` pelo último registro do status atual

### 4. **Número de Dias no Status**
- **Localização**: Nova coluna para cada candidato
- **Descrição**: Dias decorridos desde a mudança para o status atual
- **Cálculo**: Diferença entre a data atual e a data do status
- **Formato**: Número inteiro de dias

## 🎨 Melhorias no Layout

### Cabeçalho do Relatório
- **Título Principal**: "RELATÓRIO DE STATUS DE VAGAS"
- **Data de Emissão**: Centralizada no cabeçalho principal
- **Formato**: "Data de Emissão: dd/MM/yyyy HH:mm"
- **Descrição**: Texto explicativo sobre o conteúdo do relatório
- **Posicionamento**: Cabeçalho único no início do documento, antes das seções por empresa

### Reorganização das Colunas
- **Larguras otimizadas** para melhor aproveitamento do espaço
- **Novas colunas**:
  - Consultor (10% da largura)
  - Salário (8% da largura)
  - Data Status (6% da largura)
  - Dias Status (5% da largura)

## 📊 Novos Status de Candidatos

### Status Atualizados
- `AGUARDANDO` → Candidato aguardando próxima etapa
- `EM_ENTREVISTA` → Candidato em processo de entrevista
- `FASE_FINAL` → Candidato em fase final de avaliação
- `APROVADO` → Candidato aprovado no processo
- `NAO_APROVADO` → Candidato não aprovado
- `DESISTIU` → Candidato desistiu do processo
- `ADMITIDO` → Candidato contratado
- `SUSPENSA` → Processo suspenso
- `CANCELADA` → Processo cancelado

### Cores dos Status
- **NÃO APROVADO**: Vermelho (#c62828)
- **APROVADO**: Verde (#2e7d32)
- **AGUARDANDO**: Laranja (#f57c00)
- **DESISTIU**: Azul (#1565c0)
- **EM ENTREVISTA**: Roxo (#7b1fa2)
- **FASE FINAL**: Índigo (#3f51b5)
- **ADMITIDO**: Verde escuro (#00695c)
- **SUSPENSA**: Rosa (#e91e63)
- **CANCELADA**: Cinza (#424242)

## 🔧 Implementação Técnica

### Interfaces Atualizadas

```typescript
export interface CandidatoStatusVaga {
  // ... campos existentes
  data_status: string;        // Nova
  dias_no_status: number;     // Nova
}

export interface VagaStatusRelatorio {
  // ... campos existentes
  consultor_nome: string;     // Nova
  salario?: string;           // Nova
}
```

### Nova Função: `getStatusInfo()`
- **Propósito**: Buscar data e calcular dias no status atual
- **Parâmetros**: ID do candidato-vaga e status atual
- **Retorno**: Objeto com data_status e dias_no_status
- **Lógica**:
  1. Busca último registro no `historico_status` para o status atual
  2. Se não encontrar, usa data de candidatura
  3. Calcula diferença em dias até hoje

### Query Atualizada
- Adicionado campo `salario` na consulta de vagas
- Mantida consulta de relacionamentos para empresa e consultor

## 📄 Estrutura do Relatório PDF

### Layout da Tabela
```
| EMPRESA | CARGO | CONSULTOR | SALÁRIO | Nº VAGA | INÍCIO | REMESSA | Nº DIAS | Nº ENVIADOS | CANDIDATO | STATUS | DATA STATUS | DIAS STATUS |
```

### Responsividade
- Tabela otimizada para formato A4 paisagem
- Colunas redimensionadas para melhor aproveitamento
- Fonte reduzida para 9px nas células de dados

## 🚀 Como Usar

### Geração do Relatório
```typescript
// Buscar dados com novos campos
const vagas = await StatusVagasService.list(filters);

// Exportar para PDF com layout atualizado
await StatusVagasService.exportToPDF(vagas);
```

### Filtros Disponíveis
- Por empresa
- Por consultor
- Por período (data início/fim)
- Por status das vagas

## ✅ Benefícios

1. **Visibilidade Completa**: Todos os campos solicitados pelos administradores
2. **Rastreabilidade**: Data e tempo no status atual de cada candidato
3. **Gestão Eficiente**: Identificação rápida de processos parados
4. **Layout Otimizado**: Melhor aproveitamento do espaço no PDF
5. **Informações Contextuais**: Consultor e salário para melhor tomada de decisão

## 📝 Observações

- O cálculo de dias considera apenas dias corridos (não úteis)
- Para candidatos sem histórico, usa-se a data de candidatura
- Status "AGUARDANDO" sempre usa data da remessa como referência
- Campos opcionais (como salário) mostram "-" quando não preenchidos
- Data de emissão é gerada automaticamente no momento da exportação

## 🔄 Compatibilidade

- ✅ Mantém compatibilidade com dados existentes
- ✅ Funciona com vagas sem candidatos
- ✅ Suporta candidatos sem histórico de status
- ✅ Layout responsivo para diferentes tamanhos de conteúdo 