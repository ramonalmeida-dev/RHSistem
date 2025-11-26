# Adição do Campo "Cargo" no Cadastro Manual de Currículos

## Data da Implementação
26 de novembro de 2025

## Objetivo
Adicionar o campo **"Cargo"** no formulário de cadastro manual de currículos do banco de CVs para permitir uma nomenclatura mais específica e alinhada com os cargos das vagas.

---

## Alterações Realizadas no Frontend

### 1. Interface de Dados Atualizada

**Arquivo:** `src/components/curriculos/AddCurriculoModal.tsx`

```typescript
interface CurriculoData {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;                 // ✅ NOVO CAMPO ADICIONADO
  area_atuacao: string;
  experiencia_anos: number;
  formacao: string;
  localizacao: string;
  disponibilidade: 'disponivel' | 'empregado' | 'indisponivel';
  avaliacao: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  curriculo?: File;
}
```

---

### 2. Estado Inicial Atualizado

```typescript
const [formData, setFormData] = useState<CurriculoData>({
  nome: "",
  email: "",
  telefone: "",
  cargo: "",                     // ✅ NOVO CAMPO INICIALIZADO
  area_atuacao: "",
  experiencia_anos: 0,
  formacao: "",
  localizacao: "",
  disponibilidade: "disponivel",
  avaliacao: 1,
  observacoes: "",
  linkedin_url: "",
  portfolio_url: ""
});
```

---

### 3. Formulário JSX Atualizado

**Novo campo adicionado na seção "Informações Profissionais":**

```jsx
<div className="space-y-2">
  <Label htmlFor="cargo">
    Cargo
    <span className="text-xs text-gray-500 ml-2">
      (Ex: Analista de Marketing Pleno, Desenvolvedor Full Stack, Designer UI/UX)
    </span>
  </Label>
  <Input
    id="cargo"
    value={formData.cargo}
    onChange={(e) => handleInputChange('cargo', e.target.value)}
    placeholder="Digite o cargo do candidato"
  />
</div>
```

**Posição:** Logo acima do campo "Área de Atuação"

---

### 4. Chamada RPC Atualizada

```typescript
const { data: resultado, error: rpcError } = await supabase
  .rpc('adicionar_curriculo_manual', {
    p_nome: formData.nome,
    p_email: formData.email,
    p_telefone: formData.telefone,
    p_cargo: formData.cargo || null,           // ✅ NOVO PARÂMETRO
    p_area_atuacao: formData.area_atuacao || null,
    p_experiencia_anos: formData.experiencia_anos,
    p_formacao: formData.formacao || null,
    p_localizacao: formData.localizacao || null,
    p_disponibilidade: formData.disponibilidade,
    p_avaliacao: formData.avaliacao,
    p_observacoes: formData.observacoes || null,
    p_linkedin_url: formData.linkedin_url || null,
    p_portfolio_url: formData.portfolio_url || null,
    p_nome_arquivo: processedFileName || curriculoFile?.name || null,
    p_url_storage: url_storage || null,
    p_tamanho_bytes: curriculoFile?.size || 0,
    p_tipo_arquivo: curriculoFile?.type || null
  });
```

---

### 5. Reset de Formulário Atualizado

```typescript
setFormData({
  nome: "",
  email: "",
  telefone: "",
  cargo: "",                     // ✅ CAMPO RESETADO
  area_atuacao: "",
  experiencia_anos: 0,
  formacao: "",
  localizacao: "",
  disponibilidade: "disponivel",
  avaliacao: 1,
  observacoes: "",
  linkedin_url: "",
  portfolio_url: ""
});
```

---

## Alterações Necessárias no Backend

### ⚠️ ATENÇÃO: Função RPC Precisa Ser Atualizada

A função `adicionar_curriculo_manual` precisa ser criada ou atualizada no Supabase para aceitar o novo parâmetro `p_cargo`.

### Opção 1: Criar Migration SQL

Criar arquivo: `supabase/migrations/[timestamp]_adicionar_campo_cargo_curriculos.sql`

```sql
-- 1. Adicionar coluna cargo_interesse na tabela banco_curriculos (se não existir)
ALTER TABLE banco_curriculos 
ADD COLUMN IF NOT EXISTS cargo_interesse VARCHAR(255);

-- 2. Criar ou atualizar função RPC adicionar_curriculo_manual
CREATE OR REPLACE FUNCTION adicionar_curriculo_manual(
  p_nome VARCHAR,
  p_email VARCHAR,
  p_telefone VARCHAR,
  p_cargo VARCHAR DEFAULT NULL,           -- ✅ NOVO PARÂMETRO
  p_area_atuacao VARCHAR DEFAULT NULL,
  p_experiencia_anos INTEGER DEFAULT 0,
  p_formacao VARCHAR DEFAULT NULL,
  p_localizacao VARCHAR DEFAULT NULL,
  p_disponibilidade VARCHAR DEFAULT 'disponivel',
  p_avaliacao INTEGER DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_linkedin_url VARCHAR DEFAULT NULL,
  p_portfolio_url VARCHAR DEFAULT NULL,
  p_nome_arquivo VARCHAR DEFAULT NULL,
  p_url_storage VARCHAR DEFAULT NULL,
  p_tamanho_bytes BIGINT DEFAULT 0,
  p_tipo_arquivo VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_candidato_id UUID;
  v_curriculo_id UUID;
BEGIN
  -- 1. Criar ou buscar candidato
  INSERT INTO candidatos (nome, email, telefone, origem)
  VALUES (p_nome, p_email, p_telefone, 'banco_manual')
  ON CONFLICT (email) DO UPDATE 
    SET nome = EXCLUDED.nome, 
        telefone = EXCLUDED.telefone
  RETURNING id INTO v_candidato_id;

  -- 2. Adicionar ao banco de currículos
  INSERT INTO banco_curriculos (
    candidato_id,
    nome_arquivo,
    url_storage,
    tamanho_bytes,
    tipo_arquivo,
    cargo_interesse,              -- ✅ NOVA COLUNA
    area_atuacao,
    experiencia_anos,
    formacao,
    localizacao,
    disponibilidade,
    avaliacao,
    observacoes,
    linkedin_url,
    portfolio_url,
    status,
    favorito
  ) VALUES (
    v_candidato_id,
    p_nome_arquivo,
    p_url_storage,
    p_tamanho_bytes,
    p_tipo_arquivo,
    p_cargo,                      -- ✅ VALOR DO CARGO
    p_area_atuacao,
    p_experiencia_anos,
    p_formacao,
    p_localizacao,
    p_disponibilidade,
    p_avaliacao,
    p_observacoes,
    p_linkedin_url,
    p_portfolio_url,
    'ativo',
    false
  )
  RETURNING id INTO v_curriculo_id;

  -- 3. Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'candidato_id', v_candidato_id,
    'curriculo_id', v_curriculo_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar índice para melhorar buscas por cargo
CREATE INDEX IF NOT EXISTS idx_banco_curriculos_cargo_interesse 
ON banco_curriculos USING GIN (to_tsvector('portuguese', cargo_interesse));

-- 4. Comentários para documentação
COMMENT ON COLUMN banco_curriculos.cargo_interesse IS 
'Cargo específico do candidato (ex: Analista de Marketing Pleno). Alinha com o campo cargo das vagas.';
```

---

## Benefícios da Implementação

### 1. Alinhamento com Vagas
✅ Campo "cargo" agora está consistente entre:
- Banco de currículos espontâneos
- Candidatos de vagas (que já têm cargo da vaga)
- Portal externo (cargo será preenchido automaticamente)

### 2. Buscas Mais Precisas
```sql
-- Buscar por cargo agora funciona
SELECT * FROM banco_curriculos 
WHERE cargo_interesse ILIKE '%analista de marketing%';

-- Buscar combinando cargo e localização
SELECT * FROM banco_curriculos 
WHERE cargo_interesse ILIKE '%desenvolvedor%'
AND localizacao ILIKE '%São Paulo%';
```

### 3. Nomenclatura Específica
- **Antes:** "Área de Atuação: Marketing" (genérico)
- **Agora:** "Cargo: Analista de Marketing Digital Pleno" (específico)

### 4. Facilita Recrutamento Interno
Ao buscar candidatos para uma vaga de "Analista de Vendas", o sistema poderá encontrar:
- CVs espontâneos que informaram esse cargo
- Candidatos que se candidataram a vagas similares no passado

---

## Interface do Usuário

### Formulário Atualizado

O formulário agora exibe:

```
┌─────────────────────────────────────────┐
│ Adicionar Currículo ao Banco            │
├─────────────────────────────────────────┤
│ Informações Básicas                     │
│ • Nome Completo *                       │
│ • Email *                               │
│ • Telefone *                            │
│ • Localização                           │
│                                         │
│ Informações Profissionais               │
│ • Cargo (opcional)                      │ ← ✅ NOVO
│   (Ex: Analista de Marketing Pleno)    │
│ • Área de Atuação * (dropdown)          │
│ • Anos de Experiência                   │
│ • Formação                              │
│ • Disponibilidade                       │
│ • Avaliação (1-5)                       │
│                                         │
│ Links Profissionais                     │
│ • LinkedIn                              │
│ • Portfólio/Website                     │
│                                         │
│ Observações                             │
│ • Observações sobre o candidato         │
│                                         │
│ Currículo                               │
│ • Upload de arquivo (PDF/DOC)           │
│                                         │
│ [Cancelar]  [Adicionar Currículo]       │
└─────────────────────────────────────────┘
```

---

## Status da Implementação

### ✅ Concluído - Frontend
- [x] Interface de dados atualizada
- [x] Estado inicial atualizado
- [x] Formulário JSX com novo campo
- [x] Chamada RPC com novo parâmetro
- [x] Reset de formulário atualizado
- [x] Sem erros de linter
- [x] Sem erros de TypeScript

### ⚠️ Pendente - Backend
- [ ] Criar/atualizar tabela `banco_curriculos` com coluna `cargo_interesse`
- [ ] Criar/atualizar função RPC `adicionar_curriculo_manual`
- [ ] Criar índice para otimizar buscas por cargo
- [ ] Testar inserção com novo campo

---

## Próximos Passos

### 1. Aplicar Migration no Supabase
```bash
# Se usar CLI do Supabase localmente:
supabase migration new adicionar_campo_cargo_curriculos

# Copiar o SQL acima para o arquivo de migration
# Aplicar migration:
supabase db push
```

### 2. Ou Aplicar Diretamente no Dashboard
- Acessar Supabase Dashboard → SQL Editor
- Copiar e executar o SQL fornecido acima

### 3. Testar Funcionalidade
1. Adicionar currículo manualmente
2. Verificar se campo "cargo" é salvo corretamente
3. Testar busca por cargo
4. Validar que campo é opcional (pode ser NULL)

---

## Observações Importantes

### Campo Opcional
O campo "Cargo" é **opcional** no formulário:
- Permite flexibilidade no cadastro
- Analista pode preencher depois se necessário
- Não bloqueia cadastro de currículos legados

### Convivência com "Área de Atuação"
Por enquanto, ambos os campos coexistem:
- `cargo_interesse` (novo, específico)
- `area_atuacao` (existente, genérico)

Futuramente, pode-se avaliar remover `area_atuacao` após migrar dados para `cargo_interesse`.

### Índice para Performance
O índice GIN com `to_tsvector` permite buscas eficientes:
```sql
-- Busca rápida em português
WHERE to_tsvector('portuguese', cargo_interesse) @@ to_tsquery('portuguese', 'analista & marketing');
```

---

## Testes Recomendados

### Teste 1: Adicionar Currículo com Cargo
1. Abrir formulário de adicionar currículo
2. Preencher todos campos incluindo "Cargo"
3. Exemplo: "Analista de Marketing Digital Pleno"
4. Anexar currículo
5. Salvar
6. ✅ Verificar se currículo foi criado com cargo

### Teste 2: Adicionar Currículo sem Cargo
1. Abrir formulário
2. Preencher campos obrigatórios
3. **Não** preencher campo "Cargo"
4. Salvar
5. ✅ Verificar se permite salvar (campo opcional)

### Teste 3: Buscar por Cargo
1. Adicionar alguns currículos com cargos variados
2. Buscar por: "Analista"
3. ✅ Deve retornar todos com "Analista" no cargo

---

## Conclusão

O campo "Cargo" foi adicionado com sucesso ao formulário de cadastro manual de currículos. A implementação está completa no frontend e aguarda apenas a aplicação da migration no backend para funcionar completamente.

Esta adição é o primeiro passo para padronizar a nomenclatura de cargos em todo o sistema, facilitando buscas futuras e alinhando com a estrutura de vagas.

---

**Documento gerado em:** 26/11/2025  
**Status:** ✅ Frontend completo | ⚠️ Backend pendente  
**Versão:** 1.0

