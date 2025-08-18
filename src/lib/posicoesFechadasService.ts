import { supabase } from './supabase';

export interface PosicaoFechada {
  id: string;
  numero_vaga: number;
  data_recebimento: string;
  consultor_id: string;
  consultor_nome: string;
  empresa_id: string;
  empresa_nome: string;
  cargo: string;
  salario: number;
  candidatos_aprovados: Array<{
    id: string;
    nome: string;
    data_aprovacao: string;
    data_admissao?: string;
    salario_contratado?: number;
  }>;
  data_encerramento: string;
  total_days: number;
  nota_fiscal_numero?: string;
  comissao?: number;
  valor_bruto?: number;
  impostos_federais?: number;
  impostos_estaduais?: number;
  iss_municipal?: number;
  valor_liquido?: number;
  data_vencimento?: string;
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
      const { data, error } = await supabase.rpc('get_posicoes_fechadas', {
        p_consultor_id: filters?.consultor_id || null,
        p_empresa_id: filters?.empresa_id || null,
        p_data_inicio: filters?.data_inicio || null,
        p_data_fim: filters?.data_fim || null
      });

      if (error) {
        console.error('Erro na RPC function:', error);
        throw new Error(`Erro na consulta: ${error.message}`);
      }

      // Converter os dados para o formato esperado
      const posicoesFechadas: PosicaoFechada[] = data.map((item: any) => ({
        id: item.id,
        numero_vaga: parseInt(item.numero_vaga) || 0,
        data_recebimento: item.data_recebimento,
        consultor_id: item.consultor_id,
        consultor_nome: item.consultor_nome || 'N/A',
        empresa_id: item.empresa_id,
        empresa_nome: item.empresa_nome || 'N/A',
        cargo: item.cargo,
        salario: parseFloat(item.salario) || 0,
        candidatos_aprovados: item.candidatos_aprovados || [],
        data_encerramento: item.data_encerramento,
        total_days: item.total_days || 0
      }));

      return posicoesFechadas;
    } catch (error) {
      console.error('Erro ao buscar posições fechadas:', error);
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
      a.download = 'posicoes-aprovadas.csv';
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