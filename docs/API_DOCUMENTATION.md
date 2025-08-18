# API Documentation - Lotus Recruit Hub

## 🔐 Autenticação

Todas as requisições (exceto login) devem incluir o header de autorização:

```
Authorization: Bearer <jwt_token>
```

### Login
```http
POST /functions/v1/auth-login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "nome": "Nome do Usuário",
      "tipo": "admin",
      "ativo": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

## 👥 Usuários

### Listar Usuários (Admin)
```http
GET /functions/v1/usuarios
Authorization: Bearer <jwt_token>
```

### Buscar Usuário Específico
```http
GET /functions/v1/usuarios?id=<user_id>
Authorization: Bearer <jwt_token>
```

### Criar Usuário (Admin)
```http
POST /functions/v1/usuarios
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "novo@exemplo.com",
  "password": "senha123",
  "nome": "Nome do Usuário",
  "tipo": "consultor",
  "ativo": true
}
```

### Atualizar Usuário
```http
PUT /functions/v1/usuarios
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "user_id",
  "nome": "Novo Nome",
  "password": "nova_senha" // opcional
}
```

### Deletar Usuário (Admin)
```http
DELETE /functions/v1/usuarios?id=<user_id>
Authorization: Bearer <jwt_token>
```

## 🏢 Clientes

### Listar Clientes
```http
GET /functions/v1/clientes
Authorization: Bearer <jwt_token>
```

### Buscar Cliente Específico
```http
GET /functions/v1/clientes?id=<cliente_id>
Authorization: Bearer <jwt_token>
```

### Criar Cliente
```http
POST /functions/v1/clientes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "razao_social": "Empresa Exemplo Ltda",
  "cnpj": "12.345.678/0001-90",
  "inscricao_estadual": "123456789",
  "endereco_completo": "Rua Exemplo, 123 - São Paulo, SP",
  "prazo_pagamento": "30 dias",
  "contato": "João Silva",
  "celular": "(11) 99999-9999",
  "email": "contato@empresa.com",
  "ativo": true
}
```

### Atualizar Cliente
```http
PUT /functions/v1/clientes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "cliente_id",
  "razao_social": "Nova Razão Social",
  "email": "novo@empresa.com"
}
```

### Deletar Cliente
```http
DELETE /functions/v1/clientes?id=<cliente_id>
Authorization: Bearer <jwt_token>
```

## 💼 Vagas

### Listar Vagas
```http
GET /functions/v1/vagas
Authorization: Bearer <jwt_token>
```

**Parâmetros de Query:**
- `consultor_id`: Filtrar por consultor
- `empresa_id`: Filtrar por empresa
- `status`: Filtrar por status (ativa, pausada, fechada)
- `search`: Busca por texto (cargo, número da vaga)

### Buscar Vaga Específica
```http
GET /functions/v1/vagas?id=<vaga_id>
Authorization: Bearer <jwt_token>
```

### Criar Vaga
```http
POST /functions/v1/vagas
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "numero_vaga": "DEV-001",
  "empresa_id": "empresa_uuid",
  "contato_envio_cv": "Maria Silva",
  "email": "rh@empresa.com",
  "celular": "(11) 88888-8888",
  "cargo": "Desenvolvedor Full Stack",
  "salario": "R$ 8.000 - R$ 12.000",
  "local_trabalho": "São Paulo, SP - Híbrido",
  "data_recebimento": "2024-01-10",
  "data_formatacao_perfil": "2024-01-12",
  "data_divulgacao": "2024-01-15",
  "data_inicio_selecao": "2024-01-16",
  "data_envio_curriculos": "2024-01-20",
  "data_encerramento": "2024-02-15",
  "perfil_word": "Descrição detalhada da vaga...",
  "informacoes_complementares": "Informações adicionais...",
  "questionario_tecnico": "Perguntas técnicas...",
  "observacoes": "Observações importantes...",
  "consultor_id": "consultor_uuid",
  "status": "ativa"
}
```

### Atualizar Vaga
```http
PUT /functions/v1/vagas
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "vaga_id",
  "cargo": "Novo Cargo",
  "salario": "R$ 10.000 - R$ 15.000",
  "status": "pausada"
}
```

### Deletar Vaga
```http
DELETE /functions/v1/vagas?id=<vaga_id>
Authorization: Bearer <jwt_token>
```

## 👤 Candidatos

### Listar Candidatos
```http
GET /functions/v1/candidatos
Authorization: Bearer <jwt_token>
```

**Parâmetros de Query:**
- `vaga_id`: Filtrar por vaga
- `status`: Filtrar por status do kanban
- `search`: Busca por nome ou email

### Buscar Candidato Específico
```http
GET /functions/v1/candidatos?id=<candidato_id>
Authorization: Bearer <jwt_token>
```

### Criar Candidato
```http
POST /functions/v1/candidatos
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao.silva@email.com",
  "telefone": "(11) 99999-9999"
}
```

### Atualizar Candidato
```http
PUT /functions/v1/candidatos
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "candidato_id",
  "nome": "João Silva Santos",
  "email": "joao.santos@email.com"
}
```

### Deletar Candidato (Soft Delete)
```http
DELETE /functions/v1/candidatos?id=<candidato_id>
Authorization: Bearer <jwt_token>
```

## 🎯 Candidatos por Vaga

### Listar Candidatos de uma Vaga
```http
GET /functions/v1/candidatos-vagas?vaga_id=<vaga_id>
Authorization: Bearer <jwt_token>
```

### Adicionar Candidato a uma Vaga
```http
POST /functions/v1/candidatos-vagas
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "candidato_id": "candidato_uuid",
  "vaga_id": "vaga_uuid",
  "status_atual": "selecionando",
  "observacoes": "Candidato interessante",
  "avaliacao": 4
}
```

### Atualizar Status do Candidato
```http
PUT /functions/v1/candidatos-vagas
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "candidato_vaga_id",
  "status_atual": "entrevista_agendada",
  "observacoes": "Entrevista marcada para próxima semana",
  "avaliacao": 5
}
```

### Remover Candidato de uma Vaga
```http
DELETE /functions/v1/candidatos-vagas?id=<candidato_vaga_id>
Authorization: Bearer <jwt_token>
```

## 📊 Histórico de Status

### Listar Histórico de um Candidato
```http
GET /functions/v1/historico-status?candidato_vaga_id=<candidato_vaga_id>
Authorization: Bearer <jwt_token>
```

### Adicionar Entrada no Histórico
```http
POST /functions/v1/historico-status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "candidato_vaga_id": "candidato_vaga_uuid",
  "status_anterior": "selecionando",
  "status_novo": "entrevista_agendada",
  "usuario_id": "usuario_uuid",
  "comentario": "Candidato aprovado para entrevista"
}
```

## 📄 Currículos

### Listar Currículos
```http
GET /functions/v1/curriculos
Authorization: Bearer <jwt_token>
```

**Parâmetros de Query:**
- `candidato_id`: Filtrar por candidato
- `vaga_id`: Filtrar por vaga

### Upload de Currículo
```http
POST /functions/v1/curriculos
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "candidato_id": "candidato_uuid",
  "vaga_id": "vaga_uuid",
  "arquivo": <file>
}
```

### Deletar Currículo
```http
DELETE /functions/v1/curriculos?id=<curriculo_id>
Authorization: Bearer <jwt_token>
```

## 📈 Estatísticas

### Estatísticas de Vagas
```http
GET /functions/v1/stats/vagas
Authorization: Bearer <jwt_token>
```

**Resposta:**
```json
{
  "data": {
    "total": 25,
    "ativas": 15,
    "pausadas": 5,
    "fechadas": 5,
    "por_consultor": [
      {
        "consultor_id": "uuid",
        "consultor_nome": "João Silva",
        "total": 10,
        "ativas": 8
      }
    ]
  }
}
```

### Estatísticas de Candidatos
```http
GET /functions/v1/stats/candidatos
Authorization: Bearer <jwt_token>
```

**Resposta:**
```json
{
  "data": {
    "total": 150,
    "por_status": [
      {
        "status": "selecionando",
        "count": 45
      },
      {
        "status": "aprovado",
        "count": 12
      }
    ],
    "por_vaga": [
      {
        "vaga_id": "uuid",
        "vaga_numero": "DEV-001",
        "total": 25
      }
    ]
  }
}
```

## 🔍 Relatórios

### Relatório de Vagas Abertas
```http
GET /functions/v1/relatorios/vagas-abertas
Authorization: Bearer <jwt_token>
```

### Relatório de Posições Fechadas
```http
GET /functions/v1/relatorios/posicoes-fechadas
Authorization: Bearer <jwt_token>
```

### Relatório Financeiro (Admin)
```http
GET /functions/v1/relatorios/financeiro
Authorization: Bearer <jwt_token>
```

## ⚠️ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `UNAUTHORIZED` | Token de autenticação necessário |
| `INVALID_TOKEN` | Token inválido ou expirado |
| `FORBIDDEN` | Acesso negado (sem permissão) |
| `NOT_FOUND` | Recurso não encontrado |
| `MISSING_FIELDS` | Campos obrigatórios não fornecidos |
| `EMAIL_EXISTS` | Email já cadastrado |
| `CNPJ_EXISTS` | CNPJ já cadastrado |
| `VAGA_EXISTS` | Número da vaga já existe |
| `CANDIDATO_EXISTS` | Candidato já se candidatou para esta vaga |
| `USER_HAS_VAGAS` | Usuário tem vagas associadas |
| `INTERNAL_ERROR` | Erro interno do servidor |

## 📝 Exemplos de Uso

### Fluxo Completo: Criar Vaga e Adicionar Candidato

1. **Criar Cliente:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/clientes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razao_social": "TechCorp Ltda",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@techcorp.com"
  }'
```

2. **Criar Vaga:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/vagas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numero_vaga": "DEV-001",
    "empresa_id": "CLIENTE_UUID",
    "cargo": "Desenvolvedor Full Stack",
    "consultor_id": "CONSULTOR_UUID"
  }'
```

3. **Criar Candidato:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/candidatos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com"
  }'
```

4. **Adicionar Candidato à Vaga:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/candidatos-vagas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidato_id": "CANDIDATO_UUID",
    "vaga_id": "VAGA_UUID",
    "status_atual": "selecionando"
  }'
```

5. **Atualizar Status do Candidato:**
```bash
curl -X PUT https://your-project.supabase.co/functions/v1/candidatos-vagas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CANDIDATO_VAGA_UUID",
    "status_atual": "entrevista_agendada"
  }'
```

---

**Nota:** Todas as URLs devem ser substituídas pela URL real do seu projeto Supabase. 