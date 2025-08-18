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

    // GET - Estatísticas
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const tipo = url.searchParams.get('tipo'); // 'vagas' ou 'candidatos'

      if (tipo === 'vagas') {
        return await getVagasStats(supabase, auth);
      } else if (tipo === 'candidatos') {
        return await getCandidatosStats(supabase, auth);
      } else {
        return createErrorResponse('Tipo de estatística inválido. Use "vagas" ou "candidatos"', 'INVALID_TYPE');
      }
    }

    return createErrorResponse('Método não permitido', 'METHOD_NOT_ALLOWED', 405);

  } catch (error) {
    console.error('Erro na API de estatísticas:', error);
    return createErrorResponse('Erro interno do servidor', 'INTERNAL_ERROR', 500);
  }
});

// Função para estatísticas de vagas
async function getVagasStats(supabase: any, auth: any) {
  let vagasQuery = supabase
    .from('vagas')
    .select('id, status, consultor_id');

  // Se não for admin, filtrar apenas vagas do consultor
  if (!auth.isAdmin) {
    vagasQuery = vagasQuery.eq('consultor_id', auth.userId);
  }

  const { data: vagas, error } = await vagasQuery;

  if (error) {
    throw error;
  }

  // Calcular estatísticas
  const total = vagas.length;
  const ativas = vagas.filter(v => v.status === 'ativa').length;
  const pausadas = vagas.filter(v => v.status === 'pausada').length;
  const fechadas = vagas.filter(v => v.status === 'fechada').length;

  // Estatísticas por consultor (apenas para admin)
  let porConsultor = [];
  if (auth.isAdmin) {
    const { data: consultores } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('tipo', 'consultor')
      .eq('ativo', true);

    if (consultores) {
      porConsultor = consultores.map(consultor => {
        const vagasConsultor = vagas.filter(v => v.consultor_id === consultant.id);
        return {
          consultor_id: consultant.id,
          consultor_nome: consultant.nome,
          total: vagasConsultor.length,
          ativas: vagasConsultor.filter(v => v.status === 'ativa').length
        };
      });
    }
  } else {
    // Para consultor, mostrar apenas suas estatísticas
    porConsultor = [{
      consultor_id: auth.userId,
      consultor_nome: 'Você',
      total: total,
      ativas: ativas
    }];
  }

  return createSuccessResponse({
    total,
    ativas,
    pausadas,
    fechadas,
    por_consultor: porConsultor
  });
}

// Função para estatísticas de candidatos
async function getCandidatosStats(supabase: any, auth: any) {
  // Buscar candidatos_vagas com relacionamentos
  let candidatosVagasQuery = supabase
    .from('candidatos_vagas')
    .select(`
      status_atual,
      vaga_id,
      vaga:vagas(numero_vaga, consultor_id)
    `);

  // Se não for admin, filtrar apenas candidatos das vagas do consultor
  if (!auth.isAdmin) {
    const { data: vagasConsultor } = await supabase
      .from('vagas')
      .select('id')
      .eq('consultor_id', auth.userId);

    if (vagasConsultor && vagasConsultor.length > 0) {
      const vagaIds = vagasConsultor.map(v => v.id);
      candidatosVagasQuery = candidatosVagasQuery.in('vaga_id', vagaIds);
    } else {
      return createSuccessResponse({
        total: 0,
        por_status: [],
        por_vaga: []
      });
    }
  }

  const { data: candidatosVagas, error } = await candidatosVagasQuery;

  if (error) {
    throw error;
  }

  // Calcular estatísticas
  const total = candidatosVagas.length;

  // Por status
  const statusCounts: { [key: string]: number } = {};
  candidatosVagas.forEach(cv => {
    statusCounts[cv.status_atual] = (statusCounts[cv.status_atual] || 0) + 1;
  });

  const por_status = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // Por vaga
  const vagaCounts: { [key: string]: { count: number, numero: string } } = {};
  candidatosVagas.forEach(cv => {
    if (cv.vaga) {
      if (!vagaCounts[cv.vaga_id]) {
        vagaCounts[cv.vaga_id] = { count: 0, numero: cv.vaga.numero_vaga };
      }
      vagaCounts[cv.vaga_id].count++;
    }
  });

  const por_vaga = Object.entries(vagaCounts).map(([vaga_id, data]) => ({
    vaga_id,
    vaga_numero: data.numero,
    total: data.count
  }));

  return createSuccessResponse({
    total,
    por_status,
    por_vaga
  });
} 