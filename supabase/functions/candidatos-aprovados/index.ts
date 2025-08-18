import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../utils/cors.ts'
import { verifyAuth } from '../utils/auth.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user } = authResult
    const url = new URL(req.url)
    const vagaId = url.pathname.split('/').pop()

    if (req.method === 'GET' && vagaId) {
      return await getCandidatosAprovados(vagaId, user)
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getCandidatosAprovados(vagaId: string, user: any) {
  try {
    // Buscar candidatos aprovados para a vaga
    const { data: candidatosVagas, error: cvError } = await supabase
      .from('candidatos_vagas')
      .select(`
        id,
        candidato_id,
        status_atual,
        data_candidatura,
        candidato:candidatos(id, nome, email),
        vaga:vagas(id, numero_vaga, cargo, empresa:clientes(razao_social))
      `)
      .eq('vaga_id', vagaId)
      .in('status_atual', ['aprovado'])

    if (cvError) throw cvError

    // Formatar dados dos candidatos aprovados
    const candidatosAprovados = candidatosVagas.map(cv => {
      const nomeCompleto = cv.candidato?.nome || 'Nome não informado'
      const nomes = nomeCompleto.split(' ')
      const nomeAbreviado = nomes.length >= 2 
        ? `${nomes[0][0]}.${nomes[nomes.length - 1][0]}. ${nomes[nomes.length - 1]}`
        : nomeCompleto

      return {
        id: cv.candidato_id,
        nome: nomeCompleto,
        nome_abreviado: nomeAbreviado,
        data_aprovacao: cv.data_candidatura,
        status: cv.status_atual,
        vaga_id: cv.vaga?.id,
        vaga_numero: cv.vaga?.numero_vaga,
        vaga_cargo: cv.vaga?.cargo,
        empresa_nome: cv.vaga?.empresa?.razao_social
      }
    })

    return new Response(
      JSON.stringify({ data: candidatosAprovados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
} 