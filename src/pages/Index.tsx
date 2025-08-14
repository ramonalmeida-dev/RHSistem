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
  DollarSign,
  UserPlus,
  Clock
} from "lucide-react";

const Index = () => {
  const urgentTasks = [
    { id: 1, title: "Enviar CVs - Desenvolvedor Senior", client: "TechCorp", deadline: "Hoje", priority: "high" },
    { id: 2, title: "Entrevistas agendadas", client: "StartupXYZ", deadline: "Amanhã", priority: "medium" },
    { id: 3, title: "Feedback pendente", client: "MegaCorp", deadline: "2 dias", priority: "low" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

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
          <Button className="bg-gradient-primary hover:opacity-90">
            <UserPlus className="mr-2 h-4 w-4" />
            Nova Vaga
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Vagas Ativas"
            value="23"
            description="12 em processo de seleção"
            icon={Briefcase}
            trend={{ value: 12, label: "vs mês anterior", isPositive: true }}
          />
          <StatsCard
            title="Candidatos Ativos"
            value="156"
            description="87 em processo"
            icon={Users}
            trend={{ value: 8, label: "vs mês anterior", isPositive: true }}
          />
          <StatsCard
            title="CVs no Banco"
            value="2,847"
            description="Banco de talentos"
            icon={FileUser}
            trend={{ value: 15, label: "vs mês anterior", isPositive: true }}
          />
          <StatsCard
            title="Faturamento Mensal"
            value="R$ 78.450"
            description="Meta: R$ 85.000"
            icon={DollarSign}
            trend={{ value: -3, label: "vs meta", isPositive: false }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>

          {/* Urgent Tasks */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Tarefas Urgentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {urgentTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority === "high" && "Alta"}
                        {task.priority === "medium" && "Média"}
                        {task.priority === "low" && "Baixa"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.client}</p>
                    <p className="text-xs text-primary font-medium mt-1">{task.deadline}</p>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4">
                  Ver Todas as Tarefas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
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
      </div>
    </MainLayout>
  );
};

export default Index;
