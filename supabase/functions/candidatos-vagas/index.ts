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

    // GET - Listar candidatos de uma vaga
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const vaga_id = url.searchParams.get('vaga_id');
      const candidato_id = url.searchParams.get('candidato_id');
      const status = url.searchParams.get('status');

      if (!vaga_id && !candidato_id) {
        return createErrorResponse('vaga_id ou candidato_id é obrigatório', 'MISSING_PARAMS');
      }

      let query = supabase
        .from('candidatos_vagas')
        .select(`
          *,
          candidato:candidatos(nome, email, telefone),
          vaga:vagas(numero_vaga, cargo, empresa:clientes(razao_social))
        `)
        .order('created_at', { ascending: false });

      if (vaga_id) {
        query = query.eq('vaga_id', vaga_id);
      }

      if (candidato_id) {
        query = query.eq('candidato_id', candidato_id);
      }

      if (status) {
        query = query.eq('status_atual', status);
      }

      const { data: candidatosVagas, error } = await query;

      if (error) {
        throw error;
      }

      // Verificar permissões (consultor só pode ver candidatos de suas vagas)
      if (!auth.isAdmin) {
        const { data: vagasConsultor } = await supabase
          .from('vagas')
          .select('id')
          .eq('consultor_id', auth.userId);

        if (vagasConsultor && vagasConsultor.length > 0) {
          const vagaIds = vagasConsultor.map(v => v.id);
          const candidatosAutorizados = candidatosVagas.filter(cv => vagaIds.includes(cv.vaga_id));
          return createSuccessResponse(candidatosAutorizados);
        } else {
          return createSuccessResponse([]);
        }
      }

      return createSuccessResponse(candidatosVagas);
    }

    // POST - Adicionar candidato a uma vaga
    if (req.method === 'POST') {
      const { candidato_id, vaga_id, status_atual, observacoes, avaliacao } = await req.json();

      if (!candidato_id || !vaga_id) {
        return createErrorResponse('candidato_id e vaga_id são obrigatórios', 'MISSING_FIELDS');
      }

      // Verificar se candidato existe
      const { data: candidato } = await supabase
        .from('candidatos')
        .select('id')
        .eq('id', candidato_id)
        .is('deleted_at', null)
        .single();

      if (!candidato) {
        return createErrorResponse('Candidato não encontrado', 'CANDIDATO_NOT_FOUND', 404);
      }

      // Verificar se vaga existe
      const { data: vaga } = await supabase
        .from('vagas')
        .select('id, consultor_id')
        .eq('id', vaga_id)
        .single();

      if (!vaga) {
        return createErrorResponse('Vaga não encontrada', 'VAGA_NOT_FOUND', 404);
      }

      // Verificar permissões (consultor só pode adicionar candidatos às suas vagas)
      if (!auth.isAdmin && vaga.consultor_id !== auth.userId) {
        return createErrorResponse('Você só pode adicionar candidatos às suas vagas', 'FORBIDDEN', 403);
      }

      // Verificar se candidato já está na vaga
      const { data: existingCandidatoVaga } = await supabase
        .from('candidatos_vagas')
        .select('id')
        .eq('candidato_id', candidato_id)
        .eq('vaga_id', vaga_id)
        .single();

      if (existingCandidatoVaga) {
        return createErrorResponse('Candidato já está candidatado para esta vaga', 'CANDIDATO_EXISTS', 409);
      }

      // Validar avaliação se fornecida
      if (avaliacao && (avaliacao < 1 || avaliacao > 5)) {
        return createErrorResponse('Avaliação deve ser entre 1 e 5', 'INVALID_AVALIACAO');
      }

      const { data: newCandidatoVaga, error } = await supabase
        .from('candidatos_vagas')
        .insert({
          candidato_id,
          vaga_id,
          status_atual: status_atual ?? 'selecionando',
          observacoes,
          avaliacao
        })
        .select(`
          *,
          candidato:candidatos(nome, email, telefone),
          vaga:vagas(numero_vaga, cargo, empresa:clientes(razao_social))
        `)
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(newCandidatoVaga, 201);
    }

    // PUT - Atualizar status do candidato
    if (req.method === 'PUT') {
      const { id, status_atual, observacoes, avaliacao } = await req.json();

      if (!id) {
        return createErrorResponse('ID do relacionamento candidato-vaga é obrigatório', 'MISSING_ID');
      }

      // Buscar relacionamento atual
      const { data: currentCandidatoVaga } = await supabase
        .from('candidatos_vagas')
        .select(`
          *,
          vaga:vagas(consultor_id)
        `)
        .eq('id', id)
        .single();

      if (!currentCandidatoVaga) {
        return createErrorResponse('Relacionamento candidato-vaga não encontrado', 'NOT_FOUND', 404);
      }

      // Verificar permissões (consultor só pode editar candidatos de suas vagas)
      if (!auth.isAdmin && currentCandidatoVaga.vaga.consultor_id !== auth.userId) {
        return createErrorResponse('Você só pode editar candidatos de suas vagas', 'FORBIDDEN', 403);
      }

      // Validar avaliação se fornecida
      if (avaliacao && (avaliacao < 1 || avaliacao > 5)) {
        return createErrorResponse('Avaliação deve ser entre 1 e 5', 'INVALID_AVALIACAO');
      }

      const updateData: any = {};
      if (status_atual !== undefined) updateData.status_atual = status_atual;
      if (observacoes !== undefined) updateData.observacoes = observacoes;
      if (avaliacao !== undefined) updateData.avaliacao = avaliacao;

      const { data: updatedCandidatoVaga, error } = await supabase
        .from('candidatos_vagas')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          candidato:candidatos(nome, email, telefone),
          vaga:vagas(numero_vaga, cargo, empresa:clientes(razao_social))
        `)
        .single();

      if (error) {
        throw error;
      }

      // Se houve mudança de status, criar entrada no histórico
      if (status_atual && status_atual !== currentCandidatoVaga.status_atual) {
        await supabase
          .from('historico_status')
          .insert({
            candidato_vaga_id: id,
            status_anterior: currentCandidatoVaga.status_atual,
            status_novo: status_atual,
            usuario_id: auth.userId,
            comentario: observacoes
          });
      }

      return createSuccessResponse(updatedCandidatoVaga);
    }

    // DELETE - Remover candidato de uma vaga
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return createErrorResponse('ID do relacionamento candidato-vaga é obrigatório', 'MISSING_ID');
      }

      // Buscar relacionamento para verificar permissões
      const { data: candidatoVaga } = await supabase
        .from('candidatos_vagas')
        .select(`
          *,
          vaga:vagas(consultor_id)
        `)
        .eq('id', id)
        .single();

      if (!candidatoVaga) {
        return createErrorResponse('Relacionamento candidato-vaga não encontrado', 'NOT_FOUND', 404);
      }

      // Verificar permissões (consultor só pode remover candidatos de suas vagas)
      if (!auth.isAdmin && candidatoVaga.vaga.consultor_id !== auth.userId) {
        return createErrorResponse('Você só pode remover candidatos de suas vagas', 'FORBIDDEN', 403);
      }

      const { error } = await supabase
        .from('candidatos_vagas')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return createSuccessResponse({ message: 'Candidato removido da vaga com sucesso' });
    }

    return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', 405);

  } catch (error) {
    console.error('Erro na API de candidatos-vagas:', error);
    return createErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR', 500);
  }
}); 