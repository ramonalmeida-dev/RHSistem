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
  Mail,
  Download,
  Filter,
  Search
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { StatusVagasService, VagaStatusRelatorio, StatusVagasFilters, CandidatoStatusVaga } from "@/lib/statusVagasService";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusVagaModal } from "@/components/relatorios/StatusVagaModal";

const STATUS_COLORS = {
  AGUARDANDO: "bg-yellow-100 text-yellow-800",
  NAO_APROVADO: "bg-red-100 text-red-800",
  DESISTIU: "bg-gray-100 text-gray-800",
  EM_ENTREVISTA: "bg-purple-100 text-purple-800",
  FASE_FINAL: "bg-indigo-100 text-indigo-800",
  APROVADO: "bg-green-100 text-green-800",
  ADMITIDO: "bg-emerald-100 text-emerald-800",
  SUSPENSA: "bg-pink-100 text-pink-800",
  CANCELADA: "bg-slate-100 text-slate-800"
};

const STATUS_LABELS = {
  AGUARDANDO: "Aguardando",
  NAO_APROVADO: "Não Aprovado",
  DESISTIU: "Desistiu",
  EM_ENTREVISTA: "Em Entrevista",
  FASE_FINAL: "Fase Final",
  APROVADO: "Aprovado",
  ADMITIDO: "Admitido",
  SUSPENSA: "Suspensa",
  CANCELADA: "Cancelada"
};

// Status e cores para as vagas
const VAGA_STATUS_CONFIG = {
  publicada: {
    label: "Publicada",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: "✓"
  },
  em_analise: {
    label: "Em Análise",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: "⏳"
  },
  pausada: {
    label: "Pausada",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "⏸"
  },
  encerrada: {
    label: "Encerrada",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: "✕"
  }
};

// Função auxiliar para formatar datas de forma segura
const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return 'Data inválida';
  }
};

export default function StatusVagas() {
  const { usuario } = useAuth();
  const { isConsultor, podeVerTodasVagas } = usePermissions();
  
  const [vagasStatus, setVagasStatus] = useState<VagaStatusRelatorio[]>([]);
  const [empresas, setEmpresas] = useState<Array<{id: string, razao_social: string, nome_fantasia?: string}>>([]);
  const [consultores, setConsultores] = useState<Array<{id: string, nome: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState<StatusVagasFilters>({
    empresa_id: "todas",
    consultor_id: "todos"
  });
  const [error, setError] = useState<string | null>(null);
  const [vagaSelecionada, setVagaSelecionada] = useState<VagaStatusRelatorio | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar vagas apenas quando dados iniciais estiverem prontos
  useEffect(() => {
    if (empresas.length > 0 && consultores.length > 0) {
      loadVagasStatus();
    }
  }, [empresas.length, consultores.length]);

  // Recarregar vagas quando filtros mudarem (com debounce)
  useEffect(() => {
    if (empresas.length > 0 && consultores.length > 0) {
      const timeoutId = setTimeout(() => {
        loadVagasStatus();
      }, 300); // Debounce de 300ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setError(null);
      
      const [empresasData, consultoresData] = await Promise.all([
        StatusVagasService.getEmpresas(),
        StatusVagasService.getConsultores()
      ]);
      
      setEmpresas(empresasData);
      setConsultores(consultoresData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setError('Erro ao carregar dados iniciais');
      toast.error('Erro ao carregar dados iniciais');
    }
  };

  const loadVagasStatus = async () => {
    if (empresas.length === 0) return;
    
    setLoading(true);
    try {
      setError(null);
      
      // Criar filtros limpos para enviar ao service
      const filtersToApply: StatusVagasFilters = {};
      
      // Adicionar apenas filtros válidos (não "todas" ou "todos")
      if (filters.empresa_id && filters.empresa_id !== 'todas') {
        filtersToApply.empresa_id = filters.empresa_id;
      }
      
      if (filters.consultor_id && filters.consultor_id !== 'todos') {
        filtersToApply.consultor_id = filters.consultor_id;
      }
      
      if (filters.data_inicio) {
        filtersToApply.data_inicio = filters.data_inicio;
      }
      
      if (filters.data_fim) {
        filtersToApply.data_fim = filters.data_fim;
      }
      
      // Se for consultor e não tiver permissão para ver todas as vagas, filtrar por consultor_id
      if (isConsultor() && !podeVerTodasVagas() && usuario?.id) {
        filtersToApply.consultor_id = usuario.id;
      }
      
      const data = await StatusVagasService.list(filtersToApply);
      setVagasStatus(data);
    } catch (error) {
      console.error('Erro ao carregar status das vagas:', error);
      setError('Erro ao carregar status das vagas');
      toast.error('Erro ao carregar status das vagas');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (vagasEspecificas?: VagaStatusRelatorio[], filtersToApply?: StatusVagasFilters) => {
    setExportLoading(true);
    try {
      // Se for consultor e não tiver permissão para ver todas as vagas, filtrar por consultor_id
      const finalFiltersToApply = filtersToApply || filters;
      if (isConsultor() && !podeVerTodasVagas() && usuario?.id) {
        finalFiltersToApply.consultor_id = usuario.id;
      }
      
      // Se foram passadas vagas específicas, usar elas. Senão, usar todas as vagas filtradas
      const vagasParaExportar = vagasEspecificas || vagasStatus;
      
      await StatusVagasService.exportToPDF(vagasParaExportar);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFilterChange = (key: keyof StatusVagasFilters, value: string) => {
    if (value === "todas" || value === "todos") {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      });
    } else if (value === "") {
      // Para campos de data vazios, remover o filtro
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      });
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleVisualizarVaga = (vaga: VagaStatusRelatorio) => {
    setVagaSelecionada(vaga);
    setModalOpen(true);
  };

  // Estatísticas
  const totalVagas = vagasStatus.length;
  const totalCandidatos = vagasStatus.reduce((acc, vaga) => acc + vaga.total_candidatos_enviados, 0);
  const totalAguardando = vagasStatus.reduce((acc, vaga) => 
    acc + vaga.candidatos.filter(c => c.status === 'AGUARDANDO').length, 0
  );
  const totalNaoAprovados = vagasStatus.reduce((acc, vaga) => 
    acc + vaga.candidatos.filter(c => c.status === 'NAO_APROVADO').length, 0
  );
  const totalAprovados = vagasStatus.reduce((acc, vaga) => 
    acc + vaga.candidatos.filter(c => c.status === 'APROVADO').length, 0
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Status de Vagas</h1>
            <p className="text-muted-foreground">
              Acompanhe o progresso dos processos seletivos em andamento
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExportPDF(undefined, undefined)}
              disabled={exportLoading || vagasStatus.length === 0}
              className="flex items-center gap-2"
            >
              {exportLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Relatório Geral de Vagas
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Empresa</label>
                <Select value={filters.empresa_id || "todas"} onValueChange={(value) => handleFilterChange('empresa_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as empresas</SelectItem>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome_fantasia || empresa.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(!isConsultor() || podeVerTodasVagas()) && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Consultor</label>
                  <Select value={filters.consultor_id || "todos"} onValueChange={(value) => handleFilterChange('consultor_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os consultores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os consultores</SelectItem>
                      {consultores.map((consultor) => (
                        <SelectItem key={consultor.id} value={consultor.id}>
                          {consultor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={filters.data_inicio || ""}
                  onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={filters.data_fim || ""}
                  onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Vagas</p>
                  <p className="text-2xl font-bold">{totalVagas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Candidatos</p>
                  <p className="text-2xl font-bold">{totalCandidatos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Aguardando</p>
                  <p className="text-2xl font-bold">{totalAguardando}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Aprovados</p>
                  <p className="text-2xl font-bold">{totalAprovados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Não Aprovados</p>
                  <p className="text-2xl font-bold">{totalNaoAprovados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Vagas */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando status das vagas...</span>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-red-800">Erro ao carregar dados</h3>
                  <p className="text-red-700">{error}</p>
                  <Button onClick={loadInitialData} className="mt-4">
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : vagasStatus.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma vaga encontrada</h3>
                  <p className="text-muted-foreground">
                    Não há vagas com os filtros selecionados.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vagasStatus.map((vaga) => (
                <Card key={vaga.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{vaga.empresa_nome}</h3>
                              <Badge 
                                className={`${VAGA_STATUS_CONFIG[vaga.status]?.color || VAGA_STATUS_CONFIG.publicada.color} border px-2 py-0.5 text-xs font-medium`}
                              >
                                {VAGA_STATUS_CONFIG[vaga.status]?.icon} {VAGA_STATUS_CONFIG[vaga.status]?.label || vaga.status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{vaga.cargo}</p>
                            {vaga.salario && (
                              <p className="text-sm text-green-600 font-medium">💰 {vaga.salario}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Vaga:</span> #{vaga.numero_vaga}
                          </div>
                          <div>
                            <span className="font-medium">Consultor:</span> {vaga.consultor_nome}
                          </div>
                          <div>
                            <span className="font-medium">Duração:</span> {vaga.dias_processo} dias
                          </div>
                          <div>
                            <span className="font-medium">Candidatos:</span> {vaga.total_candidatos_enviados}
                          </div>
                          <div>
                            <span className="font-medium">Início:</span> {formatDateSafe(vaga.data_inicio)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => handleVisualizarVaga(vaga)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </Button>
                        
                        <Button
                          onClick={() => handleExportPDF([vaga])}
                          disabled={exportLoading}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                        
                        <div className="text-xs text-muted-foreground text-center">
                          {vaga.candidatos.filter(c => c.status === 'AGUARDANDO').length} aguardando
                        </div>
                      </div>
                    </div>
                    

                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Visualização */}
        <StatusVagaModal
          vaga={vagaSelecionada}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    </MainLayout>
  );
}

