import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
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
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  totalVagas: number;
  vagasAtivas: number;
  vagasPublicadas: number;
  totalCandidatos: number;
  candidatosEmProcesso: number;
  totalCurriculos: number;
  curriculosDisponiveis: number;
  totalClientes: number;
  faturamentoMensal: number;
  metaFaturamento: number;
}

interface RecentActivityItem {
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

const Index = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVagas: 0,
    vagasAtivas: 0,
    vagasPublicadas: 0,
    totalCandidatos: 0,
    candidatosEmProcesso: 0,
    totalCurriculos: 0,
    curriculosDisponiveis: 0,
    totalClientes: 0,
    faturamentoMensal: 0,
    metaFaturamento: 85000
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [areasStats, setAreasStats] = useState<{ area: string; count: number }[]>([]);

  // Carregar estatísticas do dashboard
  const loadDashboardStats = async () => {
    try {
      // Estatísticas de vagas
      const { count: totalVagas } = await supabase
        .from('vagas')
        .select('*', { count: 'exact', head: true });

      const { count: vagasAtivas } = await supabase
        .from('vagas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'publicada');

      const { count: vagasPublicadas } = await supabase
        .from('vagas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'publicada');

      // Estatísticas de candidatos
      const { count: totalCandidatos } = await supabase
        .from('candidatos')
        .select('*', { count: 'exact', head: true });

      const { count: candidatosEmProcesso } = await supabase
        .from('candidatos_vagas')
        .select('*', { count: 'exact', head: true })
        .not('status_atual', 'eq', 'aprovado')
        .not('status_atual', 'eq', 'reprovado');

      // Estatísticas de currículos
      const { count: totalCurriculos } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true });

      const { count: curriculosDisponiveis } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .eq('disponibilidade', 'disponivel');

      // Estatísticas de clientes
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalVagas: totalVagas || 0,
        vagasAtivas: vagasAtivas || 0,
        vagasPublicadas: vagasPublicadas || 0,
        totalCandidatos: totalCandidatos || 0,
        candidatosEmProcesso: candidatosEmProcesso || 0,
        totalCurriculos: totalCurriculos || 0,
        curriculosDisponiveis: curriculosDisponiveis || 0,
        totalClientes: totalClientes || 0,
        faturamentoMensal: 78450, // Mock por enquanto
        metaFaturamento: 85000
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Carregar atividades recentes
  const loadRecentActivities = async () => {
    try {
      const activities: RecentActivityItem[] = [];

      // Buscar vagas recentes
      const { data: vagasRecentes } = await supabase
        .from('vagas')
        .select('cargo, created_at, empresa:clientes(razao_social)')
        .order('created_at', { ascending: false })
        .limit(3);

      vagasRecentes?.forEach((vaga: any) => {
        activities.push({
          id: `vaga-${vaga.cargo}`,
          type: 'vaga_criada',
          title: 'Nova vaga cadastrada',
          description: `${vaga.cargo} - ${vaga.empresa?.razao_social || 'Empresa não informada'}`,
          timestamp: new Date(vaga.created_at),
          user: { name: 'Sistema' },
          status: 'info'
        });
      });

      // Buscar currículos recentes
      const { data: curriculosRecentes } = await supabase
        .from('banco_curriculos')
        .select('candidato:candidatos(nome), created_at, area_atuacao')
        .order('created_at', { ascending: false })
        .limit(3);

      curriculosRecentes?.forEach((curriculo: any) => {
        activities.push({
          id: `curriculo-${curriculo.candidato?.nome}`,
          type: 'curriculo_adicionado',
          title: 'Currículo adicionado ao banco',
          description: `${curriculo.candidato?.nome} - ${curriculo.area_atuacao || 'Área não informada'}`,
          timestamp: new Date(curriculo.created_at),
          user: { name: 'Sistema' },
          status: 'success'
        });
      });

      // Ordenar por timestamp e pegar os 5 mais recentes
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      setRecentActivities(sortedActivities);
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
    }
  };

  // Carregar estatísticas por área de atuação
  const loadAreasStats = async () => {
    try {
      const { data: areasData } = await supabase
        .from('banco_curriculos')
        .select('area_atuacao')
        .not('area_atuacao', 'is', null);

      if (areasData) {
        const areaCounts: { [key: string]: number } = {};
        
        areasData.forEach((item: any) => {
          const area = item.area_atuacao || 'Não informada';
          areaCounts[area] = (areaCounts[area] || 0) + 1;
        });

        const sortedAreas = Object.entries(areaCounts)
          .map(([area, count]) => ({ area, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setAreasStats(sortedAreas);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas por área:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadDashboardStats(),
        loadRecentActivities(),
        loadAreasStats()
      ]);
      setLoading(false);
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
            description={`${stats.totalVagas} vagas no total`}
            icon={Briefcase}
            trend={{ value: 12, label: "vs mês anterior", isPositive: true }}
          />
          <StatsCard
            title="Candidatos Ativos"
            value={loading ? "..." : stats.candidatosEmProcesso.toString()}
            description={`${stats.totalCandidatos} candidatos cadastrados`}
            icon={Users}
            trend={{ value: 8, label: "vs mês anterior", isPositive: true }}
          />
          <StatsCard
            title="CVs no Banco"
            value={loading ? "..." : stats.totalCurriculos.toString()}
            description={`${stats.curriculosDisponiveis} disponíveis`}
            icon={FileUser}
            trend={{ value: 15, label: "vs mês anterior", isPositive: true }}
          />
          <StatsCard
            title="Clientes Ativos"
            value={loading ? "..." : stats.totalClientes.toString()}
            description="Total de clientes"
            icon={Building2}
            trend={{ value: 5, label: "vs mês anterior", isPositive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Atividades Recentes</CardTitle>
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
        </div>

        {/* Performance Chart Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de performance será implementado</p>
                </div>
              </div>
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
