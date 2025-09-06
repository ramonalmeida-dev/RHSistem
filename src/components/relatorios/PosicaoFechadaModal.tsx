import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { 
  PosicoesFechadasService, 
  PosicaoFechada, 
  CurriculoAtualizado, 
  HistoricoEmail 
} from "@/lib/posicoesFechadasService";
import { InformacoesVaga } from "./InformacoesVaga";
import { CandidatosAprovados } from "./CandidatosAprovados";
import { EnvioEmail } from "./EnvioEmail";
import { HistoricoEmails } from "./HistoricoEmails";
import { CandidatosContratados } from "./CandidatosContratados";

interface PosicaoFechadaModalProps {
  posicao: PosicaoFechada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onStatusUpdate?: (updatedPosicao: PosicaoFechada) => void;
}

export const PosicaoFechadaModal = ({ posicao, open, onOpenChange, onRefresh, onStatusUpdate }: PosicaoFechadaModalProps) => {
  const [curriculosAtualizados, setCurriculosAtualizados] = useState<CurriculoAtualizado[]>([]);
  const [historicoEmails, setHistoricoEmails] = useState<HistoricoEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [candidatosData, setCandidatosData] = useState<Record<string, {
    pretensaoSalarial: string;
    regimeTrabalho: string;
    observacoes: string;
  }>>({});

  useEffect(() => {
    if (posicao && open) {
      loadData();
    }
  }, [posicao, open]);

  const loadData = async () => {
    if (!posicao) return;
    
    setLoading(true);
    try {
      const [curriculos, historico] = await Promise.all([
        PosicoesFechadasService.getCurriculosAtualizados(posicao.id),
        PosicoesFechadasService.getHistoricoEmails(posicao.id)
      ]);
      
      setCurriculosAtualizados(curriculos);
      setHistoricoEmails(historico);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da posição');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    onRefresh();
  };

  const handleStatusUpdate = (updatedPosicao: PosicaoFechada) => {
    if (onStatusUpdate) {
      onStatusUpdate(updatedPosicao);
    }
    handleRefresh();
  };

  if (!posicao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Posição Fechada - {posicao.cargo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {posicao.status_posicao === 'contratado' ? (
            // Visualização simplificada para vagas contratadas
            <CandidatosContratados 
              posicao={posicao}
              onRefresh={handleRefresh}
            />
          ) : (
            // Visualização completa para vagas em processo
            <>
              <InformacoesVaga
                posicao={posicao}
                onRefresh={handleRefresh}
                onStatusUpdate={handleStatusUpdate}
              />

              <CandidatosAprovados 
                posicao={posicao}
                curriculosAtualizados={curriculosAtualizados}
                onRefresh={handleRefresh}
                onCandidatoDataChange={setCandidatosData}
              />

              <EnvioEmail 
                posicao={posicao}
                curriculosAtualizados={curriculosAtualizados}
                candidatosData={candidatosData}
                onRefresh={handleRefresh}
              />

              {historicoEmails.length > 0 && (
                <HistoricoEmails historicoEmails={historicoEmails} />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 