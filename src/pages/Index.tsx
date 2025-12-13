import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Briefcase, 
  FileUser, 
  TrendingUp, 
  Calendar,
  Building2
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  DashboardService, 
  type DashboardStats, 
  type RecentActivityItem, 
  type StatusStats, 
  type AreaStats 
} from "@/lib/dashboardService";

const Index = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVagas: 0,
    vagasAtivas: 0,
    vagasPublicadas: 0,
    vagasEmAnalise: 0,
    totalCandidatos: 0,
    candidatosEmProcesso: 0,
    candidatosAprovados: 0,
    totalCurriculos: 0,
    curriculosDisponiveis: 0,
    totalClientes: 0,
    faturamentoMensal: 0,
    metaFaturamento: 100000,
    trends: {
      vagas: 0,
      candidatos: 0,
      curriculos: 0,
      clientes: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [areasStats, setAreasStats] = useState<AreaStats[]>([]);
  const [candidatoStatusStats, setCandidatoStatusStats] = useState<StatusStats[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statsData, activitiesData, areasData, statusData] = await Promise.all([
          DashboardService.getDashboardStats(),
          DashboardService.getRecentActivities(),
          DashboardService.getAreasStats(),
          DashboardService.getCandidatoStatusStats()
        ]);

        setStats(statsData);
        setRecentActivities(activitiesData);
        setAreasStats(areasData);
        setCandidatoStatusStats(statusData);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema de recrutamento e seleção
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Vagas Ativas"
            value={loading ? "..." : stats.vagasAtivas.toString()}
            description={`${stats.vagasPublicadas} publicadas, ${stats.vagasEmAnalise} em análise`}
            icon={Briefcase}
            trend={{ 
              value: Math.abs(stats.trends.vagas), 
              label: "vs mês anterior", 
              isPositive: stats.trends.vagas >= 0 
            }}
          />
          <StatsCard
            title="Candidatos em Processo"
            value={loading ? "..." : stats.candidatosEmProcesso.toString()}
            description={`${stats.candidatosAprovados} aprovados, ${stats.totalCandidatos} total`}
            icon={Users}
            trend={{ 
              value: Math.abs(stats.trends.candidatos), 
              label: "vs mês anterior", 
              isPositive: stats.trends.candidatos >= 0 
            }}
          />
          <StatsCard
            title="CVs no Banco"
            value={loading ? "..." : stats.totalCurriculos.toString()}
            description={`${stats.curriculosDisponiveis} disponíveis`}
            icon={FileUser}
            trend={{ 
              value: Math.abs(stats.trends.curriculos), 
              label: "vs mês anterior", 
              isPositive: stats.trends.curriculos >= 0 
            }}
          />
          <StatsCard
            title="Clientes Ativos"
            value={loading ? "..." : stats.totalClientes.toString()}
            description="Total de clientes"
            icon={Building2}
            trend={{ 
              value: Math.abs(stats.trends.clientes), 
              label: "vs mês anterior", 
              isPositive: stats.trends.clientes >= 0 
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Visão Financeira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento Mensal</p>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(stats.faturamentoMensal)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Meta Mensal</p>
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(stats.metaFaturamento)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso da Meta</span>
                    <span>{Math.round((stats.faturamentoMensal / stats.metaFaturamento) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min((stats.faturamentoMensal / stats.metaFaturamento) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Candidatos Aprovados</p>
                    <p className="text-xl font-bold text-success">{stats.candidatosAprovados}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Processo</p>
                    <p className="text-xl font-bold text-warning">{stats.candidatosEmProcesso}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Atividades Realizadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando atividades...</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma atividade recente</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-3 last:pb-0 border-b last:border-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs font-medium">
                        {activity.user.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.status && (
                          <Badge variant="secondary" className={
                            activity.status === "success" ? "bg-success text-success-foreground" :
                            activity.status === "info" ? "bg-primary text-primary-foreground" :
                            "bg-muted text-muted-foreground"
                          }>
                            {activity.status === "success" && "Concluído"}
                            {activity.status === "info" && "Novo"}
                            {activity.status === "warning" && "Atenção"}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{activity.user.name}</span>
                        <span className="mx-1">•</span>
                        <span>
                          {new Date(activity.timestamp).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart and Areas Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Status dos Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : candidatoStatusStats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                </div>
              ) : (
                candidatoStatusStats.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium">
                        {item.status}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {item.count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUser className="h-5 w-5 text-primary" />
                CVs por Área de Atuação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : areasStats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                </div>
              ) : (
                areasStats.map((area, index) => (
                  <div key={area.area} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium capitalize">
                        {area.area === 'desenvolvimento' ? 'Desenvolvimento' :
                         area.area === 'marketing' ? 'Marketing' :
                         area.area === 'vendas' ? 'Vendas' :
                         area.area === 'design' ? 'Design' :
                         area.area === 'rh' ? 'Recursos Humanos' :
                         area.area === 'administrativo' ? 'Administrativo' :
                         area.area === 'financeiro' ? 'Financeiro' :
                         area.area === 'outros' ? 'Outros' :
                         area.area}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {area.count} CVs
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.candidatosAprovados}</p>
                  <p className="text-sm text-muted-foreground">Candidatos Aprovados</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Aprovação</span>
                    <span>
                      {stats.totalCandidatos > 0 
                        ? Math.round((stats.candidatosAprovados / stats.totalCandidatos) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: stats.totalCandidatos > 0 
                          ? `${Math.min((stats.candidatosAprovados / stats.totalCandidatos) * 100, 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-center">
                  <div>
                    <p className="text-lg font-bold text-warning">{stats.candidatosEmProcesso}</p>
                    <p className="text-xs text-muted-foreground">Em Processo</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{stats.vagasAtivas}</p>
                    <p className="text-xs text-muted-foreground">Vagas Ativas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximas Atividades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Atividades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 border-l-4 border-primary bg-primary/5">
              <div>
                <p className="font-medium text-sm">Entrevista - Desenvolvedor Senior</p>
                <p className="text-xs text-muted-foreground">TechCorp • 14:00</p>
              </div>
              <Badge variant="outline">Hoje</Badge>
            </div>
            
            <div className="flex items-center justify-between p-2 border-l-4 border-warning bg-warning/5">
              <div>
                <p className="font-medium text-sm">Apresentar candidatos</p>
                <p className="text-xs text-muted-foreground">StartupXYZ • 10:00</p>
              </div>
              <Badge variant="outline">Amanhã</Badge>
            </div>
            
            <div className="flex items-center justify-between p-2 border-l-4 border-muted bg-muted/5">
              <div>
                <p className="font-medium text-sm">Reunião mensal</p>
                <p className="text-xs text-muted-foreground">Equipe Interna • 09:00</p>
              </div>
              <Badge variant="outline">Sex</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
