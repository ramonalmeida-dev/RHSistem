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

    // GET - Listar candidatos
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      const vaga_id = url.searchParams.get('vaga_id');
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');

      let query = supabase
        .from('candidatos')
        .select('*')
        .is('deleted_at', null) // Soft delete - só mostrar não deletados
        .order('created_at', { ascending: false });

      if (id) {
        query = query.eq('id', id);
      }

      if (search) {
        query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: candidatos, error } = await query;

      if (error) {
        throw error;
      }

      // Se não for admin, filtrar apenas candidatos das vagas do consultor
      if (!auth.isAdmin) {
        const { data: vagasConsultor } = await supabase
          .from('vagas')
          .select('id')
          .eq('consultor_id', auth.userId);

        if (vagasConsultor && vagasConsultor.length > 0) {
          const vagaIds = vagasConsultor.map(v => v.id);
          const { data: candidatosVagas } = await supabase
            .from('candidatos_vagas')
            .select('candidato_id')
            .in('vaga_id', vagaIds);

          if (candidatosVagas && candidatosVagas.length > 0) {
            const candidatoIds = candidatosVagas.map(cv => cv.candidato_id);
            const candidatosFiltrados = candidatos.filter(c => candidatoIds.includes(c.id));
            
            if (id) {
              return createSuccessResponse(candidatosFiltrados[0] || null);
            }
            return createSuccessResponse(candidatosFiltrados);
          } else {
            return createSuccessResponse([]);
          }
        } else {
          return createSuccessResponse([]);
        }
      }

      if (id) {
        return createSuccessResponse(candidatos[0] || null);
      }

      return createSuccessResponse(candidatos);
    }

    // POST - Criar candidato
    if (req.method === 'POST') {
      const { nome, email, telefone } = await req.json();

      if (!nome) {
        return createErrorResponse('Nome é obrigatório', 'MISSING_FIELDS');
      }

      // Validar email se fornecido
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return createErrorResponse('Email inválido', 'INVALID_EMAIL');
      }

      const { data: newCandidato, error } = await supabase
        .from('candidatos')
        .insert({
          nome,
          email,
          telefone
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(newCandidato, 201);
    }

    // PUT - Atualizar candidato
    if (req.method === 'PUT') {
      const { id, nome, email, telefone } = await req.json();

      if (!id) {
        return createErrorResponse('ID do candidato é obrigatório', 'MISSING_ID');
      }

      // Verificar permissões (consultor só pode editar candidatos de suas vagas)
      if (!auth.isAdmin) {
        const { data: candidatosVagas } = await supabase
          .from('candidatos_vagas')
          .select('candidato_id')
          .eq('candidato_id', id);

        if (!candidatosVagas || candidatosVagas.length === 0) {
          return createErrorResponse('Candidato não encontrado', 'NOT_FOUND', 404);
        }

        // Verificar se alguma das vagas pertence ao consultor
        const candidatoVagaIds = candidatosVagas.map(cv => cv.candidato_id);
        const { data: vagasConsultor } = await supabase
          .from('vagas')
          .select('id')
          .eq('consultor_id', auth.userId);

        if (!vagasConsultor || vagasConsultor.length === 0) {
          return createErrorResponse('Acesso negado', 'FORBIDDEN', 403);
        }

        const vagaIdsConsultor = vagasConsultor.map(v => v.id);
        const { data: candidatosAutorizados } = await supabase
          .from('candidatos_vagas')
          .select('candidato_id')
          .eq('candidato_id', id)
          .in('vaga_id', vagaIdsConsultor);

        if (!candidatosAutorizados || candidatosAutorizados.length === 0) {
          return createErrorResponse('Você só pode editar candidatos de suas vagas', 'FORBIDDEN', 403);
        }
      }

      // Validar email se fornecido
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return createErrorResponse('Email inválido', 'INVALID_EMAIL');
      }

      const updateData: any = {};
      if (nome !== undefined) updateData.nome = nome;
      if (email !== undefined) updateData.email = email;
      if (telefone !== undefined) updateData.telefone = telefone;

      const { data: updatedCandidato, error } = await supabase
        .from('candidatos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('Candidato não encontrado', 'NOT_FOUND', 404);
        }
        throw error;
      }

      return createSuccessResponse(updatedCandidato);
    }

    // DELETE - Soft delete candidato
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return createErrorResponse('ID do candidato é obrigatório', 'MISSING_ID');
      }

      // Verificar permissões (consultor só pode deletar candidatos de suas vagas)
      if (!auth.isAdmin) {
        const { data: candidatosVagas } = await supabase
          .from('candidatos_vagas')
          .select('candidato_id')
          .eq('candidato_id', id);

        if (!candidatosVagas || candidatosVagas.length === 0) {
          return createErrorResponse('Candidato não encontrado', 'NOT_FOUND', 404);
        }

        // Verificar se alguma das vagas pertence ao consultor
        const candidatoVagaIds = candidatosVagas.map(cv => cv.candidato_id);
        const { data: vagasConsultor } = await supabase
          .from('vagas')
          .select('id')
          .eq('consultor_id', auth.userId);

        if (!vagasConsultor || vagasConsultor.length === 0) {
          return createErrorResponse('Acesso negado', 'FORBIDDEN', 403);
        }

        const vagaIdsConsultor = vagasConsultor.map(v => v.id);
        const { data: candidatosAutorizados } = await supabase
          .from('candidatos_vagas')
          .select('candidato_id')
          .eq('candidato_id', id)
          .in('vaga_id', vagaIdsConsultor);

        if (!candidatosAutorizados || candidatosAutorizados.length === 0) {
          return createErrorResponse('Você só pode deletar candidatos de suas vagas', 'FORBIDDEN', 403);
        }
      }

      // Soft delete - marcar como deletado
      const { error } = await supabase
        .from('candidatos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('Candidato não encontrado', 'NOT_FOUND', 404);
        }
        throw error;
      }

      return createSuccessResponse({ message: 'Candidato deletado com sucesso' });
    }

    return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', 405);

  } catch (error) {
    console.error('Erro na API de candidatos:', error);
    return createErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR', 500);
  }
}); 