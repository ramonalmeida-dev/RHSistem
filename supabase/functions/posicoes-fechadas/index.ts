import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../utils/cors.ts'
import { authMiddleware } from '../utils/auth.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth middleware
    const authResult = await authMiddleware(req)
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (method) {
      case 'GET':
        if (path === 'list') {
          const { searchParams } = url
          const consultor_id = searchParams.get('consultor_id')
          const empresa_id = searchParams.get('empresa_id')
          const data_inicio = searchParams.get('data_inicio')
          const data_fim = searchParams.get('data_fim')

          const { data, error } = await supabase.rpc('get_posicoes_fechadas', {
            p_consultor_id: consultor_id,
            p_empresa_id: empresa_id,
            p_data_inicio: data_inicio,
            p_data_fim: data_fim
          })

          if (error) throw error

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (path === 'detail') {
          const { searchParams } = url
          const id = searchParams.get('id')

          if (!id) {
            return new Response(
              JSON.stringify({ error: 'ID é obrigatório' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data, error } = await supabase
            .from('posicoes_fechadas')
            .select('*')
            .eq('id', id)
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (path === 'curriculos') {
          const { searchParams } = url
          const posicao_id = searchParams.get('posicao_id')

          if (!posicao_id) {
            return new Response(
              JSON.stringify({ error: 'ID da posição é obrigatório' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data, error } = await supabase
            .from('curriculos_atualizados')
            .select('*')
            .eq('posicao_fechada_id', posicao_id)

          if (error) throw error

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (path === 'historico-emails') {
          const { searchParams } = url
          const posicao_id = searchParams.get('posicao_id')

          if (!posicao_id) {
            return new Response(
              JSON.stringify({ error: 'ID da posição é obrigatório' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data, error } = await supabase
            .from('historico_emails_posicoes')
            .select('*')
            .eq('posicao_fechada_id', posicao_id)
            .order('data_envio', { ascending: false })

          if (error) throw error

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'POST':
        if (path === 'process-vaga') {
          const { vaga_id } = await req.json()
          if (!vaga_id) {
            return new Response(
              JSON.stringify({ error: 'vaga_id é obrigatório' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data, error } = await supabase.rpc('process_vaga_fechada', {
            p_vaga_id: vaga_id
          })

          if (error) throw error

          return new Response(
            JSON.stringify({ data: { posicao_fechada_id: data } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (path === 'upload-curriculo') {
          const formData = await req.formData()
          const posicao_id = formData.get('posicao_id') as string
          const candidato_id = formData.get('candidato_id') as string
          const candidato_nome = formData.get('candidato_nome') as string
          const pretensao_salarial = formData.get('pretensao_salarial') as string
          const regime_trabalho = formData.get('regime_trabalho') as string
          const observacoes = formData.get('observacoes') as string
          const file = formData.get('file') as File

          if (!posicao_id || !candidato_id || !candidato_nome || !file) {
            return new Response(
              JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Validar arquivo
          const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          const maxSize = 5 * 1024 * 1024 // 5MB
          
          if (!allowedTypes.includes(file.type)) {
            return new Response(
              JSON.stringify({ error: 'Tipo de arquivo não suportado. Use PDF, DOC ou DOCX.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          if (file.size > maxSize) {
            return new Response(
              JSON.stringify({ error: 'Arquivo muito grande. Máximo 5MB permitido.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Sanitizar nome do arquivo
          const sanitizeFilename = (filename: string): string => {
            const lastDotIndex = filename.lastIndexOf('.')
            const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename
            const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : ''
            
            const normalized = name
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove acentos
              .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove caracteres especiais exceto hífen
              .replace(/\s+/g, '_') // Substitui espaços por underscore
              .replace(/_+/g, '_') // Remove underscores duplicados
              .replace(/^_|_$/g, '') // Remove underscores no início e fim
              .toLowerCase() // Converte para minúsculas
            
            const sanitizedName = normalized || 'arquivo'
            return sanitizedName + extension
          }

          const sanitizedName = sanitizeFilename(file.name)
          const fileName = `${Date.now()}_${sanitizedName}`
          
          // Upload do arquivo para o storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('curriculos-atualizados')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          // Gerar URL pública
          const { data: urlData } = supabase.storage
            .from('curriculos-atualizados')
            .getPublicUrl(fileName)

          // Inserir no banco
          const { data, error } = await supabase
            .from('curriculos_atualizados')
            .insert({
              posicao_fechada_id: posicao_id,
              candidato_id: candidato_id,
              candidato_nome: candidato_nome,
              curriculo_atualizado_url: urlData.publicUrl,
              curriculo_atualizado_nome: sanitizedName,
              pretensao_salarial: pretensao_salarial ? parseFloat(pretensao_salarial) : null,
              regime_trabalho: regime_trabalho || null,
              observacoes: observacoes || null
            })
            .select()
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (path === 'enviar-email') {
          const { posicao_id, assunto, corpo_email, destinatario_email } = await req.json()
          if (!posicao_id) {
            return new Response(
              JSON.stringify({ error: 'posicao_id é obrigatório' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data, error } = await supabase.rpc('enviar_email_posicao_fechada', {
            p_posicao_fechada_id: posicao_id,
            p_assunto: assunto,
            p_corpo_email: corpo_email,
            p_destinatario_email: destinatario_email
          })

          if (error) throw error

          return new Response(
            JSON.stringify({ data: { historico_id: data } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'PUT':
        if (path === 'update-status') {
          const { id, status_posicao } = await req.json()
          if (!id || !status_posicao) {
            return new Response(
              JSON.stringify({ error: 'ID e status são obrigatórios' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data, error } = await supabase
            .from('posicoes_fechadas')
            .update({ status_posicao })
            .eq('id', id)
            .select()
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'DELETE':
        if (path === 'delete-curriculo') {
          const { searchParams } = url
          const id = searchParams.get('id')

          if (!id) {
            return new Response(
              JSON.stringify({ error: 'ID é obrigatório' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { error } = await supabase
            .from('curriculos_atualizados')
            .delete()
            .eq('id', id)

          if (error) throw error

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Método não suportado' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 