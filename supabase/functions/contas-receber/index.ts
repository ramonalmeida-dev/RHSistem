import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../utils/cors.ts'
import { verifyAuth } from '../utils/auth.ts'
import { ContaReceber, CreateContaReceber, UpdateContaReceber, ContaReceberFilters, ContaReceberStats } from '../types.ts'

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
    const path = url.pathname.split('/').pop()

    switch (req.method) {
      case 'GET':
        if (path === 'stats') {
          return await getStats(req, user)
        } else if (path) {
          return await getContaReceber(path, user)
        } else {
          return await listContasReceber(req, user)
        }

      case 'POST':
        return await createContaReceber(req, user)

      case 'PUT':
        if (path) {
          return await updateContaReceber(path, req, user)
        }
        break

      case 'DELETE':
        if (path) {
          return await deleteContaReceber(path, user)
        }
        break
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

async function getStats(req: Request, user: any) {
  try {
    const { data: contas, error } = await supabase
      .from('contas_receber')
      .select('valor, status')

    if (error) throw error

    const stats: ContaReceberStats = {
      total: contas.length,
      pendente: 0,
      pago: 0,
      atrasado: 0,
      parcial: 0,
      valor_total: 0,
      valor_recebido: 0,
      valor_pendente: 0,
      valor_atrasado: 0
    }

    contas.forEach(conta => {
      stats.valor_total += Number(conta.valor)
      
      switch (conta.status) {
        case 'pendente':
          stats.pendente++
          stats.valor_pendente += Number(conta.valor)
          break
        case 'pago':
          stats.pago++
          stats.valor_recebido += Number(conta.valor)
          break
        case 'atrasado':
          stats.atrasado++
          stats.valor_atrasado += Number(conta.valor)
          break
        case 'parcial':
          stats.parcial++
          break
      }
    })

    return new Response(
      JSON.stringify({ data: stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

async function listContasReceber(req: Request, user: any) {
  try {
    const url = new URL(req.url)
    const filters: ContaReceberFilters = {
      status: url.searchParams.get('status') as any,
      tipo: url.searchParams.get('tipo') as any,
      empresa_id: url.searchParams.get('empresa_id') || undefined,
      data_vencimento_inicio: url.searchParams.get('data_vencimento_inicio') || undefined,
      data_vencimento_fim: url.searchParams.get('data_vencimento_fim') || undefined,
      search: url.searchParams.get('search') || undefined
    }

    let query = supabase
      .from('contas_receber')
      .select(`
        *,
        empresa:clientes(id, razao_social, cnpj),
        vaga:vagas(id, numero_vaga, cargo)
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }
    if (filters.empresa_id) {
      query = query.eq('empresa_id', filters.empresa_id)
    }
    if (filters.data_vencimento_inicio) {
      query = query.gte('data_vencimento', filters.data_vencimento_inicio)
    }
    if (filters.data_vencimento_fim) {
      query = query.lte('data_vencimento', filters.data_vencimento_fim)
    }
    if (filters.search) {
      query = query.or(`numero_vaga.ilike.%${filters.search}%,cargo.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

async function getContaReceber(id: string, user: any) {
  try {
    const { data, error } = await supabase
      .from('contas_receber')
      .select(`
        *,
        empresa:clientes(id, razao_social, cnpj),
        vaga:vagas(id, numero_vaga, cargo)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

async function createContaReceber(req: Request, user: any) {
  try {
    // Verificar se é admin
    if (user.tipo !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem criar contas a receber' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateContaReceber = await req.json()

    const { data, error } = await supabase
      .from('contas_receber')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ data }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

async function updateContaReceber(id: string, req: Request, user: any) {
  try {
    // Verificar se é admin
    if (user.tipo !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem atualizar contas a receber' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: UpdateContaReceber = await req.json()

    const { data, error } = await supabase
      .from('contas_receber')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

async function deleteContaReceber(id: string, user: any) {
  try {
    // Verificar se é admin
    if (user.tipo !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem excluir contas a receber' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase
      .from('contas_receber')
      .delete()
      .eq('id', id)

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Conta a receber excluída com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
} 