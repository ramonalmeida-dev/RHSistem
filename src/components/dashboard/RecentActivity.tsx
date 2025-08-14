import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "candidato_enviado" | "vaga_criada" | "cliente_cadastrado" | "processo_finalizado";
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
  status?: "success" | "warning" | "info";
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "candidato_enviado",
    title: "Candidato enviado para cliente",
    description: "3 candidatos enviados para Desenvolvedor Senior - TechCorp",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    user: { name: "João Silva" },
    status: "success"
  },
  {
    id: "2", 
    type: "vaga_criada",
    title: "Nova vaga cadastrada",
    description: "Analista de Marketing - StartupXYZ",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    user: { name: "Maria Santos" },
    status: "info"
  },
  {
    id: "3",
    type: "processo_finalizado",
    title: "Processo finalizado",
    description: "Gerente de Vendas - MegaCorp contratado",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
    user: { name: "Carlos Lima" },
    status: "success"
  },
  {
    id: "4",
    type: "cliente_cadastrado", 
    title: "Novo cliente cadastrado",
    description: "InnovaTech Soluções Ltda",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago
    user: { name: "Ana Costa" },
    status: "info"
  },
];

const getStatusColor = (status?: string) => {
  switch (status) {
    case "success":
      return "bg-success text-success-foreground";
    case "warning":
      return "bg-warning text-warning-foreground";
    case "info":
      return "bg-primary text-primary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 pb-3 last:pb-0 border-b last:border-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {activity.user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{activity.title}</p>
                {activity.status && (
                  <Badge variant="secondary" className={getStatusColor(activity.status)}>
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
                  {formatDistanceToNow(activity.timestamp, {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}