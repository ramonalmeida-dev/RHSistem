import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Email e senha são obrigatórios',
            code: 'MISSING_CREDENTIALS'
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Credenciais inválidas',
            code: 'INVALID_CREDENTIALS'
          }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar senha (usando bcrypt)
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
    const isValidPassword = await bcrypt.compare(password, user.senha_hash);

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Credenciais inválidas',
            code: 'INVALID_CREDENTIALS'
          }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Gerar JWT token
    const jwt = await import('https://deno.land/x/djwt@v2.8/mod.ts');
    const key = await jwt.importKey(
      'HS256',
      new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'your-secret-key')
    );

    const payload = {
      sub: user.id,
      email: user.email,
      tipo: user.tipo,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
    };

    const token = await jwt.create({ alg: 'HS256', typ: 'JWT' }, payload, key);

    // Gerar refresh token
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 dias
    };

    const refreshToken = await jwt.create({ alg: 'HS256', typ: 'JWT' }, refreshPayload, key);

    // Remover senha_hash da resposta
    const { senha_hash, ...userWithoutPassword } = user;

    return new Response(
      JSON.stringify({
        data: {
          user: userWithoutPassword,
          token,
          refresh_token: refreshToken
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no login:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 