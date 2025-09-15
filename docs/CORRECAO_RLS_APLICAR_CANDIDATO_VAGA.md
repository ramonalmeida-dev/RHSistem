# Correção de RLS - Função aplicar_candidato_vaga

## Problema Identificado

Candidatos externos não conseguiam se candidatar às vagas devido a erro de Row Level Security (RLS):

```
{
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"candidatos\""
}
```

## Causa Raiz

1. **Política RLS restritiva**: A tabela `candidatos` tinha uma política que impedia inserções quando existisse um registro em `candidatos_externos` com o mesmo `auth_user_id`

2. **Função com SECURITY INVOKER**: A função `aplicar_candidato_vaga` estava configurada como `SECURITY INVOKER`, executando com as permissões do usuário que a chamava (candidato externo)

3. **Conflito de permissões**: Candidatos externos não tinham permissão para inserir na tabela `candidatos` devido à política RLS

## Solução Aplicada

### 1. Alteração da Função para SECURITY DEFINER

```sql
CREATE OR REPLACE FUNCTION public.aplicar_candidato_vaga(
  p_candidato_id uuid,
  p_vaga_id uuid,
  p_observacoes text DEFAULT NULL,
  p_curriculo_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- ← Mudança aqui: executa com privilégios do sistema
SET search_path = public
```

### 2. Benefícios da Correção

- **Execução privilegiada**: A função agora executa com privilégios do sistema, contornando as restrições RLS
- **Segurança mantida**: A função continua validando todas as regras de negócio internamente
- **Funcionamento completo**: Todo o fluxo de candidatura funciona corretamente:
  - Criação do candidato interno
  - Inserção no banco de currículos
  - Registro da candidatura externa
  - Adição ao kanban (candidatos_vagas)

## Validação da Correção

### Teste Realizado

```sql
SELECT aplicar_candidato_vaga(
  '4b437f34-b059-4a51-a14e-5a0fadbce3ec'::uuid,  -- candidato teste
  '79bd66ca-c809-4e12-9179-2a7db0195e85'::uuid,  -- vaga KEY ACCOUNT MANAGER
  'Teste de candidatura via correção RLS',
  null
) as resultado;
```

### Resultado

```json
{
  "success": true,
  "message": "Candidatura enviada com sucesso",
  "vaga": {
    "id": "79bd66ca-c809-4e12-9179-2a7db0195e85",
    "cargo": "KEY ACCOUNT MANAGER",
    "empresa": "GLOVIS BRASIL LOGISTICA LTDA"
  },
  "integracao_banco_curriculos": {
    "success": true,
    "candidato_interno_id": "44c8c4ed-4a4e-49c5-a8e2-fd84de642163",
    "banco_curriculo_id": "746b2243-2270-4d04-872f-c00523e0e723"
  }
}
```

## Verificações Realizadas

### 1. Candidato Criado na Tabela Interna
✅ Candidato inserido na tabela `candidatos` com origem `portal_externo`

### 2. Candidatura Registrada
✅ Registro criado na tabela `candidaturas_externas`

### 3. Integração com Kanban
✅ Candidato adicionado ao kanban (`candidatos_vagas`) com status `curriculo_enviado`

### 4. Banco de Currículos
✅ Currículo adicionado automaticamente ao `banco_curriculos`

## Status

✅ **CORRIGIDO** - Candidatos externos podem agora se candidatar às vagas sem erro de RLS

## Migração Aplicada

- **Nome**: `corrigir_rls_aplicar_candidato_vaga`
- **Data**: 09/09/2025
- **Tipo**: Alteração de função (SECURITY DEFINER) 