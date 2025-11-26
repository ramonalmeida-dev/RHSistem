# Melhorias no Kanban e Visualização de Currículos

## Data da Implementação
26 de novembro de 2025

## Alterações Implementadas

### 1. Renomeação de Colunas do Kanban

Foram renomeadas duas colunas do kanban para melhor refletir o processo seletivo:

#### Alteração 1: "Entrevista" → "Na empresa"
- **Status ID:** `entrevista_agendada` (mantido)
- **Novo título:** "Na empresa"
- **Descrição:** "Candidatos na empresa"
- **Justificativa:** Reflete melhor quando o candidato já está em processo dentro da empresa

#### Alteração 2: "Selecionando" → "Em seleção"
- **Status ID:** `selecionando` (mantido)
- **Novo título:** "Em seleção"
- **Descrição:** "Candidatos em processo de seleção" (mantida)
- **Justificativa:** Melhor gramática e clareza sobre o status

**Arquivo alterado:**
- `src/components/kanban/KanbanBoard.tsx` (linhas 41-48 e 77-84)

---

### 2. Visualização de PDF Inline no Kanban

Implementada funcionalidade para visualizar currículos em PDF **diretamente na mesma tela**, sem necessidade de download ou abrir em nova aba.

#### Novo Componente: PdfViewerModal

**Arquivo criado:** `src/components/curriculos/PdfViewerModal.tsx`

**Funcionalidades:**
- ✅ Visualização inline do PDF usando iframe
- ✅ Botão para download do PDF
- ✅ Botão para abrir em nova aba (se preferir)
- ✅ Loading state enquanto PDF carrega
- ✅ Modal responsivo (90% da largura e altura da tela)
- ✅ Toolbar do PDF visível para navegação entre páginas
- ✅ Nome do candidato no título do modal
- ✅ Tratamento de erros no carregamento

**Interface do Componente:**
```typescript
interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  candidateName: string;
}
```

**Recursos do Visualizador:**
- **Iframe otimizado:** Configurado com parâmetros para melhor visualização
  - `toolbar=1`: Mostra barra de ferramentas do PDF
  - `navpanes=0`: Oculta painel de navegação lateral
  - `scrollbar=1`: Permite scroll no documento
  - `view=FitH`: Ajusta largura ao container

- **Controles do Modal:**
  - Botão "Baixar" com ícone de download
  - Botão "Nova aba" para abrir em navegador separado
  - Botão "X" para fechar modal

#### Integração com a Página de Vagas

**Arquivo alterado:** `src/pages/Vagas.tsx`

**Alterações realizadas:**

1. **Import do novo componente:**
```typescript
import { PdfViewerModal } from "@/components/curriculos/PdfViewerModal";
```

2. **Novos estados adicionados:**
```typescript
const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
const [pdfUrl, setPdfUrl] = useState<string>('');
```

3. **Modificação do `handleViewCurriculo`:**
   - Removida lógica de download automático
   - Removida abertura em nova aba por padrão
   - Adicionada lógica para obter URL pública do PDF
   - Configuração dos estados para abrir modal de visualização

**Antes:**
```typescript
// Baixava o arquivo automaticamente ou abria em nova aba
window.open(data.url_storage, '_blank');
// ou
const url = URL.createObjectURL(fileData);
a.download = data.nome_arquivo || 'curriculo.pdf';
a.click();
```

**Depois:**
```typescript
// Obtém URL e abre modal de visualização
setPdfUrl(urlToView);
setIsPdfViewerOpen(true);
```

4. **Componente PdfViewerModal adicionado ao JSX:**
```typescript
<PdfViewerModal
  isOpen={isPdfViewerOpen}
  onClose={() => {
    setIsPdfViewerOpen(false);
    setPdfUrl('');
    setSelectedCandidate(null);
  }}
  pdfUrl={pdfUrl}
  candidateName={selectedCandidate?.name || ''}
/>
```

---

## Fluxo de Uso Atualizado

### Visualizar Currículo no Kanban

1. Usuário clica no ícone de visualização (📄) no card do candidato
2. Sistema busca o currículo no banco de dados
3. Sistema obtém URL pública do PDF
4. **Modal é aberto com PDF carregado inline**
5. Usuário pode:
   - Visualizar o PDF diretamente no modal
   - Navegar pelas páginas usando controles do PDF
   - Baixar o PDF se desejar
   - Abrir em nova aba se preferir
   - Fechar o modal e continuar trabalhando

### Vantagens da Nova Abordagem

✅ **Experiência do usuário melhorada:**
- Não precisa gerenciar múltiplas abas
- Visualização rápida sem interromper workflow
- Interface unificada

✅ **Eficiência:**
- Menos cliques para visualizar
- Não congestiona gerenciador de downloads
- Mantém contexto da vaga

✅ **Flexibilidade:**
- Ainda permite download se necessário
- Opção de abrir em nova aba disponível
- Controles intuitivos

---

## Compatibilidade

### Tipos de Arquivo Suportados
- PDF (principal e recomendado)
- Outros formatos que o navegador consiga renderizar em iframe

### Navegadores Compatíveis
- Chrome/Edge (recomendado)
- Firefox
- Safari
- Qualquer navegador moderno com suporte a iframe e visualização de PDF

### Fontes de Currículo
✅ Candidatos externos (URL completa HTTP)
✅ Arquivos no Supabase Storage
✅ URLs públicas do Supabase

---

## Tratamento de Erros

O sistema trata os seguintes cenários:

1. **Currículo não encontrado:**
   - Toast de erro informando que candidato não tem currículo

2. **Arquivo não disponível:**
   - Toast informando que arquivo precisa de re-upload

3. **Erro ao gerar URL:**
   - Toast informando impossibilidade de gerar URL de visualização

4. **Erro ao carregar PDF no iframe:**
   - Indicador de loading oculta após timeout
   - Log de erro no console para debug

---

## Arquivos Modificados

1. ✅ `src/components/kanban/KanbanBoard.tsx`
   - Renomeação de colunas do kanban

2. ✅ `src/components/curriculos/PdfViewerModal.tsx` (NOVO)
   - Componente modal de visualização de PDF

3. ✅ `src/pages/Vagas.tsx`
   - Import do PdfViewerModal
   - Novos estados (isPdfViewerOpen, pdfUrl)
   - Modificação do handleViewCurriculo
   - Adição do componente PdfViewerModal no JSX

---

## Testes Recomendados

### Teste 1: Visualização de Currículo de Candidato Externo
1. Acessar kanban de uma vaga
2. Clicar no ícone de visualização de um candidato que veio pelo portal
3. Verificar se modal abre com PDF carregado
4. Testar navegação entre páginas do PDF
5. Testar botões de download e nova aba

### Teste 2: Visualização de Currículo do Banco de Currículos
1. Acessar kanban de uma vaga
2. Clicar no ícone de visualização de um candidato adicionado manualmente
3. Verificar se modal abre com PDF carregado
4. Verificar se nome do candidato está correto no título

### Teste 3: Tratamento de Erros
1. Candidato sem currículo → deve mostrar toast de erro
2. Arquivo marcado como não disponível → deve mostrar toast específico
3. Erro de rede → deve tratar graciosamente

### Teste 4: Nomes das Colunas
1. Acessar qualquer vaga no modo kanban
2. Verificar se coluna "Na empresa" está presente (não mais "Entrevista")
3. Verificar se coluna "Em seleção" está presente (não mais "Selecionando")

---

## Observações Técnicas

### Performance
- Iframe carrega PDF de forma assíncrona
- Loading state previne confusão durante carregamento
- URL pública do Supabase otimizada para streaming

### Segurança
- URLs públicas do Supabase têm controle de acesso via RLS
- Iframe com atributos de segurança padrão
- Sem exposição de tokens ou dados sensíveis na URL

### Acessibilidade
- Modal com title descritivo
- Botões com labels e tooltips
- Contraste adequado nos elementos
- Navegação por teclado funcional (ESC fecha modal)

---

## Melhorias Futuras Possíveis

1. **Zoom e rotação de PDF**
   - Adicionar controles personalizados para zoom
   - Permitir rotação do documento

2. **Suporte a múltiplos currículos**
   - Visualizar múltiplos currículos em abas no mesmo modal
   - Navegação entre diferentes versões

3. **Anotações**
   - Permitir fazer anotações no PDF
   - Salvar comentários vinculados ao currículo

4. **Preview de outros formatos**
   - Suporte a DOC/DOCX usando visualizador
   - Converter automaticamente para PDF se necessário

---

## Conclusão

As alterações implementadas melhoram significativamente a experiência do usuário ao trabalhar com currículos no kanban, tornando o processo mais ágil e intuitivo. A renomeação das colunas também traz maior clareza sobre o status dos candidatos no processo seletivo.

