import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PosicaoFechada } from "@/lib/posicoesFechadasService";
import { PosicoesFechadasService } from "@/lib/posicoesFechadasService";

interface InformacoesVagaProps {
  posicao: PosicaoFechada;
  onRefresh: () => void;
}

const STATUS_COLORS = {
  em_analise: "bg-yellow-100 text-yellow-800",
  em_entrevista: "bg-blue-100 text-blue-800",
  em_entrevista_final: "bg-purple-100 text-purple-800",
  aprovado: "bg-green-100 text-green-800",
  contratado: "bg-emerald-100 text-emerald-800",
  desistiu: "bg-red-100 text-red-800"
};

const STATUS_LABELS = {
  em_analise: "Em Análise",
  em_entrevista: "Em Entrevista",
  em_entrevista_final: "Em Entrevista Final",
  aprovado: "Aprovado",
  contratado: "Contratado",
  desistiu: "Desistiu"
};

export const InformacoesVaga = ({ posicao, onRefresh }: InformacoesVagaProps) => {
  const handleUpdateStatus = async (newStatus: PosicaoFechada['status_posicao']) => {
    try {
      await PosicoesFechadasService.updateStatus(posicao.id, newStatus);
      toast.success('Status atualizado com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Informações da Vaga</span>
          <Badge className={STATUS_COLORS[posicao.status_posicao]}>
            {STATUS_LABELS[posicao.status_posicao]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Número da Vaga</Label>
            <p className="text-sm text-muted-foreground">{posicao.numero_vaga}</p>
          </div>
          <div>
            <Label>Empresa</Label>
            <p className="text-sm text-muted-foreground">{posicao.empresa_nome}</p>
          </div>
          <div>
            <Label>Consultor</Label>
            <p className="text-sm text-muted-foreground">{posicao.consultor_nome}</p>
          </div>
          <div>
            <Label>Data de Encerramento</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(posicao.data_encerramento).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={posicao.status_posicao} onValueChange={handleUpdateStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="em_entrevista">Em Entrevista</SelectItem>
                <SelectItem value="em_entrevista_final">Em Entrevista Final</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="contratado">Contratado</SelectItem>
                <SelectItem value="desistiu">Desistiu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Fluxo:</strong> Em Análise → Em Entrevista → Em Entrevista Final → Aprovado → Contratado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 