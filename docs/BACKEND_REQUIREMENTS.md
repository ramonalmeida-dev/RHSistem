# Backend Requirements - Lotus Recruit Hub

## 📋 Requisitos Funcionais

### 1. **Estrutura do Banco de Dados**

#### 1.1 Tabelas Principais
- ✅ **usuarios** - Cadastro de consultores e administradores
- ✅ **clientes** - Cadastro de empresas clientes
- ✅ **vagas** - Vagas de emprego
- ✅ **candidatos** - Candidatos às vagas
- ✅ **curriculos** - Arquivos de currículo
- ✅ **historico_status** - Histórico de mudanças de status dos candidatos
- ✅ **candidatos_vagas** - Relacionamento N:N entre candidatos e vagas

#### 1.2 Soft Delete
- ✅ Candidatos podem ser deletados logicamente (soft delete)
- ✅ Manter histórico de candidatos deletados

#### 1.3 Relacionamentos
- ✅ Candidatos podem se candidatar em várias vagas diferentes
- ✅ Candidato só pode se candidatar uma vez por vaga
- ✅ Histórico completo de mudanças de status (baseado no Kanban)

### 2. **Sistema de Autenticação**

#### 2.1 Usuários
- ✅ Login apenas com email e senha
- ✅ Criação de conta interna pelo gestor (não aberta ao público)
- ✅ Dois níveis de acesso: **admin** e **consultor**

#### 2.2 Permissões
- ✅ **Consultores**: Veem apenas suas vagas e candidatos
- ✅ **Admin**: Acesso total ao sistema
- ✅ **Relatórios financeiros**: Apenas para diretores (admin)
- ✅ **Clientes**: Todos podem criar/editar/deletar (inicialmente)

### 3. **Funcionalidades Específicas**

#### 3.1 Upload de Arquivos
- ✅ **Supabase Storage** para armazenar currículos
- ✅ **Compressão automática** de PDFs
- ✅ Sistema de upload seguro

#### 3.2 Sistema de Email
- ⏳ **Decidir depois** - Não implementar no MVP

#### 3.3 Notificações
- ⏳ **Implementar depois** - Foco no backend básico primeiro

### 4. **Status do Kanban**

#### 4.1 Status Disponíveis
1. **selecionando** - Candidatos em análise inicial
2. **curriculo_enviado** - Currículos enviados ao cliente
3. **entrevista_agendada** - Entrevistas marcadas
4. **entrevista_realizada** - Entrevistas concluídas
5. **aprovado** - Candidatos aprovados
6. **reprovado** - Candidatos reprovados
7. **desistiu** - Candidatos que desistiram

#### 4.2 Histórico de Status
- ✅ Rastrear todas as mudanças de status
- ✅ Data/hora da mudança
- ✅ Usuário que fez a mudança
- ✅ Comentário opcional na mudança

### 5. **Estrutura de Pastas**

```
supabase/
├── migrations/          # Migrações aplicadas
├── functions/           # Edge Functions (se necessário)
└── seed/               # Dados iniciais
```

### 6. **Prioridades de Desenvolvimento**

#### 6.1 MVP (Fase 1)
- ✅ CRUD de usuários (admin/consultor)
- ✅ CRUD de clientes
- ✅ CRUD de vagas
- ✅ CRUD de candidatos
- ✅ Sistema de relacionamento candidato-vaga
- ✅ Histórico de status
- ✅ Upload de currículos
- ✅ Autenticação e autorização

#### 6.2 Fase 2 (Futuro)
- ⏳ Sistema de email
- ⏳ Notificações em tempo real
- ⏳ Relatórios avançados
- ⏳ Integrações externas

### 7. **Campos das Tabelas**

#### 7.1 usuarios
- id (uuid, primary key)
- email (unique)
- senha_hash
- nome
- tipo (admin/consultor)
- ativo (boolean)
- created_at
- updated_at

#### 7.2 clientes
- id (uuid, primary key)
- razao_social
- cnpj (unique)
- inscricao_estadual
- endereco_completo
- prazo_pagamento
- contato
- celular
- email
- ativo (boolean)
- created_at
- updated_at

#### 7.3 vagas
- id (uuid, primary key)
- numero_vaga (unique)
- empresa_id (foreign key)
- contato_envio_cv
- email
- celular
- cargo
- salario
- local_trabalho
- data_recebimento
- data_formatacao_perfil
- data_divulgacao
- data_inicio_selecao
- data_envio_curriculos
- data_encerramento
- perfil_word
- informacoes_complementares
- questionario_tecnico
- observacoes
- consultor_id (foreign key)
- status (ativa/pausada/fechada)
- created_at
- updated_at

#### 7.4 candidatos
- id (uuid, primary key)
- nome
- email
- telefone
- deleted_at (soft delete)
- created_at
- updated_at

#### 7.5 candidatos_vagas
- id (uuid, primary key)
- candidato_id (foreign key)
- vaga_id (foreign key)
- status_atual (enum dos status do kanban)
- data_candidatura
- observacoes
- avaliacao (1-5)
- created_at
- updated_at

#### 7.6 historico_status
- id (uuid, primary key)
- candidato_vaga_id (foreign key)
- status_anterior
- status_novo
- usuario_id (foreign key)
- comentario
- created_at

#### 7.7 curriculos
- id (uuid, primary key)
- candidato_id (foreign key)
- vaga_id (foreign key)
- nome_arquivo
- url_storage
- tamanho_bytes
- tipo_arquivo
- created_at

### 8. **Políticas de Segurança (RLS)**

#### 8.1 usuarios
- Usuários só veem seus próprios dados
- Admin vê todos os usuários

#### 8.2 clientes
- Todos os usuários autenticados podem ver/editar

#### 8.3 vagas
- Consultores só veem suas vagas
- Admin vê todas as vagas

#### 8.4 candidatos
- Consultores só veem candidatos de suas vagas
- Admin vê todos os candidatos

#### 8.5 curriculos
- Consultores só veem currículos de suas vagas
- Admin vê todos os currículos

### 9. **Índices Recomendados**

- usuarios: email
- clientes: cnpj
- vagas: numero_vaga, consultor_id, empresa_id
- candidatos_vagas: candidato_id, vaga_id, status_atual
- historico_status: candidato_vaga_id, created_at
- curriculos: candidato_id, vaga_id

### 10. **Validações**

#### 10.1 CNPJ
- Formato válido
- Único no sistema

#### 10.2 Email
- Formato válido
- Único por usuário

#### 10.3 Candidatura
- Candidato só pode se candidatar uma vez por vaga
- Status deve ser um dos valores válidos do Kanban

---

**Status**: ✅ Documentação completa
**Próximo passo**: Criar estrutura de migrações e implementar o backend 