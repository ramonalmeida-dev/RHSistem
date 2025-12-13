import { supabase } from './supabase';

export interface DashboardStats {
  totalVagas: number;
  vagasAtivas: number;
  vagasPublicadas: number;
  vagasEmAnalise: number;
  totalCandidatos: number;
  candidatosEmProcesso: number;
  candidatosAprovados: number;
  totalCurriculos: number;
  curriculosDisponiveis: number;
  totalClientes: number;
  faturamentoMensal: number;
  metaFaturamento: number;
  trends: {
    vagas: number;
    candidatos: number;
    curriculos: number;
    clientes: number;
  };
}

export interface RecentActivityItem {
  id: string;
  type: "candidato_enviado" | "vaga_criada" | "cliente_cadastrado" | "processo_finalizado" | "curriculo_adicionado";
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
  status?: "success" | "warning" | "info";
}

export interface StatusStats {
  status: string;
  count: number;
  color: string;
}

export interface AreaStats {
  area: string;
  count: number;
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Estatísticas de vagas por status
      const { data: vagasData } = await supabase
        .from('vagas')
        .select('status, created_at');

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalVagas = vagasData?.length || 0;
      const vagasPublicadas = vagasData?.filter(v => v.status === 'publicada').length || 0;
      const vagasEmAnalise = vagasData?.filter(v => v.status === 'em_analise').length || 0;
      const vagasAtivas = vagasPublicadas + vagasEmAnalise;

      // Calcular tendência de vagas
      const vagasThisMonth = vagasData?.filter(v => new Date(v.created_at) >= currentMonth).length || 0;
      const vagasLastMonth = vagasData?.filter(v => 
        new Date(v.created_at) >= lastMonth && new Date(v.created_at) < currentMonth
      ).length || 0;
      const vagasTrend = vagasLastMonth > 0 ? ((vagasThisMonth - vagasLastMonth) / vagasLastMonth) * 100 : 0;

      // Estatísticas de candidatos
      const { data: candidatosData } = await supabase
        .from('candidatos')
        .select('created_at')
        .is('deleted_at', null);

      const totalCandidatos = candidatosData?.length || 0;

      // Candidatos em processo
      const { data: candidatosVagasData } = await supabase
        .from('candidatos_vagas')
        .select('status_atual, created_at');

      const candidatosEmProcesso = candidatosVagasData?.filter(cv => 
        !['aprovado', 'reprovado'].includes(cv.status_atual)
      ).length || 0;

      const candidatosAprovados = candidatosVagasData?.filter(cv => 
        cv.status_atual === 'aprovado'
      ).length || 0;

      // Tendência de candidatos
      const candidatosThisMonth = candidatosData?.filter(c => new Date(c.created_at) >= currentMonth).length || 0;
      const candidatosLastMonth = candidatosData?.filter(c => 
        new Date(c.created_at) >= lastMonth && new Date(c.created_at) < currentMonth
      ).length || 0;
      const candidatosTrend = candidatosLastMonth > 0 ? ((candidatosThisMonth - candidatosLastMonth) / candidatosLastMonth) * 100 : 0;

      // Estatísticas de currículos
      const { data: curriculosData } = await supabase
        .from('banco_curriculos')
        .select('disponibilidade, created_at');

      const totalCurriculos = curriculosData?.length || 0;
      const curriculosDisponiveis = curriculosData?.filter(c => 
        c.disponibilidade === 'disponivel'
      ).length || 0;

      // Tendência de currículos
      const curriculosThisMonth = curriculosData?.filter(c => new Date(c.created_at) >= currentMonth).length || 0;
      const curriculosLastMonth = curriculosData?.filter(c => 
        new Date(c.created_at) >= lastMonth && new Date(c.created_at) < currentMonth
      ).length || 0;
      const curriculosTrend = curriculosLastMonth > 0 ? ((curriculosThisMonth - curriculosLastMonth) / curriculosLastMonth) * 100 : 0;

      // Estatísticas de clientes
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('ativo, created_at')
        .eq('ativo', true);

      const totalClientes = clientesData?.length || 0;

      // Tendência de clientes
      const clientesThisMonth = clientesData?.filter(c => new Date(c.created_at) >= currentMonth).length || 0;
      const clientesLastMonth = clientesData?.filter(c => 
        new Date(c.created_at) >= lastMonth && new Date(c.created_at) < currentMonth
      ).length || 0;
      const clientesTrend = clientesLastMonth > 0 ? ((clientesThisMonth - clientesLastMonth) / clientesLastMonth) * 100 : 0;

      // Calcular faturamento real
      const { data: contasData } = await supabase
        .from('contas_receber')
        .select('valor, status, data_vencimento, data_pagamento')
        .gte('data_vencimento', currentMonth.toISOString().split('T')[0])
        .lt('data_vencimento', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]);

      const faturamentoMensal = contasData?.reduce((total, conta) => {
        if (conta.status === 'pago') {
          return total + parseFloat(conta.valor);
        }
        return total;
      }, 0) || 0;

      return {
        totalVagas,
        vagasAtivas,
        vagasPublicadas,
        vagasEmAnalise,
        totalCandidatos,
        candidatosEmProcesso,
        candidatosAprovados,
        totalCurriculos,
        curriculosDisponiveis,
        totalClientes,
        faturamentoMensal,
        metaFaturamento: 100000,
        trends: {
          vagas: Math.round(vagasTrend),
          candidatos: Math.round(candidatosTrend),
          curriculos: Math.round(curriculosTrend),
          clientes: Math.round(clientesTrend)
        }
      };
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      throw error;
    }
  }

  static async getRecentActivities(): Promise<RecentActivityItem[]> {
    try {
      const activities: RecentActivityItem[] = [];

      // Buscar vagas recentes com consultor
      const { data: vagasRecentes } = await supabase
        .from('vagas')
        .select('cargo, created_at, consultor_id, empresa:clientes(razao_social), consultor:usuarios(nome)')
        .order('created_at', { ascending: false })
        .limit(3);

      // Buscar nomes dos consultores para as vagas
      const consultoresPromises = (vagasRecentes || []).map(async (vaga: any) => {
        let consultorNome = 'Sistema';
        
        if (vaga.consultor?.nome) {
          consultorNome = vaga.consultor.nome;
        } else if (vaga.consultor_id) {
          // Buscar consultor diretamente
          const { data: consultorData } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', vaga.consultor_id)
            .single();
          
          if (consultorData?.nome) {
            consultorNome = consultorData.nome;
          }
        }

        return {
          vaga,
          consultorNome
        };
      });

      const vagasComConsultores = await Promise.all(consultoresPromises);

      vagasComConsultores.forEach(({ vaga, consultorNome }) => {
        activities.push({
          id: `vaga-${vaga.cargo}`,
          type: 'vaga_criada',
          title: 'Nova vaga cadastrada',
          description: `${vaga.cargo} - ${vaga.empresa?.razao_social || 'Empresa não informada'}`,
          timestamp: new Date(vaga.created_at),
          user: { name: consultorNome },
          status: 'info'
        });
      });

      // Buscar currículos recentes
      // Nota: banco_curriculos não tem campo de usuário que criou, então usamos "Sistema"
      // ou podemos buscar através de histórico se disponível
      const { data: curriculosRecentes } = await supabase
        .from('banco_curriculos')
        .select('candidato:candidatos(nome), created_at, area_atuacao')
        .order('created_at', { ascending: false })
        .limit(3);

      curriculosRecentes?.forEach((curriculo: any) => {
        // Como banco_curriculos não tem campo de usuário, usamos "Sistema"
        // Se no futuro houver histórico ou campo created_by, podemos atualizar aqui
        activities.push({
          id: `curriculo-${curriculo.candidato?.nome}`,
          type: 'curriculo_adicionado',
          title: 'Currículo adicionado ao banco',
          description: `${curriculo.candidato?.nome} - ${curriculo.area_atuacao || 'Cargo não informado'}`,
          timestamp: new Date(curriculo.created_at),
          user: { name: 'Sistema' },
          status: 'success'
        });
      });

      // Ordenar por timestamp e pegar os 5 mais recentes
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
      return [];
    }
  }

  static async getCandidatoStatusStats(): Promise<StatusStats[]> {
    try {
      const { data: statusData } = await supabase
        .from('candidatos_vagas')
        .select('status_atual');

      if (!statusData) return [];

      const statusCounts: { [key: string]: number } = {};
      
      statusData.forEach((item: any) => {
        const status = item.status_atual;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusColors: { [key: string]: string } = {
        'selecionando': 'bg-blue-500',
        'curriculo_enviado': 'bg-purple-500',
        'entrevista_agendada': 'bg-yellow-500',
        'entrevista_realizada': 'bg-orange-500',
        'aprovado': 'bg-green-500',
        'reprovado': 'bg-red-500',
        'desistiu': 'bg-gray-500'
      };

      const statusNames: { [key: string]: string } = {
        'selecionando': 'Em seleção',
        'curriculo_enviado': 'CV Enviado',
        'entrevista_agendada': 'Entrevista na empresa',
        'entrevista_realizada': 'Entrevista Realizada',
        'aprovado': 'Aprovado',
        'reprovado': 'Reprovado',
        'desistiu': 'Desistiu'
      };

      return Object.entries(statusCounts)
        .map(([status, count]) => ({ 
          status: statusNames[status] || status, 
          count, 
          color: statusColors[status] || 'bg-gray-500'
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de status:', error);
      return [];
    }
  }

  static async getAreasStats(): Promise<AreaStats[]> {
    try {
      const { data: areasData } = await supabase
        .from('banco_curriculos')
        .select('area_atuacao')
        .not('area_atuacao', 'is', null);

      if (!areasData) return [];

      const areaCounts: { [key: string]: number } = {};
      
      areasData.forEach((item: any) => {
        const area = item.area_atuacao || 'Não informada';
        areaCounts[area] = (areaCounts[area] || 0) + 1;
      });

      return Object.entries(areaCounts)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao carregar estatísticas por área:', error);
      return [];
    }
  }
} 