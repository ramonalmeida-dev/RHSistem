import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  UserX, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Mail,
  Eye,
  TrendingUp,
  Users,
  Clock,
  Award,
  AlertCircle,
  Search,
  Filter,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useBrevoEmail } from '@/hooks/useBrevoEmail';
import { EmailConfirmationModal } from './EmailConfirmationModal';

export const CANDIDATE_STATUSES = {
  selecionando: {
    id: 'selecionando',
    title: 'Selecionando',
    icon: Users,
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Candidatos em processo de seleção'
  },
  curriculo_enviado: {
    id: 'curriculo_enviado',
    title: 'CV Enviado',
    icon: FileText,
    color: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-700',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    description: 'Currículos enviados para análise'
  },
  entrevista_agendada: {
    id: 'entrevista_agendada',
    title: 'Entrevista',
    icon: Calendar,
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: 'Entrevistas agendadas'
  },
  aprovado: {
    id: 'aprovado',
    title: 'Aprovado',
    icon: Award,
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-800',
    description: 'Candidatos aprovados'
  },
  reprovado: {
    id: 'reprovado',
    title: 'Reprovado',
    icon: XCircle,
    color: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-800',
    description: 'Candidatos reprovados'
  },
  desistiu: {
    id: 'desistiu',
    title: 'Desistiu',
    icon: UserX,
    color: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-700',
    badgeColor: 'bg-gray-100 text-gray-800',
    description: 'Candidatos que desistiram'
  }
};

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  status: keyof typeof CANDIDATE_STATUSES;
  appliedDate: string;
  cvSentDate?: string;
  interviewDate?: string;
  consultant: string;
  notes?: string;
  rating?: number;
  experience?: string;
  skills?: string[];
  fonte_candidatura?: string;
}

interface KanbanBoardProps {
  candidates: Candidate[];
  onCandidateUpdate: (candidateId: string, newStatus: keyof typeof CANDIDATE_STATUSES) => void;
  onAddCandidate?: () => void;
  onViewDetails?: (candidate: Candidate) => void;
  onSendEmail?: (candidate: Candidate) => void;
  onViewCurriculo?: (candidate: Candidate) => void;
  onCandidatesUpdate?: (candidates: Candidate[]) => void;
  vagaId?: string;
  vagaTitulo?: string;
}

// Componente de card do candidato
function CandidateCard({ 
  candidate, 
  index,
  onViewDetails, 
  onSendEmail,
  onRatingUpdate,
  onViewCurriculo
}: { 
  candidate: Candidate;
  index: number;
  onViewDetails?: (candidate: Candidate) => void;
  onSendEmail?: (candidate: Candidate) => void;
  onRatingUpdate?: (candidate: Candidate, newRating: number) => void;
  onViewCurriculo?: (candidate: Candidate) => void;
}) {
  const statusConfig = CANDIDATE_STATUSES[candidate.status];

  const handleStarClick = (candidate: Candidate, rating: number) => {
    onRatingUpdate?.(candidate, rating);
  };

  return (
    <Draggable draggableId={candidate.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 mb-3 ${
            snapshot.isDragging 
              ? 'shadow-lg rotate-1 scale-105 border-blue-400' 
              : 'hover:border-blue-300'
          }`}
        >
          <div className="p-3">
            {/* Header do card */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate text-sm">
                    {candidate.name}
                  </h4>
                  {candidate.fonte_candidatura === 'portal_externo' && (
                    <Badge 
                      className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5"
                      title="Candidatura via portal externo"
                    >
                      Site
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {candidate.jobTitle}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div 
                  className="flex items-center bg-yellow-50 px-2 py-1 rounded-full"
                  title="Clique nas estrelas para alterar avaliação"
                >
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-xs cursor-pointer transition-colors hover:scale-110 ${
                        i < (candidate.rating || 0) ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStarClick(candidate, i + 1);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Informações do candidato */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="truncate">{candidate.company}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{candidate.email}</span>
              </div>
              {candidate.experience && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>{candidate.experience}</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                      +{candidate.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Footer do card */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {new Date(candidate.appliedDate).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(candidate);
                  }}
                  title="Ver detalhes"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-purple-50 hover:text-purple-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewCurriculo?.(candidate);
                  }}
                  title="Ver currículo"
                >
                  <FileText className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-green-50 hover:text-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendEmail?.(candidate);
                  }}
                  title="Enviar email"
                >
                  <Mail className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// Componente de coluna
function KanbanColumn({ 
  status, 
  candidates, 
  onViewDetails, 
  onSendEmail,
  onRatingUpdate,
  onViewCurriculo
}: { 
  status: keyof typeof CANDIDATE_STATUSES;
  candidates: Candidate[];
  onViewDetails?: (candidate: Candidate) => void;
  onSendEmail?: (candidate: Candidate) => void;
  onRatingUpdate?: (candidate: Candidate, newRating: number) => void;
  onViewCurriculo?: (candidate: Candidate) => void;
}) {
  const statusConfig = CANDIDATE_STATUSES[status];
  const Icon = statusConfig.icon;

  return (
    <div className="flex flex-col h-full">
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`h-full rounded-xl border-2 p-4 transition-all duration-200 ${
              statusConfig.color
            } ${
              snapshot.isDraggingOver 
                ? 'border-blue-400 bg-blue-25 shadow-lg' 
                : ''
            }`}
          >
            {/* Header da coluna */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${statusConfig.badgeColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${statusConfig.textColor}`}>
                    {statusConfig.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {statusConfig.description}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white text-gray-700">
                {candidates.length}
              </Badge>
            </div>
            
            {/* Lista de candidatos */}
            <div className="space-y-2 flex-1">
              {candidates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nenhum candidato</p>
                </div>
              ) : (
                candidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={index}
                    onViewDetails={onViewDetails}
                    onSendEmail={onSendEmail}
                    onRatingUpdate={onRatingUpdate}
                    onViewCurriculo={onViewCurriculo}
                  />
                ))
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}

export function KanbanBoard({
  candidates,
  onCandidateUpdate,
  onAddCandidate,
  onViewDetails,
  onSendEmail,
  onViewCurriculo,
  onCandidatesUpdate,
  vagaId,
  vagaTitulo
}: KanbanBoardProps) {
  const { toast } = useToast();
  const { sendNotificacaoKanban, isLoading: emailLoading } = useBrevoEmail();
  
  // Estados para modal de confirmação de email
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    candidate: any;
    newStatus: string;
    oldStatus: string;
    statusTitle: string;
  } | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Candidatos filtrados
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Filtro por busca (nome)
      if (searchTerm && !candidate.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por status
      if (statusFilter !== 'all' && candidate.status !== statusFilter) {
        return false;
      }

      // Filtro por avaliação
      if (ratingFilter !== 'all') {
        const rating = candidate.rating || 0;
        switch (ratingFilter) {
          case '0':
            if (rating !== 0) return false;
            break;
          case '1-2':
            if (rating < 1 || rating > 2) return false;
            break;
          case '3-4':
            if (rating < 3 || rating > 4) return false;
            break;
          case '5':
            if (rating !== 5) return false;
            break;
        }
      }

      // Filtro por data
      if (dateFilter !== 'all') {
        const candidateDate = new Date(candidate.appliedDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - candidateDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            if (diffDays !== 0) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [candidates, searchTerm, statusFilter, ratingFilter, dateFilter]);

  // Agrupar candidatos por status
  const candidatesByStatus = useMemo(() => {
    const grouped: Record<string, Candidate[]> = {};
    
    Object.keys(CANDIDATE_STATUSES).forEach(status => {
      grouped[status] = filteredCandidates.filter(c => c.status === status);
    });
    
    return grouped;
  }, [filteredCandidates]);

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRatingFilter('all');
    setDateFilter('all');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' || dateFilter !== 'all';

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino válido, não faz nada
    if (!destination) return;

    // Se o destino é o mesmo da origem, não faz nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const candidate = candidates.find(c => c.id === draggableId);
    if (!candidate) return;

    const newStatus = destination.droppableId as keyof typeof CANDIDATE_STATUSES;
    
    if (candidate.status !== newStatus) {
      // Abrir modal de confirmação de email
      setPendingStatusChange({
        candidate,
        newStatus,
        oldStatus: candidate.status,
        statusTitle: CANDIDATE_STATUSES[newStatus].title
      });
      setEmailModalOpen(true);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    const { candidate, newStatus } = pendingStatusChange;

    try {
      // Atualizar estado local
      onCandidateUpdate(candidate.id, newStatus as keyof typeof CANDIDATE_STATUSES);

      // Salvar no banco de dados
      if (vagaId) {
        const { error } = await supabase
          .from('candidatos_vagas')
          .update({
            status_atual: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('candidato_id', candidate.id)
          .eq('vaga_id', vagaId);

        if (error) {
          toast({
            title: "Erro",
            description: `Erro ao salvar mudança de status: ${error.message}`,
            variant: "destructive",
          });
          // Reverter a mudança no estado local
          onCandidateUpdate(candidate.id, candidate.status);
          return;
        }

        toast({
          title: "Status atualizado",
          description: `${candidate.name} movido para ${CANDIDATE_STATUSES[newStatus].title}`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar mudança de status",
        variant: "destructive",
      });
      // Reverter a mudança no estado local
      onCandidateUpdate(candidate.id, candidate.status);
    } finally {
      // Limpar estado pendente
      setPendingStatusChange(null);
    }
  };

  const handleCloseEmailModal = () => {
    setEmailModalOpen(false);
    setPendingStatusChange(null);
  };

  const handleRatingUpdate = async (candidate: Candidate, newRating: number) => {
    if (candidate.rating === newRating) {
      return; // Não faz nada se a avaliação já for a mesma
    }

    // Atualizar imediatamente a interface
    const updatedCandidates = candidates.map(c => 
      c.id === candidate.id 
        ? { ...c, rating: newRating }
        : c
    );

    // Atualizar o estado imediatamente
    onCandidatesUpdate?.(updatedCandidates);

    try {
      const { error } = await supabase
        .from('candidatos_vagas')
        .update({ avaliacao: newRating })
        .eq('candidato_id', candidate.id)
        .eq('vaga_id', vagaId);

      if (error) {
        toast({
          title: "Erro ao salvar avaliação",
          description: `Erro ao salvar avaliação: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Avaliação atualizada",
        description: `${candidate.name} recebeu ${newRating} estrela${newRating > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar avaliação",
        description: "Erro ao salvar avaliação",
        variant: "destructive",
      });
    }
  };

  // Calcular estatísticas
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter(c => 
    ['selecionando', 'curriculo_enviado', 'entrevista_agendada'].includes(c.status)
  ).length;
  const approvedCandidates = candidates.filter(c => c.status === 'aprovado').length;

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(CANDIDATE_STATUSES).map(([statusKey, statusConfig]) => {
          const count = candidatesByStatus[statusKey]?.length || 0;
          return (
            <Card key={statusKey} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{statusConfig.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${statusConfig.color}`}>
                    <statusConfig.icon className={`h-5 w-5 ${statusConfig.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filteredCandidates.length} de {candidates.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca por nome */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Buscar por nome</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Etapa</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as etapas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {Object.entries(CANDIDATE_STATUSES).map(([key, status]) => (
                    <SelectItem key={key} value={key}>
                      {status.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por avaliação */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Avaliação</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as avaliações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as avaliações</SelectItem>
                  <SelectItem value="0">Sem avaliação</SelectItem>
                  <SelectItem value="1-2">1-2 estrelas</SelectItem>
                  <SelectItem value="3-4">3-4 estrelas</SelectItem>
                  <SelectItem value="5">5 estrelas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por data */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data de candidatura</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as datas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 min-h-[600px]">
          {Object.entries(CANDIDATE_STATUSES).map(([statusKey, statusConfig]) => (
            <KanbanColumn
              key={statusKey}
              status={statusKey as keyof typeof CANDIDATE_STATUSES}
              candidates={candidatesByStatus[statusKey as keyof typeof CANDIDATE_STATUSES] || []}
              onViewDetails={onViewDetails}
              onSendEmail={onSendEmail}
              onRatingUpdate={handleRatingUpdate}
              onViewCurriculo={onViewCurriculo}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Modal de confirmação de email */}
      {pendingStatusChange && (
        <EmailConfirmationModal
          isOpen={emailModalOpen}
          onClose={handleCloseEmailModal}
          onConfirm={handleConfirmStatusChange}
          candidate={pendingStatusChange.candidate}
          newStatus={pendingStatusChange.newStatus}
          oldStatus={pendingStatusChange.oldStatus}
          vagaTitulo={vagaTitulo || `Vaga ${vagaId || 'N/A'}`}
          statusTitle={pendingStatusChange.statusTitle}
        />
      )}
    </div>
  );
} 