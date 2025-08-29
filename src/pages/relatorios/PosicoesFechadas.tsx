import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  DollarSign,
  Eye,
  UserCheck,
  Loader2,
  Clock,
  Mail
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PosicaoFechadaModal } from "@/components/relatorios/PosicaoFechadaModal";
import { ContratacaoModal } from "@/components/relatorios/ContratacaoModal";
import { toast } from "sonner";
import { PosicoesFechadasService, PosicaoFechada, PosicoesFechadasFilters } from "@/lib/posicoesFechadasService";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

const STATUS_COLORS = {
  em_analise: "bg-yellow-100 text-yellow-800",
  em_entrevista: "bg-blue-100 text-blue-800",
  em_entrevista_final: "bg-purple-100 text-purple-800",
  aprovado: "bg-green-100 text-green-800",
  contratado: "bg-emerald-100 text-emerald-800",
  desistiu: "bg-red-100 text-red-800"
};

const STATUS_LABELS = {
  em_analise: "Em Análise",
  em_entrevista: "Em Entrevista",
  em_entrevista_final: "Em Entrevista Final",
  aprovado: "Aprovado",
  contratado: "Contratado",
  desistiu: "Desistiu"
};

const PosicoesFechadas = () => {
  const { usuario } = useAuth();
  const { isConsultor, podeVerTodasPosicoesFechadas } = usePermissions();
  
  const [posicoesFechadas, setPosicoesFechadas] = useState<PosicaoFechada[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PosicoesFechadasFilters>({});
  const [selectedPosicao, setSelectedPosicao] = useState<PosicaoFechada | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contratacaoModalOpen, setContratacaoModalOpen] = useState(false);
  const [posicaoParaContratacao, setPosicaoParaContratacao] = useState<PosicaoFechada | null>(null);

  useEffect(() => {
    loadPosicoesFechadas();
  }, [filters]);

  const loadPosicoesFechadas = async () => {
    setLoading(true);
    try {
      // Se for consultor e não tiver permissão para ver todas as posições, filtrar por consultor_id
      const filtersToApply = { ...filters };
      if (isConsultor() && !podeVerTodasPosicoesFechadas() && usuario?.id) {
        filtersToApply.consultor_id = usuario.id;
      }
      
      const data = await PosicoesFechadasService.list(filtersToApply);
      setPosicoesFechadas(data);
    } catch (error) {
      console.error('Erro ao carregar posições fechadas:', error);
      toast.error('Erro ao carregar posições fechadas');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPosicao = (posicao: PosicaoFechada) => {
    setSelectedPosicao(posicao);
    setModalOpen(true);
  };

  const handleContratacao = (posicao: PosicaoFechada) => {
    setPosicaoParaContratacao(posicao);
    setContratacaoModalOpen(true);
  };

  const handleExportExcel = async () => {
    try {
      // Se for consultor e não tiver permissão para ver todas as posições, filtrar por consultor_id
      const filtersToApply = { ...filters };
      if (isConsultor() && !podeVerTodasPosicoesFechadas() && usuario?.id) {
        filtersToApply.consultor_id = usuario.id;
      }
      
      await PosicoesFechadasService.exportToExcel(filtersToApply);
      toast.success('Exportação realizada com sucesso!');
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  // Estatísticas
  const totalPosicoes = posicoesFechadas.length;
  const totalAprovados = posicoesFechadas.reduce((acc, p) => acc + p.candidatos_aprovados.length, 0);
  const totalEmAnalise = posicoesFechadas.filter(p => p.status_posicao === 'em_analise').length;
  const totalEmEntrevista = posicoesFechadas.filter(p => p.status_posicao === 'em_entrevista').length;
  const totalContratados = posicoesFechadas.filter(p => p.status_posicao === 'contratado').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Posições Fechadas</h1>
            <p className="text-muted-foreground">
              Gerenciamento de vagas finalizadas com candidatos aprovados
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-gradient-primary hover:opacity-90"
              onClick={handleExportExcel}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Posições</p>
                  <p className="text-2xl font-bold">{totalPosicoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Candidatos Aprovados</p>
                  <p className="text-2xl font-bold">{totalAprovados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Em Análise</p>
                  <p className="text-2xl font-bold">{totalEmAnalise}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Em Entrevista</p>
                  <p className="text-2xl font-bold">{totalEmEntrevista}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Contratados</p>
                  <p className="text-2xl font-bold">{totalContratados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Posições Fechadas */}
        <Card>
          <CardHeader>
            <CardTitle>Posições Fechadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : posicoesFechadas.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma posição fechada encontrada</p>
                <p className="text-sm text-muted-foreground">
                  As posições fechadas aparecerão aqui quando houver candidatos aprovados
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Vaga</th>
                      <th className="text-left p-3 font-medium">Empresa</th>
                      <th className="text-left p-3 font-medium">Consultor</th>
                      <th className="text-left p-3 font-medium">Data Encerramento</th>
                      <th className="text-left p-3 font-medium">Candidatos Aprovados</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posicoesFechadas.map((posicao) => (
                      <tr key={posicao.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{posicao.numero_vaga}</p>
                            <p className="text-sm text-muted-foreground">{posicao.cargo}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm">{posicao.empresa_nome}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-sm">{posicao.consultor_nome}</p>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">
                              {new Date(posicao.data_encerramento).toLocaleDateString('pt-BR')}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              {posicao.total_days} dias
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="text-sm">
                              {posicao.candidatos_aprovados.length} aprovado(s)
                            </span>
                          </div>
                          {posicao.candidatos_aprovados.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {posicao.candidatos_aprovados.map(c => c.nome).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge className={STATUS_COLORS[posicao.status_posicao]}>
                            {STATUS_LABELS[posicao.status_posicao]}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewPosicao(posicao)}
                              title="Gerenciar posição"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {posicao.status_posicao !== 'contratado' && posicao.candidatos_aprovados.length > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleContratacao(posicao)}
                                title="Registrar contratação"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Gerenciamento */}
        <PosicaoFechadaModal
          posicao={selectedPosicao}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onRefresh={loadPosicoesFechadas}
        />



        {/* Modal de Contratação */}
        <ContratacaoModal
          posicao={posicaoParaContratacao}
          open={contratacaoModalOpen}
          onOpenChange={setContratacaoModalOpen}
          onRefresh={loadPosicoesFechadas}
        />
      </div>
    </MainLayout>
  );
};

export default PosicoesFechadas; 