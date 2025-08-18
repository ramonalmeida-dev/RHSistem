import React from 'react';
import { Card, CardContent } from '../ui/card';
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import { CandidaturaExternaWithVaga } from '../../../supabase/types';

interface DashboardStatsProps {
  candidaturas: CandidaturaExternaWithVaga[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ candidaturas }) => {
  const getStats = () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const statusCount = candidaturas.reduce((acc, candidatura) => {
      const status = candidatura.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const thisMonthApplications = candidaturas.filter(candidatura => 
      new Date(candidatura.data_candidatura) >= thisMonth
    ).length;

    const successRate = candidaturas.length > 0 
      ? Math.round(((statusCount.aprovado || 0) / candidaturas.length) * 100) 
      : 0;

    return {
      total: candidaturas.length,
      thisMonth: thisMonthApplications,
      approved: statusCount.aprovado || 0,
      pending: (statusCount.pendente || 0) + (statusCount.em_analise || 0),
      successRate
    };
  };

  const stats = getStats();

  const statCards = [
    {
      title: 'Total de Candidaturas',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Todas as suas aplicações'
    },
    {
      title: 'Este Mês',
      value: stats.thisMonth,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Candidaturas recentes'
    },
    {
      title: 'Aprovados',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Processos bem-sucedidos'
    },
    {
      title: 'Em Análise',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Aguardando resposta'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
              <div className={`h-12 w-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>

            {/* Taxa de sucesso só no card de aprovados */}
            {stat.title === 'Aprovados' && stats.total > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {stats.successRate}% taxa de sucesso
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 