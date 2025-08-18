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
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Upload,
  Edit
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Interfaces temporárias
interface ContaReceber {
  id: string;
  vaga_id: string;
  empresa_id: string;
  numero_vaga: string;
  cargo: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'parcial';
  tipo: 'comissao' | 'taxa' | 'adicional';
  observacoes?: string;
  nota_fiscal_url?: string;
  empresa?: { razao_social: string; cnpj: string };
  created_at: string;
  updated_at: string;
}

interface ContaReceberStats {
  total: number;
  pendente: number;
  pago: number;
  atrasado: number;
  parcial: number;
  valor_total: number;
  valor_recebido: number;
  valor_pendente: number;
  valor_atrasado: number;
}

// Mock do serviço temporário
const ContasReceberService = {
  async getStats(): Promise<ContaReceberStats> {
    return {
      total: 5,
      pendente: 2,
      pago: 2,
      atrasado: 1,
      parcial: 0,
      valor_total: 14800,
      valor_recebido: 5300,
      valor_pendente: 7000,
      valor_atrasado: 2500
    };
  },
  async list(): Promise<ContaReceber[]> {
    return [
      {
        id: '1',
        vaga_id: 'v1',
        empresa_id: 'e1',
        numero_vaga: 'DEV-005',
        cargo: 'Desenvolvedor Frontend',
    valor: 3500,
        data_vencimento: '2024-02-15',
        data_pagamento: '2024-02-10',
        status: 'pago',
        tipo: 'comissao',
        observacoes: 'Pagamento antecipado',
        empresa: { razao_social: 'TechCorp Desenvolvimento Ltda', cnpj: '12345678901234' },
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
  },
  {
        id: '2',
        vaga_id: 'v2',
        empresa_id: 'e2',
        numero_vaga: 'VND-003',
        cargo: 'Gerente de Vendas',
        valor: 3000,
        data_vencimento: '2024-02-20',
        status: 'pendente',
        tipo: 'comissao',
        empresa: { razao_social: 'MegaCorp Soluções Empresariais', cnpj: '23456789012345' },
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];
  },
  async uploadNotaFiscal(id: string, file: File): Promise<string> {
    console.log('Upload de nota fiscal:', id, file.name);
    return 'https://example.com/nota-fiscal.pdf';
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pendente: { label: "Pendente", color: "bg-warning text-warning-foreground" },
    pago: { label: "Pago", color: "bg-success text-success-foreground" },
    atrasado: { label: "Atrasado", color: "bg-destructive text-destructive-foreground" },
    parcial: { label: "Parcial", color: "bg-blue-100 text-blue-800" }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig];
  return <Badge className={config.color}>{config.label}</Badge>;
};

const getTipoBadge = (tipo: string) => {
  const tipoConfig = {
    comissao: { label: "Comissão", color: "bg-primary text-primary-foreground" },
    taxa: { label: "Taxa", color: "bg-secondary text-secondary-foreground" },
    adicional: { label: "Adicional", color: "bg-accent text-accent-foreground" }
  };
  
  const config = tipoConfig[tipo as keyof typeof tipoConfig];
  return <Badge className={config.color}>{config.label}</Badge>;
};

const Financeiro = () => {
  const { user } = useAuth();
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [stats, setStats] = useState<ContaReceberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contasData, statsData] = await Promise.all([
        ContasReceberService.list(),
        ContasReceberService.getStats()
      ]);
      setContasReceber(contasData);
      setStats(statsData);
    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNotaFiscal = async (id: string, file: File) => {
    try {
      await ContasReceberService.uploadNotaFiscal(id, file);
      toast.success('Nota fiscal enviada com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao enviar nota fiscal');
      console.error('Erro ao fazer upload:', error);
    }
  };

  if (!stats) return null;

  const totalReceber = stats.valor_total;
  const totalPago = stats.valor_recebido;
  const totalPendente = stats.valor_pendente;
  const totalAtrasado = stats.valor_atrasado;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Controle Financeiro</h1>
            <p className="text-muted-foreground">
              Relatório de contas a receber e recebidas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">R$ {totalReceber.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total a Receber</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">R$ {totalPago.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Recebido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">R$ {totalPendente.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Pendente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">R$ {totalAtrasado.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Atrasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Contas a Receber Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contas a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Empresa</th>
                    <th className="text-left p-3 font-medium">Vaga</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Valor</th>
                    <th className="text-left p-3 font-medium">Vencimento</th>
                    <th className="text-left p-3 font-medium">Pagamento</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contasReceber.map((conta) => (
                    <tr key={conta.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{conta.empresa?.razao_social || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="text-sm font-medium">{conta.cargo}</div>
                          <div className="text-xs text-muted-foreground">#{conta.numero_vaga}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        {getTipoBadge(conta.tipo)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">R$ {conta.valor.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {conta.data_pagamento ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="text-sm">
                              {new Date(conta.data_pagamento).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Aguardando</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(conta.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.tipo === 'admin' && (
                            <>
                              <input
                                type="file"
                                id={`nota-fiscal-${conta.id}`}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadNotaFiscal(conta.id, file);
                                  }
                                }}
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => document.getElementById(`nota-fiscal-${conta.id}`)?.click()}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {conta.nota_fiscal_url && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(conta.nota_fiscal_url, '_blank')}
                            >
                            <Download className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Receita por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Janeiro 2024</span>
                  <span className="font-medium">R$ 8.300</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dezembro 2023</span>
                  <span className="font-medium">R$ 12.500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Novembro 2023</span>
                  <span className="font-medium">R$ 9.800</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Outubro 2023</span>
                  <span className="font-medium">R$ 7.200</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Receita por Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">TechCorp</span>
                  <span className="font-medium">R$ 7.500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">MegaCorp</span>
                  <span className="font-medium">R$ 3.000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">StartupXYZ</span>
                  <span className="font-medium">R$ 2.500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">DesignStudio</span>
                  <span className="font-medium">R$ 1.800</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Alertas Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-sm">Conta atrasada - StartupXYZ</p>
                  <p className="text-xs text-muted-foreground">R$ 2.500 venceu em 30/01/2024</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-sm">Vencimento próximo - MegaCorp</p>
                  <p className="text-xs text-muted-foreground">R$ 3.000 vence em 20/02/2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Financeiro; 