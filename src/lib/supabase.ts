import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configurações de sessão simples
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Habilitar para detectar tokens de reset
    flowType: 'pkce', // Usar PKCE flow para melhor segurança
  },
});

// Adicionar listener para debug de problemas de auth
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    // Logs removidos para limpar o console
  });
}

// Tipos para o frontend
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Função para fazer requisições para as Edge Functions
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: result.error?.message || 'Erro na requisição',
          code: result.error?.code || 'UNKNOWN_ERROR',
          details: result.error?.details,
        },
      };
    }

    return {
      data: result.data,
      error: null,
    };
  } catch (error) {
    console.error('Erro na requisição:', error);
    return {
      data: null,
      error: {
        message: 'Erro de conexão',
        code: 'NETWORK_ERROR',
        details: error,
      },
    };
  }
}

// Função para login usando Auth nativo do Supabase
export async function login(email: string, password: string): Promise<ApiResult<any>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.name || 'LOGIN_ERROR',
        },
      };
    }

    return {
      data: {
        user: null, // Será preenchido pelo AuthContext
        session: data.session,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      },
    };
  }
}

// Função para logout usando Auth nativo do Supabase
export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Erro no logout:', error);
  } finally {
    localStorage.removeItem('user');
  }
}

// Função para verificar se está autenticado usando Auth nativo do Supabase
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
}

// Função para obter usuário atual
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Função para verificar se é admin
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.tipo === 'admin';
}

// Função para refresh token
export async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${supabaseUrl}/functions/v1/auth-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const result = await response.json();

    if (response.ok && result.data?.token) {
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('refresh_token', result.data.refresh_token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return false;
  }
}

// Interceptor para renovar token automaticamente
export async function apiRequestWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  let result = await apiRequest<T>(endpoint, options);

  // Se o token expirou, tentar renovar
  if (result.error?.code === 'INVALID_TOKEN') {
    const refreshed = await refreshToken();
    if (refreshed) {
      result = await apiRequest<T>(endpoint, options);
    } else {
      // Se não conseguir renovar, fazer logout
      logout();
      window.location.href = '/login';
    }
  }

  return result;
}

// Funções específicas para cada entidade
export const api = {
  // Usuários
  usuarios: {
    list: () => apiRequestWithAuth('usuarios'),
    get: (id: string) => apiRequestWithAuth(`usuarios?id=${id}`),
    create: (data: any) => apiRequestWithAuth('usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (data: any) => apiRequestWithAuth('usuarios', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequestWithAuth(`usuarios?id=${id}`, {
      method: 'DELETE',
    }),
  },

  // Clientes
  clientes: {
    list: () => apiRequestWithAuth('clientes'),
    get: (id: string) => apiRequestWithAuth(`clientes?id=${id}`),
    create: (data: any) => apiRequestWithAuth('clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (data: any) => apiRequestWithAuth('clientes', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequestWithAuth(`clientes?id=${id}`, {
      method: 'DELETE',
    }),
  },

  // Vagas
  vagas: {
    list: (filters?: any) => {
      const params = new URLSearchParams(filters);
      return apiRequestWithAuth(`vagas?${params.toString()}`);
    },
    get: (id: string) => apiRequestWithAuth(`vagas?id=${id}`),
    create: (data: any) => apiRequestWithAuth('vagas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (data: any) => apiRequestWithAuth('vagas', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequestWithAuth(`vagas?id=${id}`, {
      method: 'DELETE',
    }),
  },

  // Candidatos
  candidatos: {
    list: (filters?: any) => {
      const params = new URLSearchParams(filters);
      return apiRequestWithAuth(`candidatos?${params.toString()}`);
    },
    get: (id: string) => apiRequestWithAuth(`candidatos?id=${id}`),
    create: (data: any) => apiRequestWithAuth('candidatos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (data: any) => apiRequestWithAuth('candidatos', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequestWithAuth(`candidatos?id=${id}`, {
      method: 'DELETE',
    }),
  },

  // Candidatos por Vaga
  candidatosVagas: {
    list: (vagaId: string) => apiRequestWithAuth(`candidatos-vagas?vaga_id=${vagaId}`),
    create: (data: any) => apiRequestWithAuth('candidatos-vagas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (data: any) => apiRequestWithAuth('candidatos-vagas', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequestWithAuth(`candidatos-vagas?id=${id}`, {
      method: 'DELETE',
    }),
  },

  // Histórico de Status
  historicoStatus: {
    list: (candidatoVagaId: string) => 
      apiRequestWithAuth(`historico-status?candidato_vaga_id=${candidatoVagaId}`),
    create: (data: any) => apiRequestWithAuth('historico-status', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Currículos
  curriculos: {
    list: (filters?: any) => {
      const params = new URLSearchParams(filters);
      return apiRequestWithAuth(`curriculos?${params.toString()}`);
    },
    upload: (data: FormData) => apiRequestWithAuth('curriculos', {
      method: 'POST',
      body: data,
      headers: {}, // Remover Content-Type para FormData
    }),
    delete: (id: string) => apiRequestWithAuth(`curriculos?id=${id}`, {
      method: 'DELETE',
    }),
  },

  // Estatísticas
  stats: {
    vagas: () => apiRequestWithAuth('stats/vagas'),
    candidatos: () => apiRequestWithAuth('stats/candidatos'),
  },

  // Relatórios
  relatorios: {

    posicoesFechadas: () => apiRequestWithAuth('relatorios/posicoes-fechadas'),
    financeiro: () => apiRequestWithAuth('relatorios/financeiro'),
  },
}; 