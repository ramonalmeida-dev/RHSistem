# 📧 Integração Email Brevo com Kanban - Lotus Recruit Hub

## 📋 Visão Geral

Esta documentação descreve a integração completa do sistema de email Brevo com o Kanban do Lotus Recruit Hub, com modal de confirmação **simplificado** que automaticamente determina qual template usar baseado na coluna de destino.

## 🎯 Funcionalidades Implementadas

### 1. Modal de Confirmação Simplificado
- **Localização**: `src/components/kanban/EmailConfirmationModal.tsx`
- **Funcionalidade**: Modal que aparece ao mover candidato no Kanban
- **Lógica Inteligente**: Determina automaticamente o template baseado no status de origem e destino
- **Interface Simples**: Apenas pergunta "Enviar email?" - Sim ou Não

### 2. Detecção Automática de Template
O sistema automaticamente escolhe o template correto baseado na movimentação:

#### Para Status "REPROVADO":
- **De "Selecionando" ou "CV Enviado"** → Template: **Triagem inicial**
- **De "Entrevista Agendada"** → Template: **Entrevista com consultor**
- **De outros status avançados** → Template: **Entrevista com empresa**

#### Para Outros Status:
- **"Aprovado"** → Template de aprovação
- **"Entrevista Agendada"** → Notificação de entrevista
- **"Desistiu"** → Sem email (opcional)

## 🔄 Fluxo Simplificado

### 1. Movimentação no Kanban
```typescript
1. Usuário arrasta candidato no Kanban
2. Sistema detecta status origem e destino
3. Modal abre com template pré-selecionado
4. Usuário escolhe: "Enviar email?" ☑️ Sim / ☐ Não
5. Sistema atualiza status + envia email (se selecionado)
```

### 2. Lógica de Detecção Automática
```typescript
// Exemplo: Candidato movido de "Entrevista Agendada" para "Reprovado"
const emailConfig = getEmailConfig('reprovado', 'entrevista_agendada');
// Resultado: Template "Entrevista com consultor"
```

### 3. Interface do Modal
- ✅ **Informações do candidato** (nome, email, vaga, status)
- ✅ **Template detectado automaticamente** (mostrado como informação)
- ✅ **Checkbox simples**: "Enviar email para o candidato"
- ✅ **Campos dinâmicos**: Consultor e empresa (apenas se necessário)
- ✅ **Botões**: Cancelar ou Confirmar

## 🛠️ Implementação Técnica

### Função de Detecção Inteligente
```typescript
const getEmailConfig = (newStatus: string, oldStatus: string) => {
  if (newStatus === 'reprovado') {
    if (oldStatus === 'selecionando' || oldStatus === 'curriculo_enviado') {
      return { templateType: 'triagem', ... };
    } else if (oldStatus === 'entrevista_agendada') {
      return { templateType: 'entrevista_consultor', ... };
    } else {
      return { templateType: 'entrevista_empresa', ... };
    }
  }
  // ... outros mapeamentos
};
```

### Interface Simplificada
```typescript
interface EmailConfirmationModalProps {
  candidate: Candidate;
  newStatus: string;
  oldStatus: string; // ← Novo: para detecção automática
  // ... outros props
}
```

### Estados do Modal
```typescript
const [sendEmail, setSendEmail] = useState(true); // Checkbox simples
const [consultorNome, setConsultorNome] = useState('Equipe de Recrutamento');
const [empresaNome, setEmpresaNome] = useState('Lotus Recruit Hub');
```

## 📧 Templates Automáticos

### 1. Triagem Inicial
- **Trigger**: Reprovado vindo de "Selecionando" ou "CV Enviado"
- **Template**: `CANDIDATO_NAO_APROVEITADO_TRIAGEM`
- **Assunto**: "Agradecimento por sua candidatura"

### 2. Entrevista Consultor
- **Trigger**: Reprovado vindo de "Entrevista Agendada"
- **Template**: `CANDIDATO_NAO_APROVEITADO_ENTREVISTA_CONSULTOR`
- **Assunto**: "Agradecimento por sua participação no processo seletivo"

### 3. Entrevista Empresa
- **Trigger**: Reprovado vindo de status avançados
- **Template**: `CANDIDATO_NAO_APROVEITADO_ENTREVISTA_EMPRESA`
- **Assunto**: "Retorno sobre o processo seletivo"

### 4. Candidato Aprovado
- **Trigger**: Movido para "Aprovado"
- **Template**: `CANDIDATO_APROVADO`
- **Assunto**: "Parabéns! Você foi aprovado para a vaga"

## 🎨 Experiência do Usuário

### Cenário 1: Rejeição na Triagem
```
1. Usuário move "João Silva" de "Selecionando" → "Reprovado"
2. Modal abre: "Enviar email de agradecimento por candidatura?"
3. ☑️ Sim (já marcado por padrão)
4. Campos: Consultor e Empresa (pré-preenchidos)
5. Clica "Atualizar e Enviar Email"
6. ✅ João recebe email de triagem personalizado
```

### Cenário 2: Aprovação
```
1. Usuário move "Maria Santos" de "Entrevista" → "Aprovado"
2. Modal abre: "Enviar email de aprovação?"
3. ☑️ Sim
4. Clica "Atualizar e Enviar Email"
5. ✅ Maria recebe email de parabéns
```

### Cenário 3: Sem Email
```
1. Usuário move candidato para "Desistiu"
2. Modal abre: "Status será atualizado. Nenhum email será enviado."
3. Clica "Atualizar Status"
4. ✅ Apenas status é atualizado
```

## 🔧 Configuração e Personalização

### Campos Dinâmicos
- **Consultor**: Aparece para templates de rejeição
- **Empresa**: Aparece para templates de rejeição
- **Valores Padrão**: "Equipe de Recrutamento" e "Lotus Recruit Hub"

### Validações Automáticas
- ✅ Verifica se candidato tem email
- ✅ Mostra aviso visual se não tem email
- ✅ Permite continuar sem envio se necessário
- ✅ Pré-seleciona "Enviar email" quando aplicável

### Estados Visuais
- 🔵 **Azul**: Informações do template selecionado
- 🟠 **Laranja**: Aviso de candidato sem email
- 🟢 **Verde**: Confirmação de que não precisa email
- ⚪ **Cinza**: Campos desabilitados durante loading

## 🚨 Tratamento de Erros

### Cenários Cobertos
1. **Candidato sem email**: Aviso visual, permite continuar
2. **Erro de envio**: Toast de erro, status ainda é atualizado
3. **Template não encontrado**: Usa template genérico
4. **Erro de rede**: Tratamento gracioso

### Logs Automáticos
```typescript
console.log('Template detectado:', emailConfig.templateType);
console.log('Enviando email:', candidato.email);
console.error('Erro no envio:', error);
```

## 📊 Vantagens da Implementação

### ✅ **Simplicidade**
- Modal com apenas 1 decisão: Enviar ou não enviar
- Sem necessidade de escolher template manualmente
- Interface limpa e intuitiva

### ✅ **Inteligência**
- Detecção automática baseada no fluxo real
- Templates contextualizados para cada situação
- Reduz erros humanos na seleção

### ✅ **Flexibilidade**
- Fácil de adicionar novos templates
- Lógica de detecção configurável
- Campos dinâmicos baseados no template

### ✅ **Robustez**
- Fallbacks para casos não previstos
- Tratamento de erros gracioso
- Validações automáticas

## 🔄 Fluxo Completo de Exemplo

```
📋 CENÁRIO: Candidato rejeitado após entrevista com consultor

1. Status atual: "Entrevista Agendada"
2. Usuário arrasta para: "Reprovado"
3. Sistema detecta: oldStatus="entrevista_agendada" → newStatus="reprovado"
4. Template escolhido: "Entrevista com consultor"
5. Modal abre:
   ┌─────────────────────────────────────────┐
   │ 📧 Confirmar mudança de status          │
   │                                         │
   │ Candidato: João Silva                   │
   │ Email: joao@email.com                   │
   │ Novo status: Reprovado                  │
   │                                         │
   │ ☑️ Enviar email para o candidato        │
   │                                         │
   │ 📧 Não aproveitado - Após entrevista    │
   │    consultor                            │
   │                                         │
   │ Consultor: [Ana Costa    ]              │
   │ Empresa:   [Tech Corp    ]              │
   │                                         │
   │ [Cancelar] [Atualizar e Enviar Email]   │
   └─────────────────────────────────────────┘
6. Usuário clica "Atualizar e Enviar Email"
7. Sistema:
   - ✅ Atualiza status no banco
   - ✅ Envia email usando template específico
   - ✅ Mostra toast de sucesso
8. João recebe email personalizado de agradecimento
```

## 🚀 Próximos Passos

### Melhorias Futuras
1. **Preview do Email**: Botão para visualizar antes de enviar
2. **Histórico**: Log de emails enviados por candidato
3. **Templates Personalizáveis**: Editor visual de templates
4. **Agendamento**: Envio programado de emails
5. **A/B Testing**: Testar diferentes versões de templates

---

**Implementado em**: Janeiro 2025  
**Versão**: 2.0.0 - Modal Simplificado  
**Status**: ✅ Funcional e Otimizado para UX 