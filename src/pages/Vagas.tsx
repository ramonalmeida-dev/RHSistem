import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Briefcase, 
  Building2, 
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Kanban,
  List,
  Eye,
  Trash2,
  ArrowLeft,
  Pause,
  Play,
  Edit,
  Settings,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanBoard, Candidate, CANDIDATE_STATUSES } from "@/components/kanban/KanbanBoard";
import { useState, useEffect } from "react";
import { AddVagaModal } from "@/components/vagas/AddVagaModal";
import { EditVagaModal } from "@/components/vagas/EditVagaModal";
import { AddCandidatoModal } from "@/components/candidatos/AddCandidatoModal";
import { CandidatoDetailsModal } from "@/components/candidatos/CandidatoDetailsModal";
import { EmailModal } from "@/components/candidatos/EmailModal";
import { PdfViewerModal } from "@/components/curriculos/PdfViewerModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { VAGA_STATUS_CONFIG, VAGA_SUBSTATUS_CONFIG, VagaStatus, VagaSubstatus } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

// Tipos baseados no backend
interface Vaga {
  id: string;
  numero_vaga: string;
  empresa_id: string;
  empresa?: {
    razao_social: string;
    cnpj: string;
  };
  contato_envio_cv: string;
  email: string;
  celular: string;
  cargo: string;
  salario: string;
  local_trabalho: string;
  data_recebimento: string;
  data_formatacao_perfil: string;
  data_divulgacao: string;
  data_inicio_selecao: string;
  data_envio_curriculos: string;
  data_encerramento: string;
  perfil_word?: string;
  informacoes_complementares?: string;
  questionario_tecnico?: string;
  observacoes?: string;
  consultor_id: string;
  consultor?: {
    nome: string;
    email: string;
  };
  consultores?: Array<{
    nome: string;
    email: string;
  }>;
  status: VagaStatus;
  substatus?: VagaSubstatus;
  created_at: string;
  updated_at: string;
  candidatos?: Candidate[];
}

const getFaseBadge = (fase: string) => {
  const faseConfig = {
    selecionando: { label: "Em seleção", color: "bg-blue-100 text-blue-800" },
    curriculos_enviados: { label: "CVs Enviados", color: "bg-yellow-100 text-yellow-800" },
    entrevistas: { label: "Entrevistas", color: "bg-orange-100 text-orange-800" },
    fase_final: { label: "Fase Final", color: "bg-purple-100 text-purple-800" },
    aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800" },
    reprovado: { label: "Reprovado", color: "bg-red-100 text-red-800" },
    desistiu: { label: "Desistiu", color: "bg-gray-100 text-gray-800" }
  };
  
  const config = faseConfig[fase as keyof typeof faseConfig];
  return <Badge className={config.color}>{config.label}</Badge>;
};

const getStatusBadge = (vaga: Vaga) => {
  const statusConfig = VAGA_STATUS_CONFIG[vaga.status];
  const substatusConfig = vaga.substatus ? VAGA_SUBSTATUS_CONFIG[vaga.substatus] : null;
  
  return (
    <div className="flex flex-col gap-1">
      <Badge className={`${statusConfig.color} w-fit text-xs px-2 py-0.5`}>
        {statusConfig.title}
      </Badge>
      {substatusConfig && (
        <Badge variant="outline" className={`${substatusConfig.color} w-fit text-xs px-2 py-0.5`}>
          {substatusConfig.title}
        </Badge>
      )}
    </div>
  );
};

const getAvailableActions = (vaga: Vaga) => {
  const statusConfig = VAGA_STATUS_CONFIG[vaga.status];
  return statusConfig.actions;
};

const Vagas = () => {
  const { podeCriarVagas, podeEditarVagas, podeExcluirVagas } = usePermissions();
  
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [selectedVagaCandidatos, setSelectedVagaCandidatos] = useState<Candidate[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCandidatoModalOpen, setIsAddCandidatoModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pdfFileType, setPdfFileType] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isEncerrarModalOpen, setIsEncerrarModalOpen] = useState(false);
  const [vagaToEncerrar, setVagaToEncerrar] = useState<Vaga | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [empresaFilter, setEmpresaFilter] = useState<string>('todas');
  const [consultorFilter, setConsultorFilter] = useState<string>('todos');
  const [dataInicioFilter, setDataInicioFilter] = useState<string>('');
  const [dataFimFilter, setDataFimFilter] = useState<string>('');
  const { toast } = useToast();

  // Carregar candidatos de uma vaga específica
  const loadCandidatosVaga = async (vagaId: string) => {
    try {
      const { data, error } = await supabase
        .from('candidatos_vagas')
        .select(`
          *,
          candidato:candidatos(
            id,
            nome,
            email,
            telefone
          )
        `)
        .eq('vaga_id', vagaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Converter para o formato esperado pelo kanban
      const candidatos = data?.map(cv => ({
        id: cv.candidato.id,
        name: cv.candidato.nome,
        email: cv.candidato.email,
        phone: cv.candidato.telefone,
        jobTitle: selectedVaga?.cargo || '',
        company: selectedVaga?.empresa?.razao_social || '',
        status: cv.status_atual,
        appliedDate: cv.data_candidatura,
        consultant: selectedVaga?.consultor?.nome || '',
        notes: cv.observacoes,
        rating: cv.avaliacao,
        cvSentDate: cv.cv_sent_date,
        interviewDate: cv.interview_date,
        fonte_candidatura: cv.fonte_candidatura
      })) || [];

      return candidatos;
    } catch (error) {
      console.error('Erro ao carregar candidatos da vaga:', error);
      return [];
    }
  };

  // Carregar vagas
  const loadVagas = async () => {
    try {
      setLoading(true);
      
      // Carregar vagas com empresas
      const { data: vagasData, error: vagasError } = await supabase
        .from('vagas')
        .select(`
          *,
          empresa:clientes(razao_social, cnpj)
        `)
        .order('created_at', { ascending: false });

      if (vagasError) {
        console.error('Erro na consulta de vagas:', vagasError);
        throw vagasError;
      }

      // Carregar consultores de cada vaga
      const vagasComConsultores = await Promise.all(
        (vagasData || []).map(async (vaga) => {
          const { data: consultoresData } = await supabase
            .from('vagas_consultores')
            .select(`
              consultor_id,
              usuarios!inner(id, nome, email)
            `)
            .eq('vaga_id', vaga.id);

          // Se não houver consultores na nova tabela, tentar carregar do consultor_id antigo
          let consultores = consultoresData?.map(c => ({
            id: c.consultor_id,
            nome: c.usuarios.nome,
            email: c.usuarios.email
          })) || [];
          
          if (consultores.length === 0 && vaga.consultor_id) {
            const { data: consultorAntigo } = await supabase
              .from('usuarios')
              .select('id, nome, email')
              .eq('id', vaga.consultor_id)
              .single();
            
            if (consultorAntigo) {
              consultores = [{
                id: consultorAntigo.id,
                nome: consultorAntigo.nome,
                email: consultorAntigo.email
              }];
            }
          }

          return {
            ...vaga,
            consultores: consultores,
            // Manter compatibilidade com código antigo
            consultor: consultores[0] || null
          };
        })
      );
      
      setVagas(vagasComConsultores);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vagas. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar vagas
  const filteredVagas = vagas.filter(vaga => {
    const searchTermClean = searchTerm.toLowerCase();
    
    // Buscar no cargo
    if (vaga.cargo.toLowerCase().includes(searchTermClean)) return true;
    
    // Buscar no número da vaga
    if (vaga.numero_vaga.toLowerCase().includes(searchTermClean)) return true;
    
    // Buscar na empresa
    if (vaga.empresa?.razao_social.toLowerCase().includes(searchTermClean)) return true;
    
    // Buscar nos consultores
    if (vaga.consultores?.some(c => c.nome.toLowerCase().includes(searchTermClean))) return true;
    
    return false;
  }).filter(vaga => {
    // Filtro por empresa
    if (empresaFilter !== 'todas' && vaga.empresa_id.toString() !== empresaFilter) return false;
    
    // Filtro por consultor - verifica se algum dos consultores da vaga corresponde ao filtro
    if (consultorFilter !== 'todos') {
      // Buscar consultores da vaga através da tabela vagas_consultores
      const temConsultor = vaga.consultores?.some(c => {
        // Comparar diretamente com o ID do filtro
        return c.id === consultorFilter;
      });
      if (!temConsultor) return false;
    }
    
    // Filtro por data de recebimento
    if (dataInicioFilter && vaga.data_recebimento < dataInicioFilter) return false;
    if (dataFimFilter && vaga.data_recebimento > dataFimFilter) return false;
    
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());



  // Paginação
  const totalPages = Math.ceil(filteredVagas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVagas = filteredVagas.slice(startIndex, endIndex);



  // Resetar página quando mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, empresaFilter, consultorFilter, dataInicioFilter, dataFimFilter]);

  // Carregar vagas na montagem do componente
  useEffect(() => {
    loadVagas();
  }, []);

  const handleCandidateUpdate = (candidateId: string, newStatus: keyof typeof CANDIDATE_STATUSES) => {
    if (!selectedVaga) return;
    
    // Atualizar o candidato no estado local
    setSelectedVagaCandidatos(prev => {
      const updated = prev.map(c => 
        c.id === candidateId 
          ? { ...c, status: newStatus }
          : c
      );
      return updated;
    });
  };

  const handleAddCandidate = () => {
    setIsAddCandidatoModalOpen(true);
  };

  const handleViewCandidateDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailsModalOpen(true);
  };

  const handleSendEmailToCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsEmailModalOpen(true);
  };

  const handleViewCurriculo = async (candidate: Candidate) => {
    try {
      let data = null;
      let error = null;

      // Primeiro, buscar na tabela curriculos (específica da vaga) se temos vaga selecionada
      if (selectedVaga?.id) {
        const { data: curriculoVaga, error: errorVaga } = await supabase
          .from('curriculos')
          .select('*')
          .eq('candidato_id', candidate.id)
          .eq('vaga_id', selectedVaga.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!errorVaga && curriculoVaga) {
          data = curriculoVaga;
        } else {
          // Se não encontrou na tabela curriculos, buscar no banco_curriculos
          const { data: curriculoBanco, error: errorBanco } = await supabase
            .from('banco_curriculos')
            .select('*')
            .eq('candidato_id', candidate.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!errorBanco && curriculoBanco) {
            data = curriculoBanco;
          } else {
            error = errorBanco;
          }
        }
      } else {
        // Se não temos vaga selecionada, buscar apenas no banco_curriculos
        const { data: curriculoBanco, error: errorBanco } = await supabase
          .from('banco_curriculos')
          .select('*')
          .eq('candidato_id', candidate.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!errorBanco && curriculoBanco) {
          data = curriculoBanco;
        } else {
          error = errorBanco;
        }
      }

      if (error || !data) {
        console.error('Erro ao buscar currículo:', error);
        toast({
          title: "Currículo não encontrado",
          description: "Este candidato não possui currículo cadastrado no sistema.",
          variant: "destructive",
        });
        return;
      }

      // Se é arquivo não disponível
      if (data.url_storage === 'ARQUIVO_NAO_DISPONIVEL') {
        toast({
          title: "Arquivo não disponível",
          description: "Este arquivo não está disponível. Foi marcado como necessário re-upload.",
          variant: "destructive",
        });
        return;
      }

      let urlToView = '';

      // Se já é uma URL completa (candidatos externos), usar diretamente
      if (data.url_storage.startsWith('http')) {
        urlToView = data.url_storage;
      } else {
        // Para arquivos no storage do Supabase, obter URL pública
        const { data: publicData } = supabase.storage
          .from('curriculos')
          .getPublicUrl(data.url_storage);
        
        if (publicData?.publicUrl) {
          urlToView = publicData.publicUrl;
        } else {
          toast({
            title: "Erro ao acessar currículo",
            description: "Não foi possível gerar URL para visualização do currículo.",
            variant: "destructive",
          });
          return;
        }
      }

      // Abrir modal de visualização de PDF
      setSelectedCandidate(candidate);
      setPdfUrl(urlToView);
      setPdfFileName(data.nome_arquivo || '');
      setPdfFileType(data.tipo_arquivo || '');
      setIsPdfViewerOpen(true);
      
    } catch (error) {
      console.error('Erro ao processar currículo:', error);
      toast({
        title: "Erro no download",
        description: "Erro ao baixar currículo",
        variant: "destructive",
      });
    }
  };

  const handleViewKanban = async (vaga: Vaga) => {
    setSelectedVaga(vaga);
    setViewMode('kanban');
    
    // Carregar candidatos da vaga
    const candidatos = await loadCandidatosVaga(vaga.id);
    setSelectedVagaCandidatos(candidatos);
  };

  const handleBackToList = () => {
    setSelectedVaga(null);
    setViewMode('list');
  };

  const handleAddVaga = async (vagaData: any) => {
    try {
      // Função auxiliar para converter string vazia em null
      const parseDate = (dateString: string) => {
        return dateString && dateString.trim() !== '' ? dateString : null;
      };

      // Criar a vaga
      const { data, error } = await supabase
        .from('vagas')
        .insert({
          numero_vaga: vagaData.numeroVaga,
          empresa_id: vagaData.empresaId,
          contato_envio_cv: vagaData.contatoEnvioCv,
          email: vagaData.email,
          celular: vagaData.celular,
          cargo: vagaData.cargo,
          salario: vagaData.salario,
          local_trabalho: vagaData.localTrabalho,
          data_recebimento: vagaData.dataRecebimento,
          data_formatacao_perfil: parseDate(vagaData.dataFormatacaoPerfil),
          data_divulgacao: parseDate(vagaData.dataDivulgacao),
          data_inicio_selecao: parseDate(vagaData.dataInicioSelecao),
          data_envio_curriculos: parseDate(vagaData.dataEnvioCurriculos),
          data_encerramento: parseDate(vagaData.dataEncerramento),
          perfil_word: vagaData.perfilWord,
          informacoes_complementares: vagaData.informacoesComplementares,
          observacoes: vagaData.observacoes,
          consultor_id: vagaData.consultoresIds?.[0] || null, // Manter compatibilidade
          status: 'publicada'
        })
        .select(`
          *,
          empresa:clientes(razao_social, cnpj)
        `)
        .single();

      if (error) throw error;

      // Inserir consultores na tabela vagas_consultores
      if (vagaData.consultoresIds && vagaData.consultoresIds.length > 0) {
        const consultoresInsert = vagaData.consultoresIds.map((consultorId: string) => ({
          vaga_id: data.id,
          consultor_id: consultorId
        }));

        const { error: consultoresError } = await supabase
          .from('vagas_consultores')
          .insert(consultoresInsert);

        if (consultoresError) {
          console.error('Erro ao inserir consultores:', consultoresError);
        }
      }

      // Salvar questionário se houver perguntas
      if (vagaData.perguntasQuestionario && vagaData.perguntasQuestionario.length > 0) {
        const { QuestionarioService } = await import('@/lib/questionarioService');
        try {
          await QuestionarioService.salvarQuestionarioVaga(
            data.id,
            vagaData.perguntasQuestionario,
            'Questionário da Vaga'
          );
        } catch (questionarioError) {
          console.error('Erro ao salvar questionário:', questionarioError);
          // Continua mesmo se houver erro no questionário
        }
      }

      // Recarregar vagas para pegar os dados completos incluindo consultores
      await loadVagas();
      
      // Limpar filtros para garantir que a nova vaga apareça
      setSearchTerm('');
      setEmpresaFilter('todas');
      setConsultorFilter('todos');
      setDataInicioFilter('');
      setDataFimFilter('');
      setCurrentPage(1);
      
      setIsAddModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Vaga criada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar vaga:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar vaga: " + (error as any)?.message,
        variant: "destructive",
      });
    }
  };

  // Funções do menu de ações
  const handleEditVaga = (vaga: Vaga) => {
    setSelectedVaga(vaga);
    setIsEditModalOpen(true);
  };

  const handleUpdateVaga = async (vagaData: any) => {
    if (!selectedVaga) return;
    
    try {
      // Função auxiliar para converter string vazia em null
      const parseDate = (dateString: string) => {
        return dateString && dateString.trim() !== '' ? dateString : null;
      };

      // Atualizar a vaga
      const { data, error } = await supabase
        .from('vagas')
        .update({
          numero_vaga: vagaData.numeroVaga,
          empresa_id: vagaData.empresaId,
          contato_envio_cv: vagaData.contatoEnvioCv,
          email: vagaData.email,
          celular: vagaData.celular,
          cargo: vagaData.cargo,
          salario: vagaData.salario,
          local_trabalho: vagaData.localTrabalho,
          data_recebimento: vagaData.dataRecebimento,
          data_formatacao_perfil: parseDate(vagaData.dataFormatacaoPerfil),
          data_divulgacao: parseDate(vagaData.dataDivulgacao),
          data_inicio_selecao: parseDate(vagaData.dataInicioSelecao),
          data_envio_curriculos: parseDate(vagaData.dataEnvioCurriculos),
          data_encerramento: parseDate(vagaData.dataEncerramento),
          perfil_word: vagaData.perfilWord,
          informacoes_complementares: vagaData.informacoesComplementares,
          questionario_tecnico: vagaData.questionarioTecnico,
          observacoes: vagaData.observacoes,
          consultor_id: vagaData.consultoresIds?.[0] || null, // Manter compatibilidade
        })
        .eq('id', selectedVaga.id)
        .select(`
          *,
          empresa:clientes(razao_social, cnpj)
        `)
        .single();

      if (error) throw error;

      // Atualizar consultores na tabela vagas_consultores
      // 1. Deletar consultores existentes
      await supabase
        .from('vagas_consultores')
        .delete()
        .eq('vaga_id', selectedVaga.id);

      // 2. Inserir novos consultores
      if (vagaData.consultoresIds && vagaData.consultoresIds.length > 0) {
        const consultoresInsert = vagaData.consultoresIds.map((consultorId: string) => ({
          vaga_id: selectedVaga.id,
          consultor_id: consultorId
        }));

        const { error: consultoresError } = await supabase
          .from('vagas_consultores')
          .insert(consultoresInsert);

        if (consultoresError) {
          console.error('Erro ao atualizar consultores:', consultoresError);
        }
      }

      // Recarregar vagas para pegar os dados completos
      await loadVagas();
      
      setIsEditModalOpen(false);
      setSelectedVaga(null);
      
      toast({
        title: "Sucesso",
        description: "Vaga atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar vaga:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar vaga",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (vaga: Vaga, newStatus: string) => {
    // Validações de regras de negócio
    if (vaga.status === 'encerrada' && newStatus === 'publicada') {
      toast({
        title: "Ação não permitida",
        description: "Não é possível publicar uma vaga encerrada. Vagas encerradas são definitivas.",
        variant: "destructive",
      });
      return;
    }

    if (newStatus === 'publicada' && !['rascunho', 'pausada', 'em_analise'].includes(vaga.status)) {
      toast({
        title: "Ação não permitida",
        description: `Não é possível publicar vaga com status '${vaga.status}'. Apenas vagas em rascunho, pausadas ou em análise podem ser publicadas.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = { status: newStatus };
      
      // Se estiver encerrando a vaga, definir data de encerramento
      if (newStatus === 'encerrada' && !vaga.data_encerramento) {
        updateData.data_encerramento = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('vagas')
        .update(updateData)
        .eq('id', vaga.id)
        .select(`
          *,
          empresa:clientes(razao_social, cnpj),
          consultor:usuarios(nome, email)
        `)
        .single();

      if (error) throw error;

      setVagas(prev => prev.map(v => v.id === vaga.id ? data : v));
      
      const statusLabels: Record<string, string> = {
        'rascunho': 'Rascunho',
        'publicada': 'Publicada',
        'pausada': 'Pausada',
        'em_analise': 'Em Análise',
        'encerrada': 'Encerrada'
      };
      
      toast({
        title: "Sucesso",
        description: `Status da vaga alterado para ${statusLabels[newStatus] || newStatus}`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da vaga",
        variant: "destructive",
      });
    }
  };

  const handleEncerrarVaga = (vaga: Vaga) => {
    setVagaToEncerrar(vaga);
    setIsEncerrarModalOpen(true);
  };

  const confirmEncerrarVaga = async () => {
    if (!vagaToEncerrar) return;
    
    await handleChangeStatus(vagaToEncerrar, 'encerrada');
    setIsEncerrarModalOpen(false);
    setVagaToEncerrar(null);
  };

  const cancelEncerrarVaga = () => {
    setIsEncerrarModalOpen(false);
    setVagaToEncerrar(null);
  };

  const handleDeleteVaga = async (vaga: Vaga) => {
    if (!confirm(`Tem certeza que deseja excluir a vaga ${vaga.numero_vaga}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vagas')
        .delete()
        .eq('id', vaga.id);

      if (error) throw error;

      setVagas(prev => prev.filter(v => v.id !== vaga.id));
      
      toast({
        title: "Sucesso",
        description: "Vaga excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir vaga:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir vaga",
        variant: "destructive",
      });
    }
  };

  const handleViewCandidates = (vaga: Vaga) => {
    // Abrir kanban da vaga
    setSelectedVaga(vaga);
    setViewMode('kanban');
  };

  // Funções para filtros avançados
  const clearAllFilters = () => {
    setSearchTerm('');
    setEmpresaFilter('todas');
    setConsultorFilter('todos');
    setDataInicioFilter('');
    setDataFimFilter('');
  };

  const hasActiveFilters = () => {
    return searchTerm || 
           empresaFilter !== 'todas' || 
           consultorFilter !== 'todos' || 
           dataInicioFilter || 
           dataFimFilter;
  };

  // Obter empresas e consultores únicos para filtros
  const empresasUnicas = Array.from(new Set(vagas.map(v => v.empresa_id))).map(id => {
    const vaga = vagas.find(v => v.empresa_id === id);
    return {
      id: id.toString(),
      razao_social: vaga?.empresa?.razao_social || 'Empresa não encontrada'
    };
  });

  // Extrair todos os consultores únicos de todas as vagas com seus IDs reais
  const todosConsultores = vagas.flatMap(v => 
    v.consultores?.map(c => ({ id: c.id, nome: c.nome, email: c.email })) || []
  );
  
  const consultoresUnicos = Array.from(
    new Map(todosConsultores.map(c => [c.id, c])).values()
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedVaga && (
              <Button variant="outline" size="icon" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {selectedVaga ? selectedVaga.cargo : 'Vagas'}
              </h1>
              <p className="text-muted-foreground">
                {selectedVaga 
                  ? `Vaga ${selectedVaga.numero_vaga}`
                  : `Gerencie os processos de recrutamento e seleção (${filteredVagas.length} vagas)`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedVaga && (
              <Button onClick={handleAddCandidate}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Candidato
              </Button>
            )}
            {!selectedVaga && (
              <Button 
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Vaga
              </Button>
            )}
          </div>
        </div>

        {/* Kanban View */}
        {selectedVaga && viewMode === 'kanban' ? (
          <div>
            <KanbanBoard
              candidates={selectedVagaCandidatos}
              onCandidateUpdate={handleCandidateUpdate}
              onAddCandidate={handleAddCandidate}
              onViewDetails={handleViewCandidateDetails}
              onSendEmail={handleSendEmailToCandidate}
              onViewCurriculo={handleViewCurriculo}
              onCandidatesUpdate={setSelectedVagaCandidatos}
              vagaId={selectedVaga.id}
              vagaTitulo={selectedVaga.cargo}
            />
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {vagas.filter(v => v.status === 'publicada').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Vagas Publicadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-success">
                    {vagas.filter(v => v.status === 'pausada').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Vagas Pausadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-warning">
                    {vagas.filter(v => v.status === 'encerrada').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Vagas Encerradas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">{vagas.length}</div>
                  <p className="text-sm text-muted-foreground">Total de Vagas</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Filtros Básicos */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por cargo, empresa, número da vaga, consultor..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} Filtros Avançados
                    </Button>
                    {hasActiveFilters() && (
                      <Button 
                        variant="outline" 
                        onClick={clearAllFilters}
                        className="text-destructive hover:text-destructive"
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </div>

                  {/* Filtros Avançados */}
                  {showAdvancedFilters && (
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium text-sm">Filtros Avançados</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Filtro por Empresa */}
                        <div className="space-y-2">
                          <Label className="text-sm">Empresa</Label>
                          <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas as empresas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas as empresas</SelectItem>
                              {empresasUnicas.map((empresa) => (
                                <SelectItem key={empresa.id} value={empresa.id}>
                                  {empresa.razao_social}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filtro por Consultor */}
                        <div className="space-y-2">
                          <Label className="text-sm">Consultor</Label>
                          <Select value={consultorFilter} onValueChange={setConsultorFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos os consultores" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos os consultores</SelectItem>
                              {consultoresUnicos.map((consultor) => (
                                <SelectItem key={consultor.id} value={consultor.id}>
                                  {consultor.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filtro por Data de Recebimento */}
                        <div className="space-y-2">
                          <Label className="text-sm">Data de Recebimento (Início)</Label>
                          <Input
                            type="date"
                            value={dataInicioFilter}
                            onChange={(e) => setDataInicioFilter(e.target.value)}
                            placeholder="Data inicial"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Data de Recebimento (Fim)</Label>
                          <Input
                            type="date"
                            value={dataFimFilter}
                            onChange={(e) => setDataFimFilter(e.target.value)}
                            placeholder="Data final"
                          />
                        </div>
                      </div>

                      {/* Resumo dos Filtros Ativos */}
                      {hasActiveFilters() && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm mb-2">Filtros Ativos:</h5>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {searchTerm && (
                              <Badge variant="secondary">Busca: "{searchTerm}"</Badge>
                            )}
                            {empresaFilter !== 'todas' && (
                              <Badge variant="secondary">
                                Empresa: {empresasUnicas.find(e => e.id === empresaFilter)?.razao_social}
                              </Badge>
                            )}
                            {consultorFilter !== 'todos' && (
                              <Badge variant="secondary">
                                Consultor: {consultoresUnicos.find(c => c.id === consultorFilter)?.nome}
                              </Badge>
                            )}
                            {dataInicioFilter && (
                              <Badge variant="secondary">Data início: {dataInicioFilter}</Badge>
                            )}
                            {dataFimFilter && (
                              <Badge variant="secondary">Data fim: {dataFimFilter}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vagas List */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Carregando vagas...</p>
                    </div>
                  </div>
                ) : filteredVagas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchTerm
                        ? "Nenhuma vaga corresponde aos critérios de busca."
                        : "Comece adicionando sua primeira vaga."
                      }
                    </p>
                    {!searchTerm && (
                      <PermissionGuard permissao="vagas_criar">
                        <Button onClick={() => setIsAddModalOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Vaga
                        </Button>
                      </PermissionGuard>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Cargo</th>
                            <th className="text-left p-3 font-medium">Número</th>
                            <th className="text-left p-3 font-medium">Empresa</th>
                            <th className="text-left p-3 font-medium">Contato</th>
                            <th className="text-left p-3 font-medium">Consultor</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium w-20">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedVagas.map((vaga, index) => (
                            <tr 
                              key={vaga.id} 
                              className={`border-b hover:bg-muted/30 transition-colors ${
                                index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{vaga.cargo}</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                #{vaga.numero_vaga}
                              </td>
                              <td className="p-3 text-sm">
                                {vaga.empresa?.razao_social || '-'}
                              </td>
                              <td className="p-3 text-sm">
                                <div>
                                  <div className="font-medium">{vaga.contato_envio_cv}</div>
                                  <div className="text-muted-foreground text-xs">{vaga.email}</div>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {vaga.consultores && vaga.consultores.length > 0 
                                  ? vaga.consultores.map(c => c.nome).join(', ')
                                  : '-'}
                              </td>
                              <td className="p-3">
                                {getStatusBadge(vaga)}
                              </td>
                              <td className="p-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewKanban(vaga)}>
                                      <Kanban className="mr-2 h-4 w-4" />
                                      Gerenciar Kanban
                                    </DropdownMenuItem>
                                    <PermissionGuard permissao="vagas_editar">
                                      <DropdownMenuItem onClick={() => handleEditVaga(vaga)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Editar Vaga
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                    {vaga.status === 'publicada' && (
                                      <DropdownMenuItem 
                                        onClick={() => window.open(`/vaga/${vaga.id}`, '_blank')}
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Ver Vaga Pública
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {/* Ação Pausar - só mostra se estiver publicada */}
                                    {vaga.status === 'publicada' && (
                                      <DropdownMenuItem 
                                        onClick={() => handleChangeStatus(vaga, 'pausada')}
                                      >
                                        <Pause className="mr-2 h-4 w-4" />
                                        Pausar Vaga
                                      </DropdownMenuItem>
                                    )}
                                    {/* Ação Publicar - só mostra se estiver pausada, rascunho ou em_analise */}
                                    {['pausada', 'rascunho', 'em_analise'].includes(vaga.status) && (
                                      <DropdownMenuItem 
                                        onClick={() => handleChangeStatus(vaga, 'publicada')}
                                      >
                                        <Play className="mr-2 h-4 w-4" />
                                        Publicar Vaga
                                      </DropdownMenuItem>
                                    )}
                                    {/* Ação Encerrar - só mostra se não estiver encerrada */}
                                    {vaga.status !== 'encerrada' && (
                                      <DropdownMenuItem 
                                        onClick={() => handleEncerrarVaga(vaga)}
                                        className="text-warning"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Encerrar Vaga
                                      </DropdownMenuItem>
                                    )}
                                    <PermissionGuard permissao="vagas_excluir">
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteVaga(vaga)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir Vaga
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVagas.length)} de {filteredVagas.length} vagas
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
          </>
        )}

        {/* Modal de Adicionar Vaga */}
        <AddVagaModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddVaga}
        />

        {/* Modal de Editar Vaga */}
        <EditVagaModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedVaga(null);
          }}
          onSubmit={handleUpdateVaga}
          vaga={selectedVaga}
        />

        {/* Modal de Adicionar Candidato */}
        {selectedVaga && (
          <AddCandidatoModal
            isOpen={isAddCandidatoModalOpen}
            onClose={() => setIsAddCandidatoModalOpen(false)}
            onSuccess={async () => {
              // Recarregar candidatos da vaga específica
              if (selectedVaga) {
                const candidatos = await loadCandidatosVaga(selectedVaga.id);
                setSelectedVagaCandidatos(candidatos);
              }
              // Fechar o modal
              setIsAddCandidatoModalOpen(false);
            }}
            vagaId={selectedVaga.id}
            vagaCargo={selectedVaga.cargo}
          />
        )}

        {/* Modal de Detalhes do Candidato */}
        <CandidatoDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          onSendEmail={handleSendEmailToCandidate}
        />

        {/* Modal de Email */}
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          vagaCargo={selectedVaga?.cargo}
          vagaEmpresa={selectedVaga?.empresa?.razao_social}
        />

        {/* Modal de Visualização de PDF */}
        <PdfViewerModal
          isOpen={isPdfViewerOpen}
          onClose={() => {
            setIsPdfViewerOpen(false);
            setPdfUrl('');
            setPdfFileName('');
            setPdfFileType('');
            setSelectedCandidate(null);
          }}
          pdfUrl={pdfUrl}
          candidateName={selectedCandidate?.name || ''}
          fileName={pdfFileName}
          fileType={pdfFileType}
        />

        {/* Modal de Confirmação para Encerrar Vaga */}
        <AlertDialog open={isEncerrarModalOpen} onOpenChange={setIsEncerrarModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Encerramento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja encerrar a vaga <strong>{vagaToEncerrar?.numero_vaga}</strong> - <strong>{vagaToEncerrar?.cargo}</strong>?
                <br /><br />
                <span className="text-red-600 font-medium">
                  ⚠️ Após encerrada, a vaga não poderá mais receber candidaturas e não será possível publicá-la novamente.
                </span>
                <br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelEncerrarVaga}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmEncerrarVaga}
                className="bg-red-600 hover:bg-red-700"
              >
                Sim, Encerrar Vaga
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Vagas; 