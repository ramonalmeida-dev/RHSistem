import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UsePasswordResetReturn {
  isRecoverySession: boolean;
  isLoading: boolean;
  error: string | null;
  hasValidSession: boolean;
}

export const usePasswordReset = (): UsePasswordResetReturn => {
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        // Verificar se há fragmentos na URL que indicam recuperação
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const isRecoveryUrl = hashParams.get('type') === 'recovery';
        const hasAccessToken = hashParams.has('access_token');
        const hasCode = searchParams.has('code'); // PKCE flow
        
        console.log('URL:', window.location.href);
        console.log('Hash params:', Object.fromEntries(hashParams));
        console.log('Search params:', Object.fromEntries(searchParams));
        console.log('Is recovery URL:', isRecoveryUrl);
        console.log('Has access token:', hasAccessToken);
        console.log('Has code (PKCE):', hasCode);
        
        // Se é uma URL de recuperação, aguardar processamento
        if (isRecoveryUrl || hasAccessToken || hasCode) {
          console.log('Aguardando Supabase processar token/code...');
          // PKCE flow pode demorar mais
          const waitTime = hasCode ? 3000 : 2000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
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
        // 2. Há uma sessão válida na página de reset OU
        // 3. Há um code na URL (PKCE flow)
        const isRecovery = isRecoveryUrl || hasAccessToken || hasCode || (session && window.location.pathname === '/reset-senha');
        const hasSession = !!session;
        
        console.log('Final recovery status:', isRecovery);
        console.log('Has valid session:', hasSession);
        
        setIsRecoverySession(isRecovery);
        setHasValidSession(hasSession);
        
        if (!isRecovery && window.location.pathname === '/reset-senha') {
          setError('Acesse esta página através do link enviado por email');
        } else if (isRecovery && !hasSession) {
          console.log('Recovery URL detected but no session yet, will retry...');
          // Se é uma URL de recuperação mas não há sessão, aguardar mais um pouco
          // PKCE pode demorar mais, então aguardar mais tempo
          const retryTime = hasCode ? 2000 : 1000;
          setTimeout(() => checkRecoverySession(), retryTime);
          return; // Não definir como carregamento completo ainda
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
    hasValidSession,
  };
}; 