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
      const { data: result, error } = await supabase.rpc('criar_candidato_externo', {
        p_nome: data.nome,
        p_email: data.email,
        p_senha_hash: data.senha_hash,
        p_telefone: data.telefone,
        p_data_nascimento: data.data_nascimento,
        p_endereco: data.endereco,
        p_cidade: data.cidade,
        p_estado: data.estado,
        p_cep: data.cep
      });

      if (error) {
        console.error('Erro ao criar candidato externo:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return result;
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
      const { data: result, error } = await supabase.rpc('buscar_candidato_externo_por_email', {
        p_email: email
      });

      if (error) {
        console.error('Erro ao buscar candidato por email:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao buscar candidato por email:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Atualizar candidato
  static async atualizar(id: string, data: UpdateCandidatoExterno): Promise<CandidatoExternoResponse> {
    try {
      const { data: result, error } = await supabase.rpc('atualizar_candidato_externo', {
        p_id: id,
        p_nome: data.nome,
        p_telefone: data.telefone,
        p_data_nascimento: data.data_nascimento,
        p_endereco: data.endereco,
        p_cidade: data.cidade,
        p_estado: data.estado,
        p_cep: data.cep,
        p_curriculo_url: data.curriculo_url,
        p_curriculo_nome: data.curriculo_nome,
        p_curriculo_tamanho: data.curriculo_tamanho,
        p_curriculo_tipo: data.curriculo_tipo
      });

      if (error) {
        console.error('Erro ao atualizar candidato:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao atualizar candidato:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Aplicar em vaga
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
        p_observacoes: observacoes,
        p_curriculo_url: curriculoUrl
      });

      if (error) {
        console.error('Erro ao aplicar em vaga:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao aplicar em vaga:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Buscar candidaturas do candidato
  static async buscarCandidaturas(candidatoId: string): Promise<CandidaturasResponse> {
    try {
      const { data: result, error } = await supabase.rpc('buscar_candidaturas_candidato', {
        p_candidato_id: candidatoId
      });

      if (error) {
        console.error('Erro ao buscar candidaturas:', error);
        return {
          success: false,
          candidaturas: [],
          error: error.message
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao buscar candidaturas:', error);
      return {
        success: false,
        candidaturas: [],
        error: 'Erro interno do servidor'
      };
    }
  }

  // Verificar se já se candidatou
  static async verificarCandidatura(
    candidatoId: string, 
    vagaId: string
  ): Promise<VerificarCandidaturaResponse> {
    try {
      const { data: result, error } = await supabase.rpc('verificar_candidatura_existente', {
        p_candidato_id: candidatoId,
        p_vaga_id: vagaId
      });

      if (error) {
        console.error('Erro ao verificar candidatura:', error);
        return {
          success: false,
          candidatou: false,
          error: error.message
        };
      }

      return result;
    } catch (error) {
      console.error('Erro ao verificar candidatura:', error);
      return {
        success: false,
        candidatou: false,
        error: 'Erro interno do servidor'
      };
    }
  }
} 