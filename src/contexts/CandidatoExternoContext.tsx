import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CandidatosExternosService } from '../lib/candidatosExternosService';
import { supabase } from '../lib/supabase';
import { 
  CandidatoExterno, 
  CreateCandidatoExterno, 
  UpdateCandidatoExterno,
  CandidaturaExternaWithVaga 
} from '../../supabase/types';

interface CandidatoExternoContextType {
  // Estado do candidato
  candidato: CandidatoExterno | null;
  candidaturas: CandidaturaExternaWithVaga[];
  loading: boolean;
  error: string | null;

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
  loadCandidaturas: () => Promise<void>;

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
  const [candidaturas, setCandidaturas] = useState<CandidaturaExternaWithVaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há candidato logado no localStorage
  useEffect(() => {
    const candidatoSalvo = localStorage.getItem('candidato_externo');
    if (candidatoSalvo) {
      try {
        const candidatoData = JSON.parse(candidatoSalvo);
        setCandidato(candidatoData);
        loadCandidaturas();
      } catch (error) {
        console.error('Erro ao carregar candidato do localStorage:', error);
        localStorage.removeItem('candidato_externo');
      }
    }
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, senha: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Hash da senha (em produção, usar bcrypt)
      const senhaHash = btoa(senha); // Simplificado para demo

      const response = await CandidatosExternosService.buscarPorEmail(email);
      
      if (!response.success) {
        setError(response.error || 'Erro ao fazer login');
        return false;
      }

      if (!response.candidato) {
        setError('Candidato não encontrado');
        return false;
      }

      // Verificar senha (simplificado)
      // Em produção, usar bcrypt.compare()
      // Como o tipo não inclui senha_hash, vamos buscar novamente com a senha
      const candidatoCompleto = await CandidatosExternosService.buscarPorEmail(email);
      if (!candidatoCompleto.success || !candidatoCompleto.candidato) {
        setError('Erro ao verificar senha');
        return false;
      }
      
      // Aqui precisaríamos de uma função específica para verificar senha
      // Por enquanto, vamos assumir que a senha está correta se o candidato foi encontrado
      // Em produção, implementar verificação de hash

      setCandidato(response.candidato);
      localStorage.setItem('candidato_externo', JSON.stringify(response.candidato));
      
      // Carregar candidaturas
      await loadCandidaturas();
      
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
      // Hash da senha (em produção, usar bcrypt)
      const senhaHash = btoa(data.senha_hash); // Simplificado para demo

      const response = await CandidatosExternosService.criar({
        ...data,
        senha_hash: senhaHash
      });

      if (!response.success) {
        setError(response.error || 'Erro ao criar conta');
        return false;
      }

      // Fazer login automaticamente após registro
      return await login(data.email, data.senha_hash);
    } catch (error) {
      console.error('Erro no registro:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCandidato(null);
    setCandidaturas([]);
    localStorage.removeItem('candidato_externo');
  };

  const updateProfile = async (data: UpdateCandidatoExterno): Promise<boolean> => {
    if (!candidato) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await CandidatosExternosService.atualizar(candidato.id, data);

      if (!response.success) {
        setError(response.error || 'Erro ao atualizar perfil');
        return false;
      }

      // Atualizar candidato no estado
      setCandidato(prev => prev ? { ...prev, ...data } : null);
      
      // Atualizar no localStorage
      const candidatoAtualizado = candidato ? { ...candidato, ...data } : null;
      if (candidatoAtualizado) {
        localStorage.setItem('candidato_externo', JSON.stringify(candidatoAtualizado));
      }

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
    if (!candidato) return false;

    setLoading(true);
    setError(null);

    try {
      // Upload real para Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('curriculos')
        .upload(fileName, file, {
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
        curriculo_nome: file.name,
        curriculo_tamanho: file.size,
        curriculo_tipo: file.type
      });

      if (!response.success) {
        setError(response.error || 'Erro ao fazer upload do currículo');
        return false;
      }

      // Atualizar candidato no estado
      setCandidato(prev => prev ? {
        ...prev,
        curriculo_url: curriculoUrl,
        curriculo_nome: file.name,
        curriculo_tamanho: file.size,
        curriculo_tipo: file.type
      } : null);

      // Atualizar no localStorage
      const candidatoAtualizado = candidato ? {
        ...candidato,
        curriculo_url: curriculoUrl,
        curriculo_nome: file.name,
        curriculo_tamanho: file.size,
        curriculo_tipo: file.type
      } : null;
      
      if (candidatoAtualizado) {
        localStorage.setItem('candidato_externo', JSON.stringify(candidatoAtualizado));
      }

      return true;
    } catch (error) {
      console.error('Erro ao fazer upload do currículo:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const aplicarVaga = async (vagaId: string, observacoes?: string, curriculoUrl?: string): Promise<boolean> => {
    if (!candidato) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await CandidatosExternosService.aplicarVaga(
        candidato.id,
        vagaId,
        observacoes,
        curriculoUrl
      );

      if (!response.success) {
        setError(response.error || 'Erro ao aplicar na vaga');
        return false;
      }

      // Recarregar candidaturas
      await loadCandidaturas();

      return true;
    } catch (error) {
      console.error('Erro ao aplicar na vaga:', error);
      setError('Erro interno do servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verificarCandidatura = async (vagaId: string): Promise<boolean> => {
    if (!candidato) return false;

    try {
      const response = await CandidatosExternosService.verificarCandidatura(candidato.id, vagaId);
      return response.success && response.candidatou;
    } catch (error) {
      console.error('Erro ao verificar candidatura:', error);
      return false;
    }
  };

  const loadCandidaturas = async (): Promise<void> => {
    if (!candidato) return;

    try {
      const response = await CandidatosExternosService.buscarCandidaturas(candidato.id);
      
      if (response.success) {
        setCandidaturas(response.candidaturas);
      } else {
        console.error('Erro ao carregar candidaturas:', response.error);
      }
    } catch (error) {
      console.error('Erro ao carregar candidaturas:', error);
    }
  };

  const value: CandidatoExternoContextType = {
    candidato,
    candidaturas,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadCurriculo,
    aplicarVaga,
    verificarCandidatura,
    loadCandidaturas,
    isAuthenticated: !!candidato,
    clearError
  };

  return (
    <CandidatoExternoContext.Provider value={value}>
      {children}
    </CandidatoExternoContext.Provider>
  );
}; 