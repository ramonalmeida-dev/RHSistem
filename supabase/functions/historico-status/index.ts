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

    // GET - Listar histórico de um candidato
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const candidato_vaga_id = url.searchParams.get('candidato_vaga_id');

      if (!candidato_vaga_id) {
        return createErrorResponse('candidato_vaga_id é obrigatório', 'MISSING_PARAMS');
      }

      let query = supabase
        .from('historico_status')
        .select(`
          *,
          candidato_vaga:candidatos_vagas(
            candidato:candidatos(nome, email),
            vaga:vagas(numero_vaga, cargo, consultor_id)
          ),
          usuario:usuarios(nome, email)
        `)
        .eq('candidato_vaga_id', candidato_vaga_id)
        .order('created_at', { ascending: false });

      const { data: historico, error } = await query;

      if (error) {
        throw error;
      }

      // Verificar permissões (consultor só pode ver histórico de suas vagas)
      if (!auth.isAdmin) {
        const historicoAutorizado = historico.filter(h => 
          h.candidato_vaga.vaga.consultor_id === auth.userId
        );
        return createSuccessResponse(historicoAutorizado);
      }

      return createSuccessResponse(historico);
    }

    // POST - Adicionar entrada no histórico
    if (req.method === 'POST') {
      const { candidato_vaga_id, status_anterior, status_novo, comentario } = await req.json();

      if (!candidato_vaga_id || !status_novo) {
        return createErrorResponse('candidato_vaga_id e status_novo são obrigatórios', 'MISSING_FIELDS');
      }

      // Verificar se candidato_vaga existe
      const { data: candidatoVaga } = await supabase
        .from('candidatos_vagas')
        .select(`
          *,
          vaga:vagas(consultor_id)
        `)
        .eq('id', candidato_vaga_id)
        .single();

      if (!candidatoVaga) {
        return createErrorResponse('Relacionamento candidato-vaga não encontrado', 'CANDIDATO_VAGA_NOT_FOUND', 404);
      }

      // Verificar permissões (consultor só pode adicionar histórico de suas vagas)
      if (!auth.isAdmin && candidatoVaga.vaga.consultor_id !== auth.userId) {
        return createErrorResponse('Você só pode adicionar histórico de suas vagas', 'FORBIDDEN', 403);
      }

      const { data: newHistorico, error } = await supabase
        .from('historico_status')
        .insert({
          candidato_vaga_id,
          status_anterior,
          status_novo,
          usuario_id: auth.userId,
          comentario
        })
        .select(`
          *,
          candidato_vaga:candidatos_vagas(
            candidato:candidatos(nome, email),
            vaga:vagas(numero_vaga, cargo)
          ),
          usuario:usuarios(nome, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse(newHistorico, 201);
    }

    return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', 405);

  } catch (error) {
    console.error('Erro na API de histórico-status:', error);
    return createErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR', 500);
  }
}); 