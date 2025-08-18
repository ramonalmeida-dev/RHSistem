import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Star,
  MapPin,
  GraduationCap,
  Download,
  Eye,
  Send,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Briefcase,
  User,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { CurriculoDetailsModal } from "@/components/curriculos/CurriculoDetailsModal";
import { SendToVagaModal } from "@/components/curriculos/SendToVagaModal";
import { AddCurriculoModal } from "@/components/curriculos/AddCurriculoModal";
import { useToast } from "@/hooks/use-toast";

// Tipos para o banco de currículos
interface BancoCurriculoWithCandidato {
  id: string;
  candidato_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  area_atuacao?: string;
  experiencia_anos?: number;
  formacao?: string;
  localizacao?: string;
  disponibilidade: 'disponivel' | 'empregado' | 'indisponivel';
  avaliacao?: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status: 'ativo' | 'inativo';
  favorito: boolean;
  created_at: string;
  updated_at: string;
  candidato: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
}

interface BancoCurriculoStats {
  total: number;
  disponiveis: number;
  empregados: number;
  indisponiveis: number;
  ativos: number;
  inativos: number;
  favoritos: number;
  adicionados_mes: number;
}

const getDisponibilidadeBadge = (disponibilidade: string) => {
  const config = {
    disponivel: { label: "Disponível", color: "bg-success text-success-foreground" },
    empregado: { label: "Empregado", color: "bg-warning text-warning-foreground" },
    indisponivel: { label: "Indisponível", color: "bg-muted text-muted-foreground" }
  };
  
  const badgeConfig = config[disponibilidade as keyof typeof config];
  return <Badge className={badgeConfig.color}>{badgeConfig.label}</Badge>;
};

const getStatusBadge = (status: string) => {
  return status === "ativo" 
    ? <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
    : <Badge variant="secondary">Inativo</Badge>;
};

const renderStars = (rating: number) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
};

const Curriculos = () => {
  const [curriculos, setCurriculos] = useState<BancoCurriculoWithCandidato[]>([]);
  const [stats, setStats] = useState<BancoCurriculoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("todas");
  const [selectedDisponibilidade, setSelectedDisponibilidade] = useState("todas");
  const [selectedStatus, setSelectedStatus] = useState("todas");
  const [selectedCurriculo, setSelectedCurriculo] = useState<BancoCurriculoWithCandidato | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [sendToVagaModalOpen, setSendToVagaModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [curriculoToDelete, setCurriculoToDelete] = useState<BancoCurriculoWithCandidato | null>(null);
  const [addCurriculoModalOpen, setAddCurriculoModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Carregar currículos do banco com paginação
  const loadCurriculos = async () => {
    if (searchTerm && searchTerm.trim() !== "") {
      setSearching(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('Iniciando busca com termo:', searchTerm);
      
      let query = supabase
        .from('banco_curriculos')
        .select(`
          *,
          candidato:candidatos(id, nome, email, telefone)
        `, { count: 'exact' });

      // Aplicar filtros básicos primeiro
      if (selectedArea !== "todas") {
        query = query.eq('area_atuacao', selectedArea);
      }
      if (selectedDisponibilidade !== "todas") {
        query = query.eq('disponibilidade', selectedDisponibilidade);
      }
      if (selectedStatus !== "todas") {
        query = query.eq('status', selectedStatus);
      }

      // Se há busca ativa, carregar todos os dados para filtrar no frontend
      let data, error, count;
      if (searchTerm && searchTerm.trim() !== "") {
        console.log('Carregando todos os dados para busca no frontend');
        const result = await query.order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
        count = result.count;
      } else {
        // Calcular offset para paginação apenas quando não há busca
        const offset = (currentPage - 1) * itemsPerPage;
        console.log('Executando query com offset:', offset, 'limit:', itemsPerPage);
        
        const result = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + itemsPerPage - 1);
        
        data = result.data;
        error = result.error;
        count = result.count;
      }

      console.log('Resultado da query:', { data: data?.length, error, count });

      if (error) {
        console.error('Erro detalhado ao buscar currículos:', error);
        setError(`Erro ao carregar currículos: ${error.message}`);
        setCurriculos([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      // Filtrar por busca no frontend se necessário
      let filteredData = data || [];
      if (searchTerm && searchTerm.trim() !== "") {
        const searchLower = searchTerm.trim().toLowerCase();
        filteredData = filteredData.filter(curriculo => 
          (curriculo.candidato?.nome || '').toLowerCase().includes(searchLower) ||
          (curriculo.area_atuacao || '').toLowerCase().includes(searchLower) ||
          (curriculo.formacao || '').toLowerCase().includes(searchLower)
        );
        console.log('Dados filtrados no frontend:', filteredData.length);
      }

      setCurriculos(filteredData);
      setTotalItems(filteredData.length);
      setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
      
      console.log('Estado atualizado:', { 
        curriculos: filteredData.length, 
        totalItems: filteredData.length, 
        totalPages: Math.ceil(filteredData.length / itemsPerPage) 
      });
      
    } catch (error) {
      console.error('Erro ao carregar currículos:', error);
      setError('Erro interno ao carregar currículos');
      setCurriculos([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      // Total geral
      const { count: total } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true });

      // Por disponibilidade
      const { count: disponiveis } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .eq('disponibilidade', 'disponivel');

      const { count: empregados } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .eq('disponibilidade', 'empregado');

      const { count: indisponiveis } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .eq('disponibilidade', 'indisponivel');

      // Por status
      const { count: ativos } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      const { count: inativos } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inativo');

      // Favoritos
      const { count: favoritos } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .eq('favorito', true);

      // Adicionados este mês
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { count: adicionados_mes } = await supabase
        .from('banco_curriculos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', inicioMes.toISOString());

      setStats({
        total: total || 0,
        disponiveis: disponiveis || 0,
        empregados: empregados || 0,
        indisponiveis: indisponiveis || 0,
        ativos: ativos || 0,
        inativos: inativos || 0,
        favoritos: favoritos || 0,
        adicionados_mes: adicionados_mes || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset para primeira página quando filtros mudarem
      loadCurriculos();
    }, 500); // Aumentado para 500ms para ser mais estável

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedArea, selectedDisponibilidade, selectedStatus, currentPage]);

  // Carregar estatísticas apenas uma vez
  useEffect(() => {
    loadStats();
  }, []);

  // Download currículo
  const handleDownload = async (curriculo: BancoCurriculoWithCandidato) => {
    try {
      // Se é arquivo não disponível
      if (curriculo.url_storage === 'ARQUIVO_NAO_DISPONIVEL') {
        toast({
          title: "Arquivo não disponível",
          description: "Este arquivo não está disponível. Foi marcado como necessário re-upload.",
          variant: "destructive",
        });
        return;
      }

      // Se já é uma URL completa (candidatos externos), abrir diretamente
      if (curriculo.url_storage.startsWith('http')) {
        window.open(curriculo.url_storage, '_blank');
        return;
      }
      
      // Para arquivos no storage do Supabase
      const { data, error } = await supabase.storage
        .from('curriculos')
        .download(curriculo.url_storage);
      
      if (error) {
        console.error('Erro ao baixar currículo:', error);
        
        // Fallback: tentar URL pública
        const { data: publicData } = supabase.storage
          .from('curriculos')
          .getPublicUrl(curriculo.url_storage);
        
        if (publicData?.publicUrl) {
          window.open(publicData.publicUrl, '_blank');
        } else {
          toast({
            title: "Erro no download",
            description: "Erro ao baixar currículo. Arquivo pode não estar disponível.",
            variant: "destructive",
          });
        }
        return;
      }
      
      // Criar blob e download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = curriculo.nome_arquivo || 'curriculo.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download concluído",
        description: `Currículo de ${curriculo.candidato.nome} baixado com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro ao processar download:', error);
      toast({
        title: "Erro no download",
        description: "Erro ao baixar currículo",
        variant: "destructive",
      });
    }
  };

  // Visualizar detalhes
  const handleViewDetails = (curriculo: BancoCurriculoWithCandidato) => {
    setSelectedCurriculo(curriculo);
    setDetailsModalOpen(true);
  };

  // Enviar para vaga
  const handleSendToVaga = (curriculo: BancoCurriculoWithCandidato) => {
    setSelectedCurriculo(curriculo);
    setSendToVagaModalOpen(true);
  };

  // Abrir modal de confirmação de exclusão
  const handleDeleteClick = (curriculo: BancoCurriculoWithCandidato) => {
    setCurriculoToDelete(curriculo);
    setDeleteModalOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!curriculoToDelete) return;

    try {
      // Deletar do banco de dados
      const { error: dbError } = await supabase
        .from('banco_curriculos')
        .delete()
        .eq('id', curriculoToDelete.id);

      if (dbError) {
        console.error('Erro ao deletar do banco:', dbError);
        toast({
          title: "Erro",
          description: "Erro ao deletar currículo do banco de dados",
          variant: "destructive"
        });
        return;
      }

      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('curriculos')
        .remove([curriculoToDelete.url_storage]);

      if (storageError) {
        console.error('Erro ao deletar arquivo:', storageError);
        // Não falha se o arquivo não existir mais
      }

      // Atualizar lista local
      setCurriculos(prev => prev.filter(c => c.id !== curriculoToDelete.id));
      
      // Recarregar estatísticas
      loadStats();

      toast({
        title: "Sucesso",
        description: "Currículo excluído com sucesso"
      });

      setDeleteModalOpen(false);
      setCurriculoToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir currículo:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao excluir currículo",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Banco de CVs</h1>
            <p className="text-muted-foreground">
              Gerencie seu banco de talentos ({totalItems} currículos)
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setAddCurriculoModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar CV
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total de CVs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.disponiveis || 0}
              </div>
              <p className="text-sm text-muted-foreground">Disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.empregados || 0}
              </div>
              <p className="text-sm text-muted-foreground">Empregados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.favoritos || 0}
              </div>
              <p className="text-sm text-muted-foreground">Favoritos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, área, formação..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Áreas</SelectItem>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="rh">Recursos Humanos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDisponibilidade} onValueChange={setSelectedDisponibilidade}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="empregado">Empregado</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center mb-4">{error}</p>
              <div className="flex justify-center gap-2">
                <Button onClick={loadCurriculos} variant="outline">
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={() => {
                    setError(null);
                    setSearchTerm("");
                    setSelectedArea("todas");
                    setSelectedDisponibilidade("todas");
                    setSelectedStatus("todas");
                    setCurrentPage(1);
                  }} 
                  variant="outline"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CVs List */}
        <Card>
          <CardContent className="p-0">
            {loading || searching ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    {searching ? "Buscando currículos..." : "Carregando currículos..."}
                  </p>
                </div>
              </div>
            ) : curriculos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum currículo encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || selectedArea !== "todas" || selectedDisponibilidade !== "todas"
                    ? "Nenhum currículo corresponde aos critérios de busca."
                    : "Comece adicionando seu primeiro currículo."
                  }
                </p>
                {!searchTerm && selectedArea === "todas" && selectedDisponibilidade === "todas" && (
                  <Button onClick={() => setAddCurriculoModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar CV
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Candidato</th>
                        <th className="text-left p-3 font-medium">Área</th>
                        <th className="text-left p-3 font-medium">Contato</th>
                        <th className="text-left p-3 font-medium">Localização</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium w-20">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curriculos.map((curriculo, index) => (
                        <tr 
                          key={curriculo.id} 
                          className={`border-b hover:bg-muted/30 transition-colors ${
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                          }`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${curriculo.candidato.nome}`} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {curriculo.candidato.nome.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{curriculo.candidato.nome}</div>
                                <div className="text-sm text-muted-foreground">
                                  {curriculo.experiencia_anos || 0} anos de experiência
                                </div>
                                {curriculo.avaliacao && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {renderStars(curriculo.avaliacao)}
                                    <span className="text-xs text-muted-foreground">({curriculo.avaliacao}/5)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-primary" />
                              <span className="font-medium">{curriculo.area_atuacao || 'Não informado'}</span>
                            </div>
                            {curriculo.formacao && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {curriculo.formacao}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div>
                              {curriculo.candidato.email && (
                                <div className="font-medium text-sm">{curriculo.candidato.email}</div>
                              )}
                              {curriculo.candidato.telefone && (
                                <div className="text-muted-foreground text-xs">{curriculo.candidato.telefone}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {curriculo.localizacao || '-'}
                          </td>
                          <td className="p-3">
                            {getStatusBadge(curriculo.status)}
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(curriculo)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(curriculo)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Baixar CV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendToVaga(curriculo)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Enviar para Vaga
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(curriculo)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} currículos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        {selectedCurriculo && (
          <CurriculoDetailsModal
            curriculo={selectedCurriculo}
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
          />
        )}

        {/* Modal Enviar para Vaga */}
        {selectedCurriculo && (
          <SendToVagaModal
            curriculo={selectedCurriculo}
            open={sendToVagaModalOpen}
            onOpenChange={setSendToVagaModalOpen}
            onSuccess={() => {
              // Recarregar dados se necessário
            }}
          />
        )}

        {/* Modal de Confirmação de Exclusão */}
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o currículo de <strong>{curriculoToDelete?.candidato.nome}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita. O currículo será removido permanentemente do banco de dados e o arquivo será deletado do storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Adicionar CV */}
        <AddCurriculoModal
          isOpen={addCurriculoModalOpen}
          onClose={() => setAddCurriculoModalOpen(false)}
          onSuccess={() => {
            // Recarregar dados após adicionar
            loadCurriculos();
            loadStats();
            toast({
              title: "Sucesso",
              description: "Currículo adicionado com sucesso!"
            });
          }}
        />
      </div>
    </MainLayout>
  );
};

export default Curriculos; 