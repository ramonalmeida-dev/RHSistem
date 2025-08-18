import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  Calendar, 
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { CandidaturaExternaWithVaga } from '../../../supabase/types';

interface CandidaturasCardProps {
  candidaturas: CandidaturaExternaWithVaga[];
  loading?: boolean;
}

export const CandidaturasCard: React.FC<CandidaturasCardProps> = ({
  candidaturas,
  loading = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4" />;
      case 'reprovado':
        return <XCircle className="h-4 w-4" />;
      case 'em_analise':
      case 'pendente':
        return <Clock className="h-4 w-4" />;
      case 'entrevista_agendada':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reprovado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'em_analise':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'entrevista_agendada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado': return 'Aprovado';
      case 'reprovado': return 'Reprovado';
      case 'em_analise': return 'Em análise';
      case 'pendente': return 'Pendente';
      case 'entrevista_agendada': return 'Entrevista agendada';
      default: return status;
    }
  };

  const getRecentCandidaturas = () => {
    return candidaturas
      .sort((a, b) => new Date(b.data_candidatura).getTime() - new Date(a.data_candidatura).getTime())
      .slice(0, 5);
  };

  const getStatusStats = () => {
    const stats = candidaturas.reduce((acc, candidatura) => {
      const status = candidatura.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: candidaturas.length,
      pendentes: (stats.pendente || 0) + (stats.em_analise || 0),
      aprovados: stats.aprovado || 0,
      reprovados: stats.reprovado || 0
    };
  };

  const stats = getStatusStats();

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Minhas Candidaturas</span>
            </CardTitle>
            <CardDescription>
              Acompanhe o status das suas aplicações
            </CardDescription>
          </div>
        </div>

        {/* Estatísticas */}
        {candidaturas.length > 0 && (
          <div className="grid grid-cols-4 gap-3 pt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.pendentes}</div>
              <div className="text-xs text-gray-500">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.aprovados}</div>
              <div className="text-xs text-gray-500">Aprovados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.reprovados}</div>
              <div className="text-xs text-gray-500">Reprovados</div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando candidaturas...</p>
          </div>
        ) : candidaturas.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma candidatura ainda
            </h3>
                                <p className="text-gray-600 mb-4 text-sm">
                      Você ainda não se candidatou a nenhuma vaga.<br />
                      Aguarde novas oportunidades serem compartilhadas com você.
                    </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getRecentCandidaturas().map((candidatura) => (
              <div 
                key={candidatura.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900 text-base">
                        {candidatura.vaga.cargo}
                      </h4>
                      <Badge className={`border ${getStatusColor(candidatura.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(candidatura.status)}
                          <span className="text-xs font-medium">
                            {getStatusText(candidatura.status)}
                          </span>
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{candidatura.vaga.empresa_nome || 'Empresa não informada'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Vaga {candidatura.vaga.numero_vaga}</span>
                      </div>


                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          <strong>Candidatura:</strong> {new Date(candidatura.data_candidatura).toLocaleDateString('pt-BR')}
                        </span>
                        {candidatura.observacoes && (
                          <span className="text-blue-600 cursor-pointer hover:underline" title={candidatura.observacoes}>
                            Ver observações
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {candidaturas.length > 5 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500 mb-3">
                  Mostrando 5 de {candidaturas.length} candidaturas
                </p>
                <Button variant="outline" size="sm">
                  Ver todas as candidaturas
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 