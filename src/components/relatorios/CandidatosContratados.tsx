import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  UserCheck, 
  Calendar, 
  DollarSign, 
  Building2,
  Mail,
  Phone,
  FileText,
  CheckCircle
} from "lucide-react";
import { PosicaoFechada, PosicoesFechadasService, Contratacao } from "@/lib/posicoesFechadasService";

interface CandidatosContratadosProps {
  posicao: PosicaoFechada;
  onRefresh: () => void;
}

export const CandidatosContratados = ({ posicao, onRefresh }: CandidatosContratadosProps) => {
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContratacoes();
  }, [posicao.id]);

  const loadContratacoes = async () => {
    setLoading(true);
    try {
      const data = await PosicoesFechadasService.getContratacoes(posicao.id);
      setContratacoes(data);
    } catch (error) {
      console.error('Erro ao carregar contratações:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações da Vaga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Vaga Finalizada - {posicao.cargo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Número da Vaga</p>
              <p className="text-lg font-semibold">{posicao.numero_vaga}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Empresa</p>
              <p className="text-lg font-semibold">{posicao.empresa_nome}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Consultor</p>
              <p className="text-lg font-semibold">{posicao.consultor_nome}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Encerramento</p>
              <p className="text-lg font-semibold">
                {new Date(posicao.data_encerramento).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Finalizada
            </Badge>
            <Badge variant="outline">
              {contratacoes.length} candidato(s) contratado(s)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Candidatos Contratados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Candidatos Contratados ({contratacoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contratacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum candidato contratado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contratacoes.map((contratacao) => (
                <Card key={contratacao.id} className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        {/* Informações do Candidato */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                            <UserCheck className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-800">
                              {contratacao.candidato_nome}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Mail className="h-3 w-3" />
                              {contratacao.candidato_email}
                            </div>
                          </div>
                        </div>

                        {/* Detalhes da Contratação */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-green-700 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Data de Contratação
                            </p>
                            <p className="text-green-600">
                              {new Date(contratacao.data_contratacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          
                          {contratacao.salario_acordado && (
                            <div>
                              <p className="font-medium text-green-700 flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Salário Acordado
                              </p>
                              <p className="text-green-600">
                                R$ {contratacao.salario_acordado.toLocaleString('pt-BR')}
                              </p>
                            </div>
                          )}
                          
                          {contratacao.regime_contratacao && (
                            <div>
                              <p className="font-medium text-green-700 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Regime
                              </p>
                              <p className="text-green-600">{contratacao.regime_contratacao}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-green-700 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Registrado em
                            </p>
                            <p className="text-green-600">
                              {new Date(contratacao.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        {/* Observações */}
                        {contratacao.observacoes && (
                          <div>
                            <p className="font-medium text-green-700 text-sm mb-1">Observações:</p>
                            <p className="text-green-600 text-sm bg-green-100 p-2 rounded">
                              {contratacao.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo da Posição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo da Posição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-700">Candidatos Aprovados</p>
              <p className="text-2xl font-bold text-blue-800">
                {posicao.candidatos_aprovados.length}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-700">Candidatos Contratados</p>
              <p className="text-2xl font-bold text-green-800">
                {contratacoes.length}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700">Taxa de Contratação</p>
              <p className="text-2xl font-bold text-gray-800">
                {posicao.candidatos_aprovados.length > 0 
                  ? Math.round((contratacoes.length / posicao.candidatos_aprovados.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 