import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para verificar se o usuário é admin
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('id', userId)
    .single();
  
  return user?.tipo === 'admin';
}

// Função para verificar JWT
async function verifyJWT(token: string): Promise<any> {
  try {
    const jwt = await import('https://deno.land/x/djwt@v2.8/mod.ts');
    const key = await jwt.importKey(
      'HS256',
      new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'your-secret-key')
    );
    
    const payload = await jwt.verify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

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
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Token de autenticação necessário',
            code: 'UNAUTHORIZED'
          }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Token inválido',
            code: 'INVALID_TOKEN'
          }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = payload.sub;
    const isUserAdmin = await isAdmin(supabase, userId);

    // GET - Listar usuários
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      const tipo = url.searchParams.get('tipo');

      if (id) {
        // Buscar usuário específico
        if (payload.sub !== id && !isUserAdmin) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Acesso negado',
                code: 'FORBIDDEN'
              }
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: user, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Usuário não encontrado',
                code: 'NOT_FOUND'
              }
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { senha_hash, ...userWithoutPassword } = user;
        return new Response(
          JSON.stringify({ data: userWithoutPassword }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Listar todos os usuários (apenas admin)
        if (!isUserAdmin) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Acesso negado',
                code: 'FORBIDDEN'
              }
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        let query = supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Filtrar por tipo se especificado
        if (tipo) {
          query = query.eq('tipo', tipo);
        }

        const { data: users, error } = await query;

        if (error) {
          throw error;
        }

        // Remover senhas da resposta
        const usersWithoutPasswords = users.map(({ senha_hash, ...user }) => user);

        return new Response(
          JSON.stringify({ data: usersWithoutPasswords }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // POST - Criar usuário (apenas admin)
    if (req.method === 'POST') {
      if (!isUserAdmin) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Apenas administradores podem criar usuários',
              code: 'FORBIDDEN'
            }
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { email, password, nome, tipo, ativo } = await req.json();

      if (!email || !password || !nome || !tipo) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Email, senha, nome e tipo são obrigatórios',
              code: 'MISSING_FIELDS'
            }
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Usar Supabase Admin para criar usuário no auth
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

      // Criar usuário no auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          nome: nome,
          tipo: tipo
        }
      });

      if (authError) {
        return new Response(
          JSON.stringify({
            error: {
              message: authError.message,
              code: 'AUTH_ERROR'
            }
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Criar ou atualizar registro na tabela usuarios
      const { data: newUser, error: dbError } = await supabase
        .from('usuarios')
        .upsert({
          id: authUser.user.id,
          email,
          nome,
          tipo,
          ativo: ativo ?? true
        })
        .select()
        .single();

      if (dbError) {
        // Se falhou para criar na tabela, limpar do auth
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw dbError;
      }

      return new Response(
        JSON.stringify({ data: newUser }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PUT - Atualizar usuário
    if (req.method === 'PUT') {
      const { id, ...updateData } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'ID do usuário é obrigatório',
              code: 'MISSING_ID'
            }
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Verificar permissões
      if (payload.sub !== id && !isUserAdmin) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Acesso negado',
              code: 'FORBIDDEN'
            }
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Se não for admin, não pode alterar tipo
      if (!isUserAdmin && updateData.tipo) {
        delete updateData.tipo;
      }

      // Se estiver alterando senha, fazer hash
      if (updateData.password) {
        const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
        updateData.senha_hash = await bcrypt.hash(updateData.password);
        delete updateData.password;
      }

      const { data: updatedUser, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const { senha_hash, ...userWithoutPassword } = updatedUser;

      return new Response(
        JSON.stringify({ data: userWithoutPassword }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // DELETE - Deletar usuário (apenas admin)
    if (req.method === 'DELETE') {
      if (!isUserAdmin) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Apenas administradores podem deletar usuários',
              code: 'FORBIDDEN'
            }
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'ID do usuário é obrigatório',
              code: 'MISSING_ID'
            }
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Verificar se usuário tem vagas associadas
      const { data: vagas } = await supabase
        .from('vagas')
        .select('id')
        .eq('consultor_id', id);

      if (vagas && vagas.length > 0) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Não é possível deletar usuário com vagas associadas',
              code: 'USER_HAS_VAGAS'
            }
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ data: { message: 'Usuário deletado com sucesso' } }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          message: 'Método não permitido',
          code: 'METHOD_NOT_ALLOWED'
        }
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na API de usuários:', error);
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