import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UsePasswordResetReturn {
  isRecoverySession: boolean;
  isLoading: boolean;
  error: string | null;
}

export const usePasswordReset = (): UsePasswordResetReturn => {
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setError('Erro ao verificar sessão de recuperação');
          return;
        }

        // Verificar se é uma sessão de recuperação de senha
        const isRecovery = session?.user?.user_metadata?.iss === 'supabase' && 
                          window.location.hash.includes('type=recovery');
        
        setIsRecoverySession(isRecovery);
        
        if (!isRecovery && window.location.pathname === '/reset-senha') {
          setError('Sessão de recuperação inválida ou expirada');
        }
      } catch (err) {
        console.error('Erro ao verificar sessão de recuperação:', err);
        setError('Erro ao verificar sessão de recuperação');
      } finally {
        setIsLoading(false);
      }
    };

    checkRecoverySession();

    // Escutar mudanças na URL para detectar tokens de recuperação
    const handleHashChange = () => {
      checkRecoverySession();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return {
    isRecoverySession,
    isLoading,
    error,
  };
}; 