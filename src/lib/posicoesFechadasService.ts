import { supabase } from './supabase';

export interface PosicaoFechada {
  id: string;
  vaga_id: string;
  numero_vaga: string;
  cargo: string;
  empresa_id: string;
  empresa_nome: string;
  empresa_email: string;
  consultor_id: string;
  consultor_nome: string;
  data_recebimento: string;
  data_encerramento: string;
  status_posicao: 'em_analise' | 'em_entrevista' | 'em_entrevista_final' | 'aprovado' | 'contratado' | 'desistiu';
  candidatos_aprovados: Array<{
    id: string;
    nome: string;
    email: string;
    data_aprovacao: string;
    pretensao_salarial?: number;
    regime_trabalho?: string;
  }>;
  total_days: number;
  observacoes?: string;
  created_at: string;
}

export interface CurriculoAtualizado {
  id: string;
  posicao_fechada_id: string;
  candidato_id: string;
  candidato_nome: string;
  curriculo_original_url?: string;
  curriculo_atualizado_url: string;
  curriculo_atualizado_nome: string;
  pretensao_salarial?: number;
  regime_trabalho?: 'CLT' | 'PJ' | 'Temporário';
  observacoes?: string;
  created_at: string;
}

export interface HistoricoEmail {
  id: string;
  posicao_fechada_id: string;
  destinatario_email: string;
  assunto: string;
  corpo_email: string;
  anexos: any[];
  status_envio: string;
  data_envio: string;
  created_at: string;
}

export interface Contratacao {
  id: string;
  posicao_fechada_id: string;
  candidato_id: string;
  candidato_nome: string;
  candidato_email: string;
  data_contratacao: string;
  salario_acordado?: number;
  regime_contratacao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface PosicoesFechadasFilters {
  consultor_id?: string;
  empresa_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export class PosicoesFechadasService {
  static async list(filters?: PosicoesFechadasFilters): Promise<PosicaoFechada[]> {
    try {
      // Usar consulta direta em vez da RPC function
      let query = supabase
        .from('posicoes_fechadas')
        .select('*')
        .order('data_encerramento', { ascending: false });

      // Aplicar filtros
      if (filters?.consultor_id) {
        query = query.eq('consultor_id', filters.consultor_id);
      }
      if (filters?.empresa_id) {
        query = query.eq('empresa_id', filters.empresa_id);
      }
      if (filters?.data_inicio) {
        query = query.gte('data_encerramento', filters.data_inicio);
      }
      if (filters?.data_fim) {
        query = query.lte('data_encerramento', filters.data_fim);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro na consulta:', error);
        throw new Error(`Erro na consulta: ${error.message}`);
      }

      // Converter para o formato esperado
      const posicoesFechadas: PosicaoFechada[] = (data || []).map((item: any) => ({
        id: item.id,
        vaga_id: item.vaga_id,
        numero_vaga: item.numero_vaga,
        cargo: item.cargo,
        empresa_id: item.empresa_id,
        empresa_nome: item.empresa_nome,
        empresa_email: item.empresa_email,
        consultor_id: item.consultor_id,
        consultor_nome: item.consultor_nome,
        data_recebimento: item.data_recebimento,
        data_encerramento: item.data_encerramento,
        status_posicao: item.status_posicao,
        candidatos_aprovados: item.candidatos_aprovados || [],
        total_days: item.data_recebimento && item.data_encerramento 
          ? Math.floor((new Date(item.data_encerramento).getTime() - new Date(item.data_recebimento).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        observacoes: item.observacoes,
        created_at: item.created_at
      }));

      return posicoesFechadas;
    } catch (error) {
      console.error('Erro ao buscar posições fechadas:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<PosicaoFechada> {
    try {
      const { data, error } = await supabase
        .from('posicoes_fechadas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar posição fechada:', error);
      throw error;
    }
  }

  static async processVaga(vagaId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('posicoes-fechadas/process-vaga', {
        body: { vaga_id: vagaId }
      });

      if (error) throw error;
      return data.posicao_fechada_id;
    } catch (error) {
      console.error('Erro ao processar vaga:', error);
      throw error;
    }
  }

  static async uploadCurriculo(
    posicaoId: string,
    candidatoId: string,
    candidatoNome: string,
    file: File,
    pretensaoSalarial?: number,
    regimeTrabalho?: string,
    observacoes?: string
  ): Promise<CurriculoAtualizado> {
    try {
      const formData = new FormData();
      formData.append('posicao_id', posicaoId);
      formData.append('candidato_id', candidatoId);
      formData.append('candidato_nome', candidatoNome);
      formData.append('file', file);
      if (pretensaoSalarial) formData.append('pretensao_salarial', pretensaoSalarial.toString());
      if (regimeTrabalho) formData.append('regime_trabalho', regimeTrabalho);
      if (observacoes) formData.append('observacoes', observacoes);

      const { data, error } = await supabase.functions.invoke('posicoes-fechadas/upload-curriculo', {
        body: formData
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao fazer upload do currículo:', error);
      throw error;
    }
  }

  static async getCurriculosAtualizados(posicaoId: string): Promise<CurriculoAtualizado[]> {
    try {
      const { data, error } = await supabase
        .from('curriculos_atualizados')
        .select('*')
        .eq('posicao_fechada_id', posicaoId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar currículos atualizados:', error);
      throw error;
    }
  }

  static async deleteCurriculo(curriculoId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('posicoes-fechadas/delete-curriculo', {
        body: { id: curriculoId }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar currículo:', error);
      throw error;
    }
  }

  static async enviarEmail(
    posicaoId: string,
    assunto: string,
    corpoEmail: string,
    destinatario: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('posicoes-fechadas/enviar-email', {
        body: {
          posicao_id: posicaoId,
          assunto,
          corpo_email: corpoEmail,
          destinatario_email: destinatario
        }
      });

      if (error) throw error;
      return data.historico_id;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  static async getHistoricoEmails(posicaoId: string): Promise<HistoricoEmail[]> {
    try {
      const { data, error } = await supabase
        .from('historico_emails_posicoes')
        .select('*')
        .eq('posicao_fechada_id', posicaoId)
        .order('data_envio', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de emails:', error);
      throw error;
    }
  }

  static async updateStatus(posicaoId: string, status: PosicaoFechada['status_posicao']): Promise<PosicaoFechada> {
    try {
      const { data, error } = await supabase.functions.invoke('posicoes-fechadas/update-status', {
        body: {
          id: posicaoId,
          status_posicao: status
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  static async registrarContratacao(
    posicaoId: string,
    candidatoId: string,
    dataContratacao: string,
    salarioAcordado?: number,
    regimeContratacao?: string,
    observacoes?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('registrar_contratacao', {
        p_posicao_fechada_id: posicaoId,
        p_candidato_id: candidatoId,
        p_data_contratacao: dataContratacao,
        p_salario_acordado: salarioAcordado,
        p_regime_contratacao: regimeContratacao,
        p_observacoes: observacoes
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao registrar contratação:', error);
      throw error;
    }
  }

  static async getContratacoes(posicaoId: string): Promise<Contratacao[]> {
    try {
      const { data, error } = await supabase
        .from('contratacoes')
        .select('*')
        .eq('posicao_fechada_id', posicaoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contratações:', error);
      throw error;
    }
  }

  static async exportToExcel(filters?: PosicoesFechadasFilters): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('export_posicoes_fechadas_csv', {
        p_consultor_id: filters?.consultor_id || null,
        p_empresa_id: filters?.empresa_id || null,
        p_data_inicio: filters?.data_inicio || null,
        p_data_fim: filters?.data_fim || null
      });

      if (error) {
        console.error('Erro na RPC export function:', error);
        throw new Error(`Erro na exportação: ${error.message}`);
      }

      // Criar blob com o CSV
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'posicoes-fechadas.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar posições fechadas:', error);
      throw error;
    }
  }
} 