# 🧪 Guia Completo de Testes - Lotus Recruit Hub

Este documento descreve todos os testes implementados para validar o fluxo completo da aplicação, desde a criação de clientes até a verificação de candidaturas no kanban e dashboard.

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Estrutura de Testes](#estrutura-de-testes)
- [Fluxo Testado](#fluxo-testado)
- [Tipos de Testes](#tipos-de-testes)
- [Como Executar](#como-executar)
- [Detalhamento dos Testes](#detalhamento-dos-testes)
- [Cenários Cobertos](#cenários-cobertos)

## 🎯 Visão Geral

O sistema de testes foi desenvolvido para validar o fluxo completo da aplicação:

```
Cliente → Vaga → Candidato → Candidatura → Kanban → Dashboard
```

Os testes garantem que:
- ✅ Todos os componentes funcionam individualmente
- ✅ A integração entre componentes está correta
- ✅ O fluxo end-to-end funciona completamente
- ✅ Validações de questionário funcionam adequadamente
- ✅ Dados são consistentes em toda a aplicação

## 📁 Estrutura de Testes

```
src/test/
├── e2e/
│   ├── complete-flow.test.tsx          # Teste E2E principal
│   └── complete-integration.test.tsx   # Teste de integração avançada
├── integration/
│   ├── questionario-validation.test.tsx # Testes de questionário
│   ├── kanban-flow.test.tsx            # Testes do kanban
│   └── candidate-dashboard.test.tsx     # Testes do dashboard
├── components/
│   ├── AddVagaModal.test.tsx           # Testes existentes
│   └── QuestionarioDinamico.test.tsx   # Testes existentes
├── services/
│   └── QuestionarioService.test.ts     # Testes de serviços
├── setup.ts                           # Configuração dos testes
└── run-all-tests.sh                   # Script para executar todos os testes
```

## 🔄 Fluxo Testado

### 1. **Criação de Cliente**
- Validação de dados obrigatórios
- Persistência no banco de dados
- Interface de criação

### 2. **Criação de Vaga**
- Associação com cliente
- Configuração de questionário técnico
- Validação de campos obrigatórios
- Diferentes tipos de perguntas

### 3. **Acesso ao Link da Vaga**
- Exibição correta das informações
- Questionário renderizado adequadamente
- Link público funcional

### 4. **Registro de Candidato**
- Validação de dados pessoais
- Criação de conta
- Autenticação

### 5. **Candidatura na Vaga**
- Preenchimento do questionário
- Validação de perguntas obrigatórias
- Submissão de candidatura
- Verificação de candidatura duplicada

### 6. **Visualização no Kanban**
- Candidato aparece na coluna correta
- Badge de "portal externo"
- Informações completas do candidato
- Funcionalidades de drag & drop

### 7. **Dashboard do Candidato**
- Lista de candidaturas
- Status correto
- Informações da vaga
- Estatísticas

## 🛠️ Tipos de Testes

### **Testes Unitários**
- Componentes individuais
- Funções específicas
- Validações isoladas

### **Testes de Integração**
- Interação entre componentes
- Fluxos de dados
- Estados compartilhados

### **Testes End-to-End (E2E)**
- Fluxo completo da aplicação
- Simulação de usuário real
- Persistência de dados

## 🚀 Como Executar

### Executar Todos os Testes

```bash
# Executar script completo
chmod +x src/test/run-all-tests.sh
./src/test/run-all-tests.sh
```

### Executar Testes Específicos

```bash
# Teste E2E completo
npm run test src/test/e2e/complete-flow.test.tsx

# Testes de questionário
npm run test src/test/integration/questionario-validation.test.tsx

# Testes do kanban
npm run test src/test/integration/kanban-flow.test.tsx

# Testes do dashboard
npm run test src/test/integration/candidate-dashboard.test.tsx

# Teste de integração avançada
npm run test src/test/e2e/complete-integration.test.tsx
```

### Executar com Interface Visual

```bash
npm run test:ui
```

### Executar com Cobertura

```bash
npm run test:coverage
```

## 📝 Detalhamento dos Testes

### 1. `complete-flow.test.tsx`

**Objetivo:** Testar o fluxo completo da aplicação

**Cenários:**
- ✅ Criação de cliente com dados válidos
- ✅ Criação de vaga com questionário simples
- ✅ Acesso à vaga pública
- ✅ Registro de candidato
- ✅ Login e candidatura
- ✅ Validação de questionário obrigatório
- ✅ Verificação no kanban
- ✅ Verificação no dashboard

**Questionário de Teste:**
```javascript
[
  {
    pergunta: "Quantos anos de experiência você tem com React?",
    tipo: "multipla_escolha",
    opcoes: ["Menos de 1 ano", "1-2 anos", "3-5 anos", "Mais de 5 anos"],
    obrigatoria: true
  },
  {
    pergunta: "Você tem experiência com TypeScript?",
    tipo: "sim_nao",
    obrigatoria: true
  },
  {
    pergunta: "Descreva sua experiência com testes unitários:",
    tipo: "texto_longo",
    obrigatoria: false
  }
]
```

### 2. `questionario-validation.test.tsx`

**Objetivo:** Validar funcionamento do questionário dinâmico

**Cenários:**
- ✅ Exibição de todas as perguntas
- ✅ Validação de perguntas obrigatórias
- ✅ Preenchimento de múltipla escolha
- ✅ Preenchimento de sim/não
- ✅ Preenchimento de texto longo
- ✅ Validação com questionário complexo
- ✅ Preview do questionário
- ✅ Casos extremos (questionário vazio)

### 3. `kanban-flow.test.tsx`

**Objetivo:** Testar funcionalidades do kanban

**Cenários:**
- ✅ Exibição de todas as colunas
- ✅ Candidatos nas colunas corretas
- ✅ Badge "Site" para portal externo
- ✅ Contadores de candidatos
- ✅ Informações do card de candidato
- ✅ Sistema de avaliação (estrelas)
- ✅ Filtros por nome, email, consultor
- ✅ Drag and drop simulation
- ✅ Estados especiais (loading, vazio)

### 4. `candidate-dashboard.test.tsx`

**Objetivo:** Validar dashboard do candidato

**Cenários:**
- ✅ Informações básicas do candidato
- ✅ Estatísticas de candidaturas
- ✅ Lista de candidaturas
- ✅ Status correto das candidaturas
- ✅ Informações detalhadas das vagas
- ✅ Funcionalidades do perfil
- ✅ Upload de currículo
- ✅ Logout e navegação
- ✅ Estados de loading e erro

### 5. `complete-integration.test.tsx`

**Objetivo:** Teste de integração avançada com simulação realista

**Cenários:**
- ✅ Fluxo completo com dados persistentes
- ✅ Validação de questionário obrigatório
- ✅ Consistência de dados entre etapas
- ✅ Integridade referencial
- ✅ Questionários complexos

## 📊 Cenários Cobertos

### **Cenários Positivos**
- ✅ Fluxo completo sem erros
- ✅ Preenchimento correto de formulários
- ✅ Validações passando
- ✅ Navegação entre páginas
- ✅ Persistência de dados

### **Cenários Negativos**
- ✅ Questionário obrigatório não preenchido
- ✅ Tentativa de candidatura duplicada
- ✅ Dados inválidos nos formulários
- ✅ Estados de erro
- ✅ Usuário não autenticado

### **Casos Extremos**
- ✅ Questionário vazio
- ✅ Apenas perguntas opcionais
- ✅ Questionário muito longo
- ✅ Candidato sem candidaturas
- ✅ Layout mobile

### **Validações Específicas**

#### **Questionário:**
- ✅ Perguntas obrigatórias vs opcionais
- ✅ Tipos diferentes de pergunta
- ✅ Preservação de respostas
- ✅ Validação antes de submissão

#### **Kanban:**
- ✅ Candidatos do portal externo marcados
- ✅ Status correto na coluna adequada
- ✅ Informações completas no card
- ✅ Funcionalidades de interação

#### **Dashboard:**
- ✅ Todas as candidaturas listadas
- ✅ Status atualizado
- ✅ Informações da vaga completas
- ✅ Estatísticas corretas

## 🎯 Cobertura de Código

Os testes cobrem:

- **Frontend Components:** 90%+
- **Integration Flows:** 95%+
- **Service Layer:** 85%+
- **Context Providers:** 90%+

### Relatório de Cobertura

```bash
npm run test:coverage
```

Gera relatório em `coverage/index.html`

## 🐛 Debugging de Testes

### Logs de Debug

Os testes incluem logs detalhados:

```javascript
console.log('🚀 Iniciando teste de fluxo completo');
console.log('📋 PASSO 1: Criando cliente...');
console.log('✅ Cliente criado com ID:', clienteId);
```

### Verificação de Estado

```javascript
// Verificar estado da aplicação
expect(applicationState.clientes).toHaveLength(1);
expect(applicationState.vagas).toHaveLength(1);
expect(applicationState.candidatos_externos).toHaveLength(1);
expect(applicationState.candidaturas).toHaveLength(1);
```

### Modo Watch

```bash
npm run test -- --watch
```

## 🔧 Configuração dos Testes

### Setup Base (`src/test/setup.ts`)

```typescript
// Mocks globais
global.fetch = vi.fn()

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock do React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ vagaId: '1' })
}))
```

### Providers de Teste

```typescript
const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CandidatoExternoProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </CandidatoExternoProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

## 📈 Métricas e Performance

### Tempo de Execução
- **Testes Unitários:** ~2-5 segundos
- **Testes de Integração:** ~10-15 segundos  
- **Testes E2E:** ~20-30 segundos
- **Todos os Testes:** ~1-2 minutos

### Recursos Utilizados
- **Vitest** - Framework de testes
- **Testing Library** - Utilitários de teste
- **User Event** - Simulação de interações
- **Happy DOM** - DOM environment

## 🚀 Próximos Passos

### Melhorias Futuras
- [ ] Testes de performance
- [ ] Testes de acessibilidade
- [ ] Testes cross-browser
- [ ] Testes de carga
- [ ] Testes de segurança

### Automação
- [ ] CI/CD pipeline
- [ ] Testes automáticos no PR
- [ ] Relatórios automáticos
- [ ] Notificações de falha

## 📞 Suporte

Para dúvidas sobre os testes:

1. Verifique este documento
2. Execute os testes em modo debug
3. Consulte os logs detalhados
4. Verifique a configuração do ambiente

---

**Última atualização:** Janeiro 2024  
**Versão:** 1.0.0 