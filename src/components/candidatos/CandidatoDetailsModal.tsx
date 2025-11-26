import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Phone, 
  Calendar, 
  Star,
  User,
  Building,
  FileText,
  Clock
} from 'lucide-react';
import { Candidate } from '@/components/kanban/KanbanBoard';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CandidatoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onSendEmail?: (candidate: Candidate) => void;
}

export function CandidatoDetailsModal({ 
  isOpen, 
  onClose, 
  candidate, 
  onSendEmail 
}: CandidatoDetailsModalProps) {
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      selecionando: { label: "Em seleção", color: "bg-blue-100 text-blue-800" },
      curriculo_enviado: { label: "CV Enviado", color: "bg-yellow-100 text-yellow-800" },
      entrevista_agendada: { label: "Entrevista na empresa", color: "bg-orange-100 text-orange-800" },
      entrevista_realizada: { label: "Entrevista Realizada", color: "bg-purple-100 text-purple-800" },
      aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800" },
      reprovado: { label: "Reprovado", color: "bg-red-100 text-red-800" },
      desistiu: { label: "Desistiu", color: "bg-gray-100 text-gray-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="text-sm">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{candidate.name}</div>
              <div className="text-sm text-muted-foreground">{candidate.jobTitle}</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status e Informações Básicas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(candidate.status)}
            </div>
            {onSendEmail && (
              <Button onClick={() => onSendEmail(candidate)}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
            )}
          </div>

          {/* Informações de Contato */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Informações de Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm text-muted-foreground">{candidate.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Telefone</div>
                  <div className="text-sm text-muted-foreground">{candidate.phone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Vaga */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Informações da Vaga
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Empresa</div>
                  <div className="text-sm text-muted-foreground">{candidate.company}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Consultor</div>
                  <div className="text-sm text-muted-foreground">{candidate.consultant}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Datas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Data da Candidatura</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(candidate.appliedDate)}
                  </div>
                </div>
              </div>
              {candidate.cvSentDate && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">CV Enviado</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(candidate.cvSentDate)}
                    </div>
                  </div>
                </div>
              )}
              {candidate.interviewDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Entrevista</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(candidate.interviewDate)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Avaliação */}
          {candidate.rating && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Avaliação
              </h3>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < candidate.rating! 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {candidate.rating}/5
                </span>
              </div>
            </div>
          )}

          {/* Observações */}
          {candidate.notes && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Observações
              </h3>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{candidate.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 