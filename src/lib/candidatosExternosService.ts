import { supabase } from './supabase';
import {
  CandidatoExterno,
  CreateCandidatoExterno,
  UpdateCandidatoExterno,
  CandidatoExternoResponse,
  CandidaturasResponse,
  CandidaturaResponse,
  VerificarCandidaturaResponse,
  CandidaturaExternaWithVaga
} from '../../supabase/types';

export class CandidatosExternosService {
  // Criar candidato externo
  static async criar(data: CreateCandidatoExterno): Promise<CandidatoExternoResponse> {
    try {
      // Inserir diretamente na tabela candidatos_externos
      const { data: result, error } = await supabase
        .from('candidatos_externos')
        .insert({
          nome: data.nome,
          email: data.email,
          auth_user_id: data.auth_user_id,
          telefone: data.telefone,
          data_nascimento: data.data_nascimento,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          ativo: true,
          data_cadastro: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar candidato externo:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        candidato: result
      };
    } catch (error) {
      console.error('Erro ao criar candidato externo:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Buscar candidato por email
  static async buscarPorEmail(email: string): Promise<CandidatoExternoResponse> {
    try {
      const { data: result, error } = await supabase
        .from('candidatos_externos')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Candidato não encontrado'
          };
        }
        
        console.error('Erro ao buscar candidato por email:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        candidato: result
      };
    } catch (error) {
      console.error('Erro ao buscar candidato por email:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Buscar candidato por ID
  static async buscarPorId(id: string): Promise<CandidatoExternoResponse> {
    try {
      const { data: result, error } = await supabase
        .from('candidatos_externos')
        .select('*')
        .eq('id', id)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Candidato não encontrado'
          };
        }
        
        console.error('Erro ao buscar candidato por ID:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        candidato: result
      };
    } catch (error) {
      console.error('Erro ao buscar candidato por ID:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Atualizar candidato
  static async atualizar(id: string, data: UpdateCandidatoExterno): Promise<CandidatoExternoResponse> {
    try {
      const { data: result, error } = await supabase
        .from('candidatos_externos')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar candidato:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        candidato: result
      };
    } catch (error) {
      console.error('Erro ao atualizar candidato:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Aplicar para vaga - usar RPC
  static async aplicarVaga(
    candidatoId: string,
    vagaId: string,
    observacoes?: string,
    curriculoUrl?: string
  ): Promise<CandidaturaResponse> {
    try {
      const { data: result, error } = await supabase.rpc('aplicar_candidato_vaga', {
        p_candidato_id: candidatoId,
        p_vaga_id: vagaId,
        p_observacoes: observacoes || '',
        p_curriculo_url: curriculoUrl
      });

      if (error) {
        console.error('Erro ao aplicar para vaga:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao aplicar para vaga:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Verificar candidatura existente - usar RPC
  static async verificarCandidatura(candidatoId: string, vagaId: string): Promise<VerificarCandidaturaResponse> {
    try {
      const { data: result, error } = await supabase.rpc('verificar_candidatura_existente', {
        p_candidato_id: candidatoId,
        p_vaga_id: vagaId
      });

      if (error) {
        console.error('Erro ao verificar candidatura:', error);
        return {
          success: false,
          error: error.message,
          candidatou: false
        };
      }

      return {
        success: true,
        candidatou: result?.existe || false
      };
    } catch (error) {
      console.error('Erro ao verificar candidatura:', error);
      return {
        success: false,
        error: 'Erro interno do servidor',
        candidatou: false
      };
    }
  }

  // Buscar candidaturas do candidato - usar RPC
  static async buscarCandidaturas(candidatoId: string): Promise<CandidaturasResponse> {
    try {
      const { data: result, error } = await supabase.rpc('buscar_candidaturas_candidato', {
        p_candidato_id: candidatoId
      });

      if (error) {
        console.error('Erro ao buscar candidaturas:', error);
        return {
          success: false,
          error: error.message,
          candidaturas: []
        };
      }

      return {
        success: true,
        candidaturas: result || []
      };
    } catch (error) {
      console.error('Erro ao buscar candidaturas:', error);
      return {
        success: false,
        error: 'Erro interno do servidor',
        candidaturas: []
      };
    }
  }
} 