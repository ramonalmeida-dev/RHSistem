import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Filter, 
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
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CandidatosAprovadosModal } from "@/components/relatorios/CandidatosAprovadosModal";
import { toast } from "sonner";
import { PosicoesFechadasService, PosicaoFechada, PosicoesFechadasFilters } from "@/lib/posicoesFechadasService";


// Removido código mock - agora usando dados reais do backend

const PosicoesFechadas = () => {
  const [posicoesFechadas, setPosicoesFechadas] = useState<PosicaoFechada[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PosicoesFechadasFilters>({});
  const [selectedVaga, setSelectedVaga] = useState<{
    id: string;
    numero_vaga: string;
    cargo: string;
  empresa: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await PosicoesFechadasService.list(filters);
      setPosicoesFechadas(data);
    } catch (error) {
      console.error('Erro ao carregar posições fechadas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await PosicoesFechadasService.exportToExcel(filters);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const handleViewCandidatos = (posicao: PosicaoFechada) => {
    setSelectedVaga({
      id: posicao.id,
      numero_vaga: posicao.numero_vaga.toString(),
      cargo: posicao.cargo,
      empresa: posicao.empresa_nome
    });
    setModalOpen(true);
  };

  const getCandidatosAprovados = (posicao: PosicaoFechada) => {
    return posicao.candidatos_aprovados.map(candidato => ({
      id: candidato.id,
      nome: candidato.nome,
      nome_abreviado: candidato.nome.split(' ').map(n => n[0]).join('.') + '. ' + candidato.nome.split(' ').slice(-1)[0],
      data_aprovacao: candidato.data_aprovacao,
      status: 'aprovado' as const,
      vaga_id: posicao.id,
      vaga_numero: posicao.numero_vaga.toString(),
      vaga_cargo: posicao.cargo,
      empresa_nome: posicao.empresa_nome
    }));
  };

  // Estatísticas
  const totalPosicoes = posicoesFechadas.length;
  const totalAprovados = posicoesFechadas.filter(p => p.candidatos_aprovados.length > 0).length;
  const totalSemAprovados = posicoesFechadas.filter(p => p.candidatos_aprovados.length === 0).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resumo de Posições Fechadas</h1>
            <p className="text-muted-foreground">
              Relatório de vagas finalizadas e seus resultados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button 
              className="bg-gradient-primary hover:opacity-90"
              onClick={handleExportExcel}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
              <Download className="mr-2 h-4 w-4" />
              )}
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{totalPosicoes}</div>
              <p className="text-sm text-muted-foreground">Total Fechadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{totalAprovados}</div>
              <p className="text-sm text-muted-foreground">Com Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{totalSemAprovados}</div>
              <p className="text-sm text-muted-foreground">Sem Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  posicoesFechadas.reduce((sum, posicao) => 
                    sum + posicao.candidatos_aprovados.length, 0
                  )
                )}
              </div>
              <p className="text-sm text-muted-foreground">Total Candidatos Aprovados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Consultor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Consultores</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Empresas</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Períodos</SelectItem>
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posições Fechadas Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Posições Fechadas
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando dados...</span>
              </div>
            ) : posicoesFechadas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma posição fechada encontrada
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Vaga</th>
                    <th className="text-left p-3 font-medium">Empresa</th>
                      <th className="text-left p-3 font-medium">Consultor</th>
                    <th className="text-left p-3 font-medium">Período</th>
                      <th className="text-left p-3 font-medium">Candidatos Aprovados</th>
                      <th className="text-left p-3 font-medium">Dias</th>
                    <th className="text-left p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                    {posicoesFechadas.map((posicao) => (
                    <tr key={posicao.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                            <div className="font-medium">{posicao.cargo}</div>
                            <div className="text-sm text-muted-foreground">#{posicao.numero_vaga}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{posicao.empresa_nome}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{posicao.consultor_nome}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="text-sm">
                              {new Date(posicao.data_recebimento).toLocaleDateString('pt-BR')} - {new Date(posicao.data_encerramento).toLocaleDateString('pt-BR')}
                          </div>
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
                          <Badge variant="outline">{posicao.total_days} dias</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                            {posicao.candidatos_aprovados.length > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewCandidatos(posicao)}
                                title="Ver candidatos aprovados"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
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



        {/* Modal de Candidatos Aprovados */}
        <CandidatosAprovadosModal
          vaga={selectedVaga}
          candidatos={selectedVaga ? getCandidatosAprovados(posicoesFechadas.find(p => p.id === selectedVaga.id)!) : []}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    </MainLayout>
  );
};

export default PosicoesFechadas; 