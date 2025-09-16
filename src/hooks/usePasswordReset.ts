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
        // Verificar se há fragmentos na URL que indicam recuperação
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const isRecoveryUrl = hashParams.get('type') === 'recovery';
        const hasAccessToken = hashParams.has('access_token');
        
        console.log('URL:', window.location.href);
        console.log('Hash params:', Object.fromEntries(hashParams));
        console.log('Is recovery URL:', isRecoveryUrl);
        console.log('Has access token:', hasAccessToken);
        
        // Se é uma URL de recuperação, aguardar processamento
        if (isRecoveryUrl || hasAccessToken) {
          console.log('Aguardando Supabase processar token...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session after processing:', {
          exists: !!session,
          user: session?.user?.id,
          error: error?.message
        });
        
        if (error) {
          console.error('Erro na sessão:', error);
          setError(`Erro ao verificar sessão: ${error.message}`);
          return;
        }

        // Considerar válida se:
        // 1. É uma URL de recuperação OU
        // 2. Há uma sessão válida na página de reset
        const isRecovery = isRecoveryUrl || hasAccessToken || (session && window.location.pathname === '/reset-senha');
        
        console.log('Final recovery status:', isRecovery);
        
        setIsRecoverySession(isRecovery);
        
        if (!isRecovery && window.location.pathname === '/reset-senha') {
          setError('Acesse esta página através do link enviado por email');
        }
      } catch (err: any) {
        console.error('Erro ao verificar sessão de recuperação:', err);
        setError(`Erro interno: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Escutar mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        console.log('Re-checking recovery session after auth change...');
        await checkRecoverySession();
      }
    });

    // Verificar inicialmente
    checkRecoverySession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    isRecoverySession,
    isLoading,
    error,
  };
}; 