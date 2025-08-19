import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  tipo: 'admin' | 'consultor';
  ativo: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Verificar sessão inicial com timeout
    const initializeAuth = async () => {
      try {
        // Timeout de 10 segundos para inicialização
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na inicialização')), 10000)
        );

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (mounted && session?.user) {
          await createUserFromSession(session.user);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        // Em caso de erro, forçar logout para limpar estado inconsistente
        if (mounted) {
          await supabase.auth.signOut();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setInitializationComplete(true);
        }
      }
    };

    initializeAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event);

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            await createUserFromSession(session.user);
          } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Revalidar usuário após refresh do token
            await createUserFromSession(session.user);
          }
        } catch (error) {
          console.error('Erro no auth state change:', error);
          setUser(null);
        } finally {
          if (initializationComplete) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializationComplete]);

  const createUserFromSession = async (authUser: User) => {
    try {
      // Verificar se é candidato externo - se for, não autenticar no sistema administrativo
      const isExternalCandidate = authUser.user_metadata?.tipo === 'candidato_externo';
      
      if (isExternalCandidate) {
        // Candidatos externos não devem ser autenticados no sistema administrativo
        setUser(null);
        return;
      }

      // Buscar dados do usuário na tabela usuarios com timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 5000)
      );

      const userPromise = supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .eq('ativo', true)
        .single();

      const { data: userData, error } = await Promise.race([userPromise, timeoutPromise]) as any;

      if (error || !userData) {
        console.error('Usuário não encontrado ou inativo:', error);
        // Se usuário não encontrado, fazer logout silencioso
        await supabase.auth.signOut();
        return;
      }

      setUser({
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        tipo: userData.tipo,
        ativo: userData.ativo
      });
    } catch (error) {
      console.error('Erro ao criar usuário da sessão:', error);
      setUser(null);
      // Em caso de erro, tentar refresh da sessão
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.error('Erro ao fazer refresh da sessão:', refreshError);
        await supabase.auth.signOut();
      }
    }
  };

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Erro ao fazer refresh da sessão:', error);
        await supabase.auth.signOut();
        return;
      }

      if (data.session?.user) {
        await createUserFromSession(data.session.user);
      }
    } catch (error) {
      console.error('Erro no refresh da sessão:', error);
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await createUserFromSession(data.user);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 