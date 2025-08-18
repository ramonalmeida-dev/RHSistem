import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type DisponibilidadeCandidato = 'disponivel' | 'empregado' | 'indisponivel';
export type CandidatoBancoStatus = 'ativo' | 'inativo';

export interface BancoCurriculo {
  id: string;
  candidato_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  area_atuacao?: string;
  experiencia_anos?: number;
  formacao?: string;
  localizacao?: string;
  disponibilidade: DisponibilidadeCandidato;
  avaliacao?: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status: CandidatoBancoStatus;
  favorito: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBancoCurriculo {
  candidato_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  area_atuacao?: string;
  experiencia_anos?: number;
  formacao?: string;
  localizacao?: string;
  disponibilidade?: DisponibilidadeCandidato;
  avaliacao?: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status?: CandidatoBancoStatus;
  favorito?: boolean;
}

export interface UpdateBancoCurriculo {
  nome_arquivo?: string;
  url_storage?: string;
  tamanho_bytes?: number;
  tipo_arquivo?: string;
  area_atuacao?: string;
  experiencia_anos?: number;
  formacao?: string;
  localizacao?: string;
  disponibilidade?: DisponibilidadeCandidato;
  avaliacao?: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status?: CandidatoBancoStatus;
  favorito?: boolean;
}

export interface BancoCurriculoWithCandidato extends BancoCurriculo {
  candidato: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { method } = req;
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const candidato_id = url.searchParams.get('candidato_id');
    const area_atuacao = url.searchParams.get('area_atuacao');
    const disponibilidade = url.searchParams.get('disponibilidade');
    const status = url.searchParams.get('status');
    const favorito = url.searchParams.get('favorito');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    switch (method) {
      case 'GET':
        if (id) {
          // Buscar currículo específico
          const { data, error } = await supabase
            .from('banco_curriculos')
            .select(`
              *,
              candidato:candidatos(id, nome, email, telefone)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Buscar currículos com filtros
        let query = supabase
          .from('banco_curriculos')
          .select(`
            *,
            candidato:candidatos(id, nome, email, telefone)
          `, { count: 'exact' });

        if (candidato_id) query = query.eq('candidato_id', candidato_id);
        if (area_atuacao) query = query.eq('area_atuacao', area_atuacao);
        if (disponibilidade) query = query.eq('disponibilidade', disponibilidade);
        if (status) query = query.eq('status', status);
        if (favorito) query = query.eq('favorito', favorito === 'true');
        if (search) {
          query = query.or(`area_atuacao.ilike.%${search}%,formacao.ilike.%${search}%,candidato.nome.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({
          data,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'POST':
        // Criar novo currículo no banco
        const createData: CreateBancoCurriculo = await req.json();

        const { data: newCurriculo, error: createError } = await supabase
          .from('banco_curriculos')
          .insert(createData)
          .select(`
            *,
            candidato:candidatos(id, nome, email, telefone)
          `)
          .single();

        if (createError) throw createError;
        return new Response(JSON.stringify({ data: newCurriculo }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'PUT':
        if (!id) {
          throw new Error('ID é obrigatório para atualização');
        }

        // Atualizar currículo
        const updateData: UpdateBancoCurriculo = await req.json();

        const { data: updatedCurriculo, error: updateError } = await supabase
          .from('banco_curriculos')
          .update(updateData)
          .eq('id', id)
          .select(`
            *,
            candidato:candidatos(id, nome, email, telefone)
          `)
          .single();

        if (updateError) throw updateError;
        return new Response(JSON.stringify({ data: updatedCurriculo }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        if (!id) {
          throw new Error('ID é obrigatório para exclusão');
        }

        // Deletar currículo
        const { error: deleteError } = await supabase
          .from('banco_curriculos')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Método não permitido' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Erro na função banco-curriculos:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 