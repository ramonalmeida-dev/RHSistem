// Utilitários de autenticação para Edge Functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para verificar se o usuário é admin
export async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('id', userId)
    .single();
  
  return user?.tipo === 'admin';
}

// Função para verificar JWT
export async function verifyJWT(token: string): Promise<any> {
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

// Função para extrair token do header Authorization
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Função para criar resposta de erro padronizada
export function createErrorResponse(message: string, code: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code
      }
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Função para criar resposta de sucesso padronizada
export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify({ data }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Função para verificar autenticação completa
export async function authenticateRequest(req: Request): Promise<{ payload: any; userId: string; isAdmin: boolean } | null> {
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  // Verificar JWT com Supabase diretamente
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // Usar o token para fazer uma consulta autenticada
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  // Buscar tipo do usuário na tabela usuarios
  const { data: userData } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('id', user.id)
    .single();

  return {
    payload: user,
    userId: user.id,
    isAdmin: userData?.tipo === 'admin'
  };
}

// Função para hash de senha
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
  return await bcrypt.hash(password);
}

// Função para verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
  return await bcrypt.compare(password, hash);
} 