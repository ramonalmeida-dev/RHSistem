import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_SUPABASE_URL;

export interface CandidatoAprovado {
  id: string;
  nome: string;
  nome_abreviado: string;
  data_aprovacao: string;
  status: 'aprovado' | 'contratado' | 'em_processo';
  vaga_id: string;
  vaga_numero: string;
  vaga_cargo: string;
  empresa_nome: string;
}

export class CandidatosAprovadosService {
  static async getCandidatosAprovados(vagaId: string): Promise<CandidatoAprovado[]> {
    try {
      const response = await fetch(`${API_URL}/functions/v1/candidatos-aprovados/${vagaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar candidatos aprovados');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar candidatos aprovados:', error);
      throw error;
    }
  }

  static async exportToExcel(candidatos: CandidatoAprovado[], vagaNumero: string): Promise<void> {
    try {
      // Criar dados no formato da imagem
      const dados = candidatos.map((candidato, index) => ({
        numero: index + 1,
        nome_abreviado: candidato.nome_abreviado,
        data: new Date(candidato.data_aprovacao).toLocaleDateString('pt-BR'),
        status: candidato.status === 'contratado' ? 'Contratado' : 'Aprovado'
      }));

      // Criar conteúdo do Excel
      const headers = ['Número', 'Nome abreviado:', 'data:', '* Status'];
      const rows = dados.map(item => [
        item.numero,
        item.nome_abreviado,
        item.data,
        item.status
      ]);

      // Criar CSV (formato mais simples para Excel)
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `candidatos-aprovados-${vagaNumero}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      throw error;
    }
  }
} 