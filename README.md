# 🪷 Lotus Recruit Hub

Sistema completo de recrutamento e seleção com backend Supabase e frontend React.

## 🚀 Status do Projeto

### ✅ **Backend (95% Concluído)**
- **14 Edge Functions** implementadas
- **7 tabelas** criadas no Supabase
- **Sistema de autenticação** JWT completo
- **Row Level Security (RLS)** configurado
- **Relatórios** e estatísticas funcionais

### ✅ **Frontend (85% Concluído)**
- **Sistema de autenticação** integrado
- **Proteção de rotas** implementada
- **Controle de acesso** granular
- **Página de clientes** totalmente integrada
- **Interface moderna** e responsiva

## 📋 Funcionalidades

### 🔐 **Autenticação e Controle de Acesso**
- Login com email/senha
- JWT tokens com refresh automático
- Níveis de acesso: Admin e Consultor
- Proteção de rotas baseada em permissões

### 🏢 **Gestão de Clientes**
- CRUD completo de empresas
- Validação de CNPJ
- Histórico de vagas por cliente
- Status ativo/inativo

### 💼 **Gestão de Vagas**
- CRUD completo de vagas
- Associação com consultores
- Status: Ativa, Pausada, Fechada
- Controle de acesso por consultor

### 👥 **Gestão de Candidatos**
- CRUD com soft delete
- Candidaturas múltiplas (N:N)
- Histórico de mudanças de status
- Avaliação e observações

### 📊 **Relatórios e Estatísticas**
- Vagas abertas e fechadas
- Taxa de aprovação por vaga
- Relatórios financeiros (admin)
- Estatísticas por consultor

### 📄 **Upload de Arquivos**
- Currículos em PDF
- Compressão automática
- Armazenamento no Supabase Storage

## 🛠️ Tecnologias

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados
- **Edge Functions** - APIs serverless
- **JWT** - Autenticação
- **Row Level Security** - Controle de acesso

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado
- **Shadcn/ui** - Componentes UI

## 📁 Estrutura do Projeto

```
lotus-recruit-hub/
├── 📁 src/                          # Frontend React
│   ├── 📁 components/               # Componentes reutilizáveis
│   │   ├── 📁 auth/                 # Autenticação
│   │   ├── 📁 dashboard/            # Dashboard
│   │   ├── 📁 layout/               # Layout principal
│   │   ├── 📁 ui/                   # Componentes base
│   │   └── 📁 [entidades]/          # Componentes específicos
│   ├── 📁 contexts/                 # Contextos React
│   ├── 📁 hooks/                    # Hooks customizados
│   ├── 📁 lib/                      # Utilitários e configurações
│   ├── 📁 pages/                    # Páginas da aplicação
│   └── 📁 types/                    # Tipos TypeScript
├── 📁 supabase/                     # Backend Supabase
│   ├── 📁 functions/                # Edge Functions
│   ├── 📁 migrations/               # Migrações do banco
│   ├── 📁 seed/                     # Dados iniciais
│   └── config.toml                  # Configuração local
├── 📁 docs/                         # Documentação
└── 📄 README.md                     # Este arquivo
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Supabase CLI
- Conta Supabase

### 1. Configurar Backend
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Inicializar projeto
supabase init

# Configurar variáveis de ambiente
cp .env.example .env.local
```

### 2. Configurar Frontend
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Executar em desenvolvimento
npm run dev
```

### 3. Deploy das Edge Functions
```bash
# Deploy de todas as funções
supabase functions deploy

# Ou função específica
supabase functions deploy auth-login
```

## 📚 Documentação

- [📋 Requisitos do Backend](docs/BACKEND_REQUIREMENTS.md)
- [🔌 Integração Frontend-Backend](docs/FRONTEND_INTEGRATION.md)
- [📖 Documentação da API](docs/API_DOCUMENTATION.md)
- [🏗️ Guia de Desenvolvimento](docs/DEVELOPMENT_GUIDE.md)

## 🎯 Próximos Passos

1. **Configurar Supabase Storage** para currículos
2. **Criar primeiro usuário admin** no banco
3. **Integrar páginas restantes** (vagas, candidatos)
4. **Testes de integração** completos
5. **Deploy em produção**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para otimizar processos de recrutamento e seleção** 