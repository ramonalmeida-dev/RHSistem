# Integração Automática de Candidatos Externos ao Banco de Currículos

## Visão Geral

Este documento descreve a implementação da integração automática de candidatos externos ao banco de currículos quando eles se candidatam a vagas através do portal externo.

## Funcionalidade Implementada

### Fluxo de Integração

1. **Cadastro do Candidato Externo**: O candidato se cadastra no portal externo
2. **Candidatura à Vaga**: O candidato se candidata a uma vaga e anexa seu currículo
3. **Integração Automática**: O sistema automaticamente:
   - Cria um registro na tabela `candidatos` (sistema interno)
   - Adiciona o currículo ao banco de currículos
   - Integra o candidato ao kanban da vaga
   - Marca a candidatura como integrada

### Funções RPC Criadas/Modificadas

#### 1. `aplicar_candidato_vaga` (Modificada)
- **Função**: Aplicar candidato externo a uma vaga
- **Integração**: Agora integra automaticamente ao banco de currículos
- **Parâmetros**:
  - `p_candidato_id`: ID do candidato externo
  - `p_vaga_id`: ID da vaga
  - `p_observacoes`: Observações da candidatura
  - `p_curriculo_url`: URL do currículo anexado

#### 2. `integrar_candidato_externo_kanban` (Existente)
- **Função**: Integrar candidato externo ao kanban e banco de currículos
- **Trigger**: Executada automaticamente quando uma candidatura externa é criada

#### 3. `trigger_integrar_candidato_kanban` (Existente)
- **Função**: Trigger que chama a integração automaticamente
- **Evento**: INSERT na tabela `candidaturas_externas`

## Estrutura de Dados

### Tabelas Envolvidas

1. **`candidatos_externos`**: Candidatos do portal externo
2. **`candidatos`**: Candidatos do sistema interno
3. **`banco_curriculos`**: Banco de currículos para consultores
4. **`candidaturas_externas`**: Candidaturas do portal externo
5. **`candidatos_vagas`**: Relacionamento candidato-vaga (kanban)

### Mapeamento de Dados

| Campo Candidato Externo | Campo Candidato Interno | Campo Banco Currículos |
|-------------------------|-------------------------|------------------------|
| `nome` | `nome` | - |
| `email` | `email` | - |
| `telefone` | `telefone` | - |
| `curriculo_url` | - | `url_storage` |
| `curriculo_nome` | - | `nome_arquivo` |
| `curriculo_tamanho` | - | `tamanho_bytes` |
| `curriculo_tipo` | - | `tipo_arquivo` |
| `cidade + estado` | - | `localizacao` |

## Fluxo de Execução

### 1. Candidato se Candidata
```sql
-- Candidato externo se candidata a uma vaga
SELECT aplicar_candidato_vaga(
  'candidato_id'::uuid,
  'vaga_id'::uuid,
  'Observações da candidatura',
  'url_do_curriculo'
);
```

### 2. Integração Automática
```sql
-- Sistema automaticamente:
-- 1. Cria candidato interno (se não existir)
INSERT INTO candidatos (nome, email, telefone, origem) 
VALUES ('Nome', 'email@exemplo.com', 'telefone', 'portal_externo');

-- 2. Adiciona ao banco de currículos
INSERT INTO banco_curriculos (
  candidato_id, nome_arquivo, url_storage, 
  disponibilidade, status, observacoes
) VALUES (
  candidato_id, 'curriculo.pdf', 'url_curriculo',
  'disponivel', 'ativo', 'Candidato integrado automaticamente do portal externo'
);

-- 3. Adiciona ao kanban
INSERT INTO candidatos_vagas (
  candidato_id, vaga_id, status_atual, 
  fonte_candidatura, observacoes
) VALUES (
  candidato_id, vaga_id, 'curriculo_enviado',
  'portal_externo', 'Candidatura via portal externo'
);
```

## Benefícios

### Para Consultores
- **Acesso Centralizado**: Todos os currículos em um local
- **Busca Facilitada**: Pode buscar candidatos por área, experiência, etc.
- **Gestão Simplificada**: Interface única para gerenciar currículos

### Para Candidatos
- **Processo Simplificado**: Uma candidatura integra automaticamente
- **Visibilidade**: Currículo fica disponível para outras oportunidades
- **Transparência**: Status da candidatura visível no kanban

### Para o Sistema
- **Consistência**: Dados unificados entre portal externo e interno
- **Automação**: Processo totalmente automatizado
- **Rastreabilidade**: Histórico completo de candidaturas

## Configurações

### Status Inicial
- **Banco de Currículos**: `disponivel` / `ativo`
- **Kanban**: `curriculo_enviado`
- **Fonte**: `portal_externo`

### Campos Preenchidos Automaticamente
- **Nome do arquivo**: Do currículo anexado
- **URL do storage**: Link para download
- **Localização**: Cidade e estado do candidato
- **Observações**: "Candidato integrado automaticamente do portal externo"

### Campos para Preenchimento Manual
- **Área de atuação**: Preenchida pelo consultor
- **Experiência**: Anos de experiência
- **Formação**: Nível de escolaridade
- **Avaliação**: Nota de 1 a 5
- **LinkedIn/Portfolio**: Links profissionais

## Testes Realizados

### ✅ Teste de Integração
- Candidato externo se candidata a vaga
- Sistema cria candidato interno automaticamente
- Currículo é adicionado ao banco de currículos
- Candidato aparece no kanban da vaga
- Status inicial correto: "curriculo_enviado"

### ✅ Verificação de Duplicação
- Sistema verifica se candidato já existe por email
- Sistema verifica se já está no banco de currículos
- Evita duplicação de registros

### ✅ Tratamento de Erros
- Validação de vaga existente e publicada
- Validação de candidato externo ativo
- Verificação de candidatura duplicada
- Tratamento de exceções com mensagens claras

## Monitoramento

### Logs Importantes
- Criação de candidato interno
- Adição ao banco de currículos
- Integração ao kanban
- Erros de integração

### Métricas Sugeridas
- Número de candidatos integrados por dia
- Taxa de sucesso da integração
- Tempo médio de processamento
- Erros mais comuns

## Próximos Passos

1. **Interface de Consultores**: Melhorar visualização no banco de currículos
2. **Notificações**: Alertar consultores sobre novos candidatos
3. **Filtros Avançados**: Busca por área, experiência, localização
4. **Relatórios**: Estatísticas de integração
5. **Validação**: Verificação de qualidade dos currículos

## Conclusão

A integração automática de candidatos externos ao banco de currículos foi implementada com sucesso, proporcionando um fluxo unificado e eficiente para gestão de candidaturas. O sistema agora garante que todos os candidatos que se candidatam através do portal externo sejam automaticamente disponibilizados para os consultores no banco de currículos, mantendo a consistência dos dados e facilitando o processo de recrutamento. 