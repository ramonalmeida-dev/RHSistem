import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Building2, 
  Mail, 
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockClientes = [
  {
    id: 1,
    razaoSocial: "TechCorp Desenvolvimento Ltda",
    cnpj: "12.345.678/0001-90",
    email: "contato@techcorp.com.br",
    telefone: "(11) 99999-9999",
    endereco: "São Paulo, SP",
    prazoPagamento: "30 dias",
    status: "ativo",
    ultimaVaga: "2024-01-15",
    totalVagas: 12
  },
  {
    id: 2,
    razaoSocial: "StartupXYZ Inovação S.A.",
    cnpj: "98.765.432/0001-10",
    email: "rh@startupxyz.com",
    telefone: "(11) 88888-8888",
    endereco: "Rio de Janeiro, RJ",
    prazoPagamento: "15 dias",
    status: "ativo",
    ultimaVaga: "2024-01-10",
    totalVagas: 8
  },
  {
    id: 3,
    razaoSocial: "MegaCorp Soluções Empresariais",
    cnpj: "11.222.333/0001-44",
    email: "jobs@megacorp.com.br",
    telefone: "(11) 77777-7777",
    endereco: "Brasília, DF",
    prazoPagamento: "45 dias",
    status: "inativo",
    ultimaVaga: "2023-11-20",
    totalVagas: 25
  }
];

const Clientes = () => {
  const getStatusBadge = (status: string) => {
    return status === "ativo" 
      ? <Badge className="bg-success text-success-foreground">Ativo</Badge>
      : <Badge variant="secondary">Inativo</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie sua carteira de clientes
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por razão social, CNPJ, email..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                Filtros Avançados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">24</div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">18</div>
              <p className="text-sm text-muted-foreground">Clientes Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">6</div>
              <p className="text-sm text-muted-foreground">Clientes Inativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">45</div>
              <p className="text-sm text-muted-foreground">Vagas Ativas</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <div className="grid gap-4">
          {mockClientes.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-custom-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{cliente.razaoSocial}</h3>
                        <p className="text-sm text-muted-foreground">CNPJ: {cliente.cnpj}</p>
                      </div>
                      {getStatusBadge(cliente.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{cliente.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{cliente.telefone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{cliente.endereco}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Prazo: {cliente.prazoPagamento}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                      <div>
                        <span className="text-sm text-muted-foreground">Total de Vagas:</span>
                        <span className="ml-2 font-medium">{cliente.totalVagas}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Última Vaga:</span>
                        <span className="ml-2 font-medium">
                          {new Date(cliente.ultimaVaga).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar Cliente</DropdownMenuItem>
                      <DropdownMenuItem>Ver Vagas</DropdownMenuItem>
                      <DropdownMenuItem>Histórico</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Desativar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination placeholder */}
        <div className="flex justify-center">
          <Button variant="outline">Carregar Mais</Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Clientes;