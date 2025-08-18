import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createErrorResponse, createSuccessResponse, authenticateRequest } from '../utils/auth.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verificar autenticação
    const auth = await authenticateRequest(req);
    if (!auth) {
      return createErrorResponse('Token de autenticação necessário', 'UNAUTHORIZED', 401);
    }

    // GET - Listar vagas
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      const consultor_id = url.searchParams.get('consultor_id');
      const empresa_id = url.searchParams.get('empresa_id');
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');

      let query = supabase
        .from('vagas')
        .select(`
          *,
          empresa:clientes(razao_social, cnpj),
          consultor:usuarios(nome, email)
        `)
        .order('created_at', { ascending: false });

      if (id) {
        query = query.eq('id', id);
      }

      // Filtros baseados em permissões
      if (!auth.isAdmin && consultor_id) {
        query = query.eq('consultor_id', auth.userId);
      } else if (consultor_id) {
        query = query.eq('consultor_id', consultor_id);
      }

      if (empresa_id) {
        query = query.eq('empresa_id', empresa_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`numero_vaga.ilike.%${search}%,cargo.ilike.%${search}%`);
      }

      const { data: vagas, error } = await query;

      if (error) {
        throw error;
      }

      if (id) {
        return createSuccessResponse(vagas[0] || null);
      }

      return createSuccessResponse(vagas);
    }

    // POST - Criar vaga
    if (req.method === 'POST') {
      const { 
        numero_vaga,
        empresa_id,
        contato_envio_cv,
        email,
        celular,
        cargo,
        salario,
        local_trabalho,
        data_recebimento,
        data_formatacao_perfil,
        data_divulgacao,
        data_inicio_selecao,
        data_envio_curriculos,
        data_encerramento,
        perfil_word,
        informacoes_complementares,
        questionario_tecnico,
        observacoes,
        consultor_id,
        status
      } = await req.json();

      if (!numero_vaga || !empresa_id || !cargo || !consultor_id) {
        return createErrorResponse('Número da vaga, empresa, cargo e consultor são obrigatórios', 'MISSING_FIELDS');
      }

      // Verificar se número da vaga já existe
      const { data: existingVaga } = await supabase
        .from('vagas')
        .select('id')
        .eq('numero_vaga', numero_vaga)
        .single();

      if (existingVaga) {
        return createErrorResponse('Número da vaga já existe', 'VAGA_EXISTS', 409);
      }

      // Verificar se empresa existe
      const { data: empresa } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', empresa_id)
        .single();

      if (!empresa) {
        return createErrorResponse('Empresa não encontrada', 'EMPRESA_NOT_FOUND', 404);
      }

      // Verificar se consultor existe
      const { data: consultor } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', consultor_id)
        .single();

      if (!consultor) {
        return createErrorResponse('Consultor não encontrado', 'CONSULTOR_NOT_FOUND', 404);
      }

      // Verificar permissões (consultor só pode criar vagas para si mesmo)
      if (!auth.isAdmin && consultor_id !== auth.userId) {
        return createErrorResponse('Você só pode criar vagas para si mesmo', 'FORBIDDEN', 403);
      }

      const { data: newVaga, error } = await supabase
        .from('vagas')
        .insert({
          numero_vaga,
          empresa_id,
          contato_envio_cv,
          email,
          celular,
          cargo,
          salario,
          local_trabalho,
          data_recebimento,
          data_formatacao_perfil,
          data_divulgacao,
          data_inicio_selecao,
          data_envio_curriculos,
          data_encerramento,
          perfil_word,
          informacoes_complementares,
          questionario_tecnico,
          observacoes,
          consultor_id,
          status: status ?? 'ativa'
        })
        .select(`
          *,
          empresa:clientes(razao_social, cnpj),
          consultor:usuarios(nome, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(newVaga, 201);
    }

    // PUT - Atualizar vaga
    if (req.method === 'PUT') {
      const { 
        id,
        numero_vaga,
        empresa_id,
        contato_envio_cv,
        email,
        celular,
        cargo,
        salario,
        local_trabalho,
        data_recebimento,
        data_formatacao_perfil,
        data_divulgacao,
        data_inicio_selecao,
        data_envio_curriculos,
        data_encerramento,
        perfil_word,
        informacoes_complementares,
        questionario_tecnico,
        observacoes,
        consultor_id,
        status
      } = await req.json();

      if (!id) {
        return createErrorResponse('ID da vaga é obrigatório', 'MISSING_ID');
      }

      // Buscar vaga atual para verificar permissões
      const { data: currentVaga } = await supabase
        .from('vagas')
        .select('consultor_id')
        .eq('id', id)
        .single();

      if (!currentVaga) {
        return createErrorResponse('Vaga não encontrada', 'NOT_FOUND', 404);
      }

      // Verificar permissões (consultor só pode editar suas vagas)
      if (!auth.isAdmin && currentVaga.consultor_id !== auth.userId) {
        return createErrorResponse('Você só pode editar suas vagas', 'FORBIDDEN', 403);
      }

      // Se estiver alterando número da vaga, verificar se já existe
      if (numero_vaga) {
        const { data: existingVaga } = await supabase
          .from('vagas')
          .select('id')
          .eq('numero_vaga', numero_vaga)
          .neq('id', id)
          .single();

        if (existingVaga) {
          return createErrorResponse('Número da vaga já existe', 'VAGA_EXISTS', 409);
        }
      }

      // Se estiver alterando empresa, verificar se existe
      if (empresa_id) {
        const { data: empresa } = await supabase
          .from('clientes')
          .select('id')
          .eq('id', empresa_id)
          .single();

        if (!empresa) {
          return createErrorResponse('Empresa não encontrada', 'EMPRESA_NOT_FOUND', 404);
        }
      }

      // Se estiver alterando consultor, verificar se existe
      if (consultor_id) {
        const { data: consultor } = await supabase
          .from('usuarios')
          .select('id')
          .eq('id', consultor_id)
          .single();

        if (!consultor) {
          return createErrorResponse('Consultor não encontrado', 'CONSULTOR_NOT_FOUND', 404);
        }
      }

      const updateData: any = {};
      if (numero_vaga !== undefined) updateData.numero_vaga = numero_vaga;
      if (empresa_id !== undefined) updateData.empresa_id = empresa_id;
      if (contato_envio_cv !== undefined) updateData.contato_envio_cv = contato_envio_cv;
      if (email !== undefined) updateData.email = email;
      if (celular !== undefined) updateData.celular = celular;
      if (cargo !== undefined) updateData.cargo = cargo;
      if (salario !== undefined) updateData.salario = salario;
      if (local_trabalho !== undefined) updateData.local_trabalho = local_trabalho;
      if (data_recebimento !== undefined) updateData.data_recebimento = data_recebimento;
      if (data_formatacao_perfil !== undefined) updateData.data_formatacao_perfil = data_formatacao_perfil;
      if (data_divulgacao !== undefined) updateData.data_divulgacao = data_divulgacao;
      if (data_inicio_selecao !== undefined) updateData.data_inicio_selecao = data_inicio_selecao;
      if (data_envio_curriculos !== undefined) updateData.data_envio_curriculos = data_envio_curriculos;
      if (data_encerramento !== undefined) updateData.data_encerramento = data_encerramento;
      if (perfil_word !== undefined) updateData.perfil_word = perfil_word;
      if (informacoes_complementares !== undefined) updateData.informacoes_complementares = informacoes_complementares;
      if (questionario_tecnico !== undefined) updateData.questionario_tecnico = questionario_tecnico;
      if (observacoes !== undefined) updateData.observacoes = observacoes;
      if (consultor_id !== undefined) updateData.consultor_id = consultor_id;
      if (status !== undefined) updateData.status = status;

      const { data: updatedVaga, error } = await supabase
        .from('vagas')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          empresa:clientes(razao_social, cnpj),
          consultor:usuarios(nome, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(updatedVaga);
    }

    // DELETE - Deletar vaga
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return createErrorResponse('ID da vaga é obrigatório', 'MISSING_ID');
      }

      // Buscar vaga para verificar permissões
      const { data: vaga } = await supabase
        .from('vagas')
        .select('consultor_id')
        .eq('id', id)
        .single();

      if (!vaga) {
        return createErrorResponse('Vaga não encontrada', 'NOT_FOUND', 404);
      }

      // Verificar permissões (consultor só pode deletar suas vagas)
      if (!auth.isAdmin && vaga.consultor_id !== auth.userId) {
        return createErrorResponse('Você só pode deletar suas vagas', 'FORBIDDEN', 403);
      }

      // Verificar se vaga tem candidatos associados
      const { data: candidatos } = await supabase
        .from('candidatos_vagas')
        .select('id')
        .eq('vaga_id', id);

      if (candidatos && candidatos.length > 0) {
        return createErrorResponse(
          'Não é possível deletar vaga com candidatos associados', 
          'VAGA_HAS_CANDIDATOS', 
          400
        );
      }

      const { error } = await supabase
        .from('vagas')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return createSuccessResponse({ message: 'Vaga deletada com sucesso' });
    }

    return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', 405);

  } catch (error) {
    console.error('Erro na API de vagas:', error);
    return createErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR', 500);
  }
}); 