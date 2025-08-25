import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para criar resposta de erro padronizada
function createErrorResponse(message, code, status = 400) {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code
      }
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Função para criar resposta de sucesso padronizada
function createSuccessResponse(data, status = 200) {
  return new Response(
    JSON.stringify({ data }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verificar autenticação usando Auth nativo do Supabase
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Token de autenticação necessário', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createErrorResponse('Token inválido', 'INVALID_TOKEN', 401);
    }

    // GET - Listar clientes
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      const search = url.searchParams.get('search');
      const ativo = url.searchParams.get('ativo');

      let query = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (id) {
        query = query.eq('id', id);
      }

      if (search) {
        // Remover máscaras do termo de busca
        const searchClean = search.replace(/[^\w\s]/g, '');
        
        // Busca abrangente em múltiplos campos
        query = query.or(`razao_social.ilike.%${search}%,razao_social.ilike.%${searchClean}%,nome_fantasia.ilike.%${search}%,nome_fantasia.ilike.%${searchClean}%,cnpj.ilike.%${search}%,cnpj.ilike.%${searchClean}%,email.ilike.%${search}%,contato.ilike.%${search}%,contato.ilike.%${searchClean}%,celular.ilike.%${search}%,celular.ilike.%${searchClean}%,cidade.ilike.%${search}%,estado.ilike.%${search}%`);
      }

      if (ativo !== null) {
        query = query.eq('ativo', ativo === 'true');
      }

      const { data: clientes, error } = await query;

      if (error) {
        throw error;
      }

      if (id) {
        return createSuccessResponse(clientes[0] || null);
      }

      return createSuccessResponse(clientes);
    }

    // POST - Criar cliente
    if (req.method === 'POST') {
      const { 
        razao_social, 
        nome_fantasia,
        cnpj, 
        inscricao_estadual, 
        endereco_completo, 
        prazo_pagamento, 
        contato, 
        celular, 
        email, 
        // Novos campos de endereço
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        ativo 
      } = await req.json();

      if (!razao_social || !cnpj) {
        return createErrorResponse('Razão social e CNPJ são obrigatórios', 'MISSING_FIELDS');
      }

      // Validar formato do CNPJ (básico)
      const cnpjClean = cnpj.replace(/[^\d]/g, '');
      if (cnpjClean.length !== 14) {
        return createErrorResponse('CNPJ deve ter 14 dígitos', 'INVALID_CNPJ');
      }

      // Verificar se CNPJ já existe
      const { data: existingCliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('cnpj', cnpj)
        .single();

      if (existingCliente) {
        return createErrorResponse('CNPJ já cadastrado', 'CNPJ_EXISTS', 409);
      }

      const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert({
          razao_social,
          nome_fantasia,
          cnpj,
          inscricao_estadual,
          endereco_completo,
          prazo_pagamento,
          contato,
          celular,
          email,
          // Novos campos de endereço
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          ativo: ativo ?? true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(newCliente, 201);
    }

    // PUT - Atualizar cliente
    if (req.method === 'PUT') {
      const { 
        id, 
        razao_social, 
        nome_fantasia,
        cnpj, 
        inscricao_estadual, 
        endereco_completo, 
        prazo_pagamento, 
        contato, 
        celular, 
        email, 
        // Novos campos de endereço
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        ativo 
      } = await req.json();

      if (!id) {
        return createErrorResponse('ID do cliente é obrigatório', 'MISSING_ID');
      }

      // Se estiver alterando CNPJ, verificar se já existe
      if (cnpj) {
        const cnpjClean = cnpj.replace(/[^\d]/g, '');
        if (cnpjClean.length !== 14) {
          return createErrorResponse('CNPJ deve ter 14 dígitos', 'INVALID_CNPJ');
        }

        const { data: existingCliente } = await supabase
          .from('clientes')
          .select('id')
          .eq('cnpj', cnpj)
          .neq('id', id)
          .single();

        if (existingCliente) {
          return createErrorResponse('CNPJ já cadastrado', 'CNPJ_EXISTS', 409);
        }
      }

      const updateData = {};
      if (razao_social !== undefined) updateData.razao_social = razao_social;
      if (nome_fantasia !== undefined) updateData.nome_fantasia = nome_fantasia;
      if (cnpj !== undefined) updateData.cnpj = cnpj;
      if (inscricao_estadual !== undefined) updateData.inscricao_estadual = inscricao_estadual;
      if (endereco_completo !== undefined) updateData.endereco_completo = endereco_completo;
      if (prazo_pagamento !== undefined) updateData.prazo_pagamento = prazo_pagamento;
      if (contato !== undefined) updateData.contato = contato;
      if (celular !== undefined) updateData.celular = celular;
      if (email !== undefined) updateData.email = email;
      // Novos campos de endereço
      if (cep !== undefined) updateData.cep = cep;
      if (logradouro !== undefined) updateData.logradouro = logradouro;
      if (numero !== undefined) updateData.numero = numero;
      if (complemento !== undefined) updateData.complemento = complemento;
      if (bairro !== undefined) updateData.bairro = bairro;
      if (cidade !== undefined) updateData.cidade = cidade;
      if (estado !== undefined) updateData.estado = estado;
      if (ativo !== undefined) updateData.ativo = ativo;

      const { data: updatedCliente, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('Cliente não encontrado', 'NOT_FOUND', 404);
        }
        throw error;
      }

      return createSuccessResponse(updatedCliente);
    }

    // DELETE - Deletar cliente
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return createErrorResponse('ID do cliente é obrigatório', 'MISSING_ID');
      }

      // Verificar se cliente tem vagas associadas
      const { data: vagas } = await supabase
        .from('vagas')
        .select('id')
        .eq('empresa_id', id);

      if (vagas && vagas.length > 0) {
        return createErrorResponse(
          'Não é possível deletar cliente com vagas associadas', 
          'CLIENTE_HAS_VAGAS', 
          400
        );
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('Cliente não encontrado', 'NOT_FOUND', 404);
        }
        throw error;
      }

      return createSuccessResponse({ message: 'Cliente deletado com sucesso' });
    }

    return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', 405);

  } catch (error) {
    console.error('Erro na API de clientes:', error);
    return createErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR', 500);
  }
}); 