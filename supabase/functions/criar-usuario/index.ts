import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, nome, role_id } = await req.json()

    if (!email || !password || !nome || !role_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o role existe
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, nome')
      .eq('id', role_id)
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: `Role não encontrado: ${role_id}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar usuário no Auth com role_id nos metadados
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        nome, 
        role_id: role_id,  // Garantir que o role_id seja enviado
        tipo: 'usuario_interno'  // Marcar como usuário interno para diferençar de candidatos externos
      }
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: `Auth error: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (authData.user) {
      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se o usuário foi inserido na tabela usuarios pelo trigger
      const { data: usuarioData, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, nome, role_id, tipo')
        .eq('id', authData.user.id)
        .single();

      // Se o trigger não funcionou, inserir manualmente
      if (usuarioError || !usuarioData) {
        const userType = ['admin_master', 'admin_nivel1'].includes(roleData.nome) ? 'admin' : 'consultor';
        
        const { error: insertError } = await supabaseAdmin
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email,
            nome,
            role_id,
            tipo: userType,
            ativo: true
          });

        if (insertError) {
          // Se falhar, remover o usuário do Auth
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          return new Response(
            JSON.stringify({ error: `Database error: ${insertError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: authData.user.id, 
            email: authData.user.email, 
            nome, 
            role_id 
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Failed to create user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: `General error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 