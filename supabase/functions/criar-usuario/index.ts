import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../utils/cors.ts";

// Cliente com service_role_key para operações admin
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔄 Iniciando criação de usuário...');
    
    const { email, nome, tipo = 'consultor', ativo = true, senha = '123456' } = await req.json();
    
    console.log('📝 Dados recebidos:', { email, nome, tipo, ativo });

    if (!email || !nome) {
      throw new Error('Email e nome são obrigatórios');
    }

    // 1. Criar usuário no auth.users usando Admin API
    console.log('🔐 Criando usuário no auth.users...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        nome,
        tipo
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no auth:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    console.log('✅ Usuário criado no auth.users:', authUser.user?.id);

    // 2. Inserir na tabela usuarios usando a função RPC
    console.log('📊 Inserindo na tabela usuarios...');
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .rpc('criar_usuario_admin', {
        p_id: authUser.user!.id,
        p_email: email,
        p_nome: nome,
        p_tipo: tipo,
        p_ativo: ativo
      });

    if (usuarioError) {
      console.error('❌ Erro ao inserir na tabela usuarios:', usuarioError);
      
      // Se falhou ao inserir na tabela, limpar o usuário do auth
      console.log('🧹 Limpando usuário do auth...');
      await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
      
      throw new Error(`Erro ao inserir na tabela usuarios: ${usuarioError.message}`);
    }

    console.log('✅ Usuário criado com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: authUser.user!.id,
          email,
          nome,
          tipo,
          ativo
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: 'CREATE_USER_ERROR'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 