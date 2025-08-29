import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CandidatosExternosService } from '../lib/candidatosExternosService';
import { supabase } from '../lib/supabase';
import { validateAndProcessFile } from '../lib/utils';
import { 
  CandidatoExterno, 
  CreateCandidatoExterno, 
  UpdateCandidatoExterno
} from '../../supabase/types';
import type { User } from '@supabase/supabase-js';

interface CandidatoExternoContextType {
  // Estado do candidato
  candidato: CandidatoExterno | null;
  loading: boolean;
  error: string | null;
  user: User | null;

  // Métodos de autenticação
  login: (email: string, senha: string) => Promise<boolean>;
  register: (data: CreateCandidatoExterno) => Promise<boolean>;
  logout: () => void;

  // Métodos de perfil
  updateProfile: (data: UpdateCandidatoExterno) => Promise<boolean>;
  uploadCurriculo: (file: File) => Promise<boolean>;

  // Métodos de candidatura
  aplicarVaga: (vagaId: string, observacoes?: string, curriculoUrl?: string) => Promise<boolean>;
  verificarCandidatura: (vagaId: string) => Promise<boolean>;

  // Utilitários
  isAuthenticated: boolean;
  clearError: () => void;
}

const CandidatoExternoContext = createContext<CandidatoExternoContextType | undefined>(undefined);

export const useCandidatoExterno = () => {
  const context = useContext(CandidatoExternoContext);
  if (!context) {
    throw new Error('useCandidatoExterno deve ser usado dentro de um CandidatoExternoProvider');
  }
  return context;
};

interface CandidatoExternoProviderProps {
  children: ReactNode;
}

export const CandidatoExternoProvider: React.FC<CandidatoExternoProviderProps> = ({ children }) => {
  const [candidato, setCandidato] = useState<CandidatoExterno | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Verificar sessão do Supabase Auth
  useEffect(() => {
    let mounted = true;

    // Verificar sessão inicial com timeout reduzido
    const initializeAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na inicialização do candidato')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        // Só tentar carregar dados se houver sessão E for candidato externo
        if (mounted && session?.user) {
          const isExternalCandidate = session.user.user_metadata?.tipo === 'candidato_externo';
          
          if (isExternalCandidate) {
            setUser(session.user);
            await loadCandidatoByAuthId(session.user.id);
          } else {
            // É admin ou consultor - não buscar dados de candidato
            setUser(null);
            setCandidato(null);
          }
        } else if (mounted) {
          // Não há sessão - isso é normal para candidatos não logados
          setUser(null);
          setCandidato(null);
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão do candidato:', error);
        // Em caso de timeout ou erro, apenas limpar estado
        if (mounted) {
          setUser(null);
          setCandidato(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Log removido para limpar o console

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            const isExternalCandidate = session.user.user_metadata?.tipo === 'candidato_externo';
            
            if (isExternalCandidate) {
              setUser(session.user);
              
              // Aguardar um pouco antes de tentar carregar o candidato
              setTimeout(async () => {
                if (mounted) {
                  await loadCandidatoByAuthId(session.user.id);
                }
              }, 1000);
            } else {
              // É admin ou consultor - limpar dados de candidato
              setUser(null);
              setCandidato(null);
            }
            
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setCandidato(null);
          } else if (event === 'TOKEN_REFRESHED') {
            // Para refresh de token, só revalidar se havia uma sessão válida E for candidato externo
            if (session?.user) {
              const isExternalCandidate = session.user.user_metadata?.tipo === 'candidato_externo';
              
              if (isExternalCandidate) {
                setUser(session.user);
                await loadCandidatoByAuthId(session.user.id);
              } else {
                setUser(null);
                setCandidato(null);
              }
            } else {
              setUser(null);
              setCandidato(null);
            }
          }
        } catch (error) {
          console.error('Erro no auth state change do candidato:', error);
          if (mounted) {
            setUser(null);
            setCandidato(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadCandidatoByAuthId = async (authUserId: string) => {
    try {
      setLoading(true);
      
      // Timeout para busca do candidato - reduzido para 3 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao buscar candidato')), 3000)
      );

      const candidatoPromise = supabase
        .from('candidatos_externos')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      const { data, error } = await Promise.race([candidatoPromise, timeoutPromise]) as any;

      if (error) {
        // Se não encontrar o candidato, isso é normal durante o registro
        if (error.code === 'PGRST116') {
          return;
        }
        console.error('Erro ao carregar candidato:', error);
        return;
      }

      if (data) {
        setCandidato(data);
      }
    } catch (error) {
      console.error('Erro ao carregar candidato por auth ID:', error);
      // Não tentar refresh automático para evitar loops
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const login = async (email: string, senha: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Fazer login no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (authError) {
        setError(authError.message);
        return false;
      }

      if (!authData.user) {
        setError('Erro na autenticação');
        return false;
      }

      // O candidato será carregado automaticamente pelo listener onAuthStateChange
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: CreateCandidatoExterno): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Criar usuário no Supabase Auth (sem confirmação de email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha_hash,
        options: {
          data: {
            nome: data.nome,
            tipo: 'candidato_externo'
          }
        }
      });

      if (authError) {
        setError(authError.message);
        return false;
      }

      if (!authData.user) {
        setError('Erro ao criar conta');
        return false;
      }

      // 2. Criar registro na tabela candidatos_externos
      const candidatoData = {
        nome: data.nome,
        email: data.email,
        auth_user_id: authData.user.id,
        telefone: data.telefone,
        data_nascimento: data.data_nascimento,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep
      };

      const response = await CandidatosExternosService.criar(candidatoData);

      if (!response.success) {
        setError(response.error || 'Erro ao criar perfil');
        return false;
      }

      // 3. Se já temos sessão, carregar o candidato criado
      if (authData.session) {
        // Carregar o candidato que acabamos de criar
        setTimeout(async () => {
          await loadCandidatoByAuthId(authData.user.id);
        }, 500);
        
        return true;
      }

      // Aguardar um pouco para o Supabase processar
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar novamente se temos sessão
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (sessionCheck.session) {
        return true;
      }

      // Tentar fazer login manual
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha_hash
      });

      if (loginError) {
        if (loginError.message.includes('Email not confirmed')) {
          setError('Conta criada! Verifique seu email para confirmar, ou tente fazer login.');
        } else {
          setError('Conta criada com sucesso! Faça login na próxima tela.');
        }
        return true; // Usuário foi criado, só não conseguiu logar automaticamente
      }

      if (loginData.session) {
        // Carregar o candidato após login
        setTimeout(async () => {
          await loadCandidatoByAuthId(authData.user.id);
        }, 500);
      }

      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // Os estados serão limpos automaticamente pelo listener onAuthStateChange
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const updateProfile = async (data: UpdateCandidatoExterno): Promise<boolean> => {
    if (!candidato || !user) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await CandidatosExternosService.atualizar(candidato.id, data);

      if (!response.success) {
        setError(response.error || 'Erro ao atualizar perfil');
        return false;
      }

      // Atualizar estado local
      setCandidato(prev => prev ? { ...prev, ...data } : null);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadCurriculo = async (file: File): Promise<boolean> => {
    if (!candidato || !user) return false;

    setLoading(true);
    setError(null);

    try {
      // Validar e processar o arquivo
      const validation = validateAndProcessFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        requireSanitization: true
      });

      if (!validation.isValid) {
        setError(`Erro na validação do arquivo: ${validation.errors.join(', ')}`);
        return false;
      }

      const processedFile = validation.processedFile!;
      
      // Upload real para Supabase Storage
      const fileName = `${user.id}_${Date.now()}_${processedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('curriculos')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        setError('Erro ao fazer upload do arquivo');
        return false;
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('curriculos')
        .getPublicUrl(fileName);

      const curriculoUrl = publicUrl;

      const response = await CandidatosExternosService.atualizar(candidato.id, {
        curriculo_url: curriculoUrl,
        curriculo_nome: processedFile.name,
        curriculo_tamanho: processedFile.size,
        curriculo_tipo: processedFile.type
      });

      if (!response.success) {
        setError(response.error || 'Erro ao fazer upload do currículo');
        return false;
      }

      // Atualizar estado local
      setCandidato(prev => prev ? {
        ...prev,
        curriculo_url: curriculoUrl,
        curriculo_nome: processedFile.name,
        curriculo_tamanho: processedFile.size,
        curriculo_tipo: processedFile.type
      } : null);

      return true;
    } catch (error) {
      console.error('Erro no upload:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const aplicarVaga = async (vagaId: string, observacoes?: string, curriculoUrl?: string): Promise<boolean> => {
    if (!candidato || !user) return false;

    setLoading(true);
    setError(null);

    try {
      // Usar a função RPC do Supabase
      const { data, error } = await supabase.rpc('aplicar_candidato_vaga', {
        p_candidato_id: candidato.id,
        p_vaga_id: vagaId,
        p_observacoes: observacoes || '',
        p_curriculo_url: curriculoUrl
      });

      if (error) {
        console.error('Erro ao aplicar em vaga:', error);
        setError(error.message || 'Erro ao se candidatar');
        return false;
      }

      if (!data?.success) {
        setError(data?.error || 'Erro ao se candidatar');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao aplicar para vaga:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verificarCandidatura = async (vagaId: string): Promise<boolean> => {
    if (!candidato) return false;

    try {
      const { data, error } = await supabase.rpc('verificar_candidatura_existente', {
        p_candidato_id: candidato.id,
        p_vaga_id: vagaId
      });

      if (error) {
        console.error('Erro ao verificar candidatura:', error);
        return false;
      }

      return data?.existe || false;
    } catch (error) {
      console.error('Erro ao verificar candidatura:', error);
      return false;
    }
  };

  const value: CandidatoExternoContextType = {
    candidato,
    loading,
    error,
    user,
    login,
    register,
    logout,
    updateProfile,
    uploadCurriculo,
    aplicarVaga,
    verificarCandidatura,
    isAuthenticated: !!user,
    clearError,
  };

  return (
    <CandidatoExternoContext.Provider value={value}>
      {children}
    </CandidatoExternoContext.Provider>
  );
}; 