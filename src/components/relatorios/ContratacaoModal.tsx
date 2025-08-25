import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { PosicaoFechada, PosicoesFechadasService, Contratacao } from "@/lib/posicoesFechadasService";

interface ContratacaoModalProps {
  posicao: PosicaoFechada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export const ContratacaoModal = ({ posicao, open, onOpenChange, onRefresh }: ContratacaoModalProps) => {
  const [candidatoSelecionado, setCandidatoSelecionado] = useState<string>("");
  const [dataContratacao, setDataContratacao] = useState<string>("");
  const [salarioAcordado, setSalarioAcordado] = useState<string>("");
  const [regimeContratacao, setRegimeContratacao] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);

  // Carregar contratações existentes quando o modal abrir
  useEffect(() => {
    if (posicao && open) {
      loadContratacoes();
    }
  }, [posicao, open]);

  const loadContratacoes = async () => {
    if (!posicao) return;
    try {
      const data = await PosicoesFechadasService.getContratacoes(posicao.id);
      setContratacoes(data);
    } catch (error) {
      console.error('Erro ao carregar contratações:', error);
    }
  };

  // Filtrar candidatos que ainda não foram contratados
  const candidatosDisponiveis = posicao?.candidatos_aprovados.filter(candidato => 
    !contratacoes.some(contratacao => contratacao.candidato_id === candidato.id)
  ) || [];

  const handleConfirmarContratacao = async () => {
    if (!posicao || !candidatoSelecionado || !dataContratacao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await PosicoesFechadasService.registrarContratacao(
        posicao.id,
        candidatoSelecionado,
        dataContratacao,
        salarioAcordado ? parseFloat(salarioAcordado) : undefined,
        regimeContratacao || undefined,
        observacoes || undefined
      );
      
      toast.success('Contratação registrada com sucesso!');
      onRefresh();
      onOpenChange(false);
      
      // Limpar formulário
      setCandidatoSelecionado("");
      setDataContratacao("");
      setSalarioAcordado("");
      setRegimeContratacao("");
      setObservacoes("");
    } catch (error) {
      console.error('Erro ao registrar contratação:', error);
      toast.error('Erro ao registrar contratação');
    } finally {
      setLoading(false);
    }
  };

  if (!posicao) return null;

  const candidatoSelecionadoData = posicao.candidatos_aprovados.find(c => c.id === candidatoSelecionado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Registrar Contratação - {posicao.cargo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Vaga */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Posição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Vaga:</span> {posicao.numero_vaga}
                </div>
                <div>
                  <span className="font-medium">Empresa:</span> {posicao.empresa_nome}
                </div>
                <div>
                  <span className="font-medium">Consultor:</span> {posicao.consultor_nome}
                </div>
                <div>
                  <span className="font-medium">Candidatos:</span> {posicao.candidatos_aprovados.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seleção do Candidato */}
          <div className="space-y-4">
            <div>
              <Label>Candidato Contratado *</Label>
              <Select value={candidatoSelecionado} onValueChange={setCandidatoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o candidato contratado" />
                </SelectTrigger>
                <SelectContent>
                  {candidatosDisponiveis.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      Todos os candidatos já foram contratados
                    </div>
                  ) : (
                    candidatosDisponiveis.map((candidato) => (
                      <SelectItem key={candidato.id} value={candidato.id}>
                        <div className="flex items-center gap-2">
                          <span>{candidato.nome}</span>
                          {candidato.pretensao_salarial && (
                            <Badge variant="outline" className="text-xs">
                              R$ {candidato.pretensao_salarial.toLocaleString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Detalhes do Candidato Selecionado */}
            {candidatoSelecionadoData && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Candidato Selecionado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                    <div>
                      <span className="font-medium">Nome:</span> {candidatoSelecionadoData.nome}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {candidatoSelecionadoData.email}
                    </div>
                    {candidatoSelecionadoData.pretensao_salarial && (
                      <div>
                        <span className="font-medium">Pretensão:</span> R$ {candidatoSelecionadoData.pretensao_salarial.toLocaleString('pt-BR')}
                      </div>
                    )}
                    {candidatoSelecionadoData.regime_trabalho && (
                      <div>
                        <span className="font-medium">Regime:</span> {candidatoSelecionadoData.regime_trabalho}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Dados da Contratação */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Contratação *</Label>
                <Input
                  type="date"
                  value={dataContratacao}
                  onChange={(e) => setDataContratacao(e.target.value)}
                />
              </div>
              <div>
                <Label>Salário Acordado</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={salarioAcordado}
                  onChange={(e) => setSalarioAcordado(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Regime de Contratação</Label>
              <Select value={regimeContratacao} onValueChange={setRegimeContratacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais sobre a contratação..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarContratacao}
              disabled={loading || !candidatoSelecionado || !dataContratacao || candidatosDisponiveis.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Confirmar Contratação
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 