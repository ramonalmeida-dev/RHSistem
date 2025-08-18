import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Building2, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Vaga {
  id: string;
  numero_vaga: string;
  cargo: string;
  salario: string;
  local_trabalho: string;
  status: string;
  empresa: {
    razao_social: string;
  };
}

interface SendToVagaModalProps {
  curriculo: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const SendToVagaModal = ({ curriculo, open, onOpenChange, onSuccess }: SendToVagaModalProps) => {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [selectedVagaId, setSelectedVagaId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVagas, setLoadingVagas] = useState(false);

  useEffect(() => {
    if (open) {
      loadVagas();
      setSelectedVagaId('');
      setObservacoes('');
    }
  }, [open]);

  const loadVagas = async () => {
    try {
      setLoadingVagas(true);
      const { data, error } = await supabase
        .from('vagas')
        .select(`
          id,
          numero_vaga,
          cargo,
          salario,
          local_trabalho,
          status,
          empresa:clientes(razao_social)
        `)
        .in('status', ['publicada', 'em_analise'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar dados para o formato esperado
      const vagasFormatadas = data?.map(vaga => ({
        ...vaga,
        empresa: Array.isArray(vaga.empresa) ? vaga.empresa[0] : vaga.empresa
      })) || [];

      setVagas(vagasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      toast.error('Erro ao carregar vagas disponíveis');
    } finally {
      setLoadingVagas(false);
    }
  };

  const handleSend = async () => {
    if (!selectedVagaId) {
      toast.error('Selecione uma vaga');
      return;
    }

    try {
      setLoading(true);

      // Verificar se já existe candidatura
      const { data: existingCandidatura } = await supabase
        .from('candidatos_vagas')
        .select('id')
        .eq('candidato_id', curriculo.candidato_id)
        .eq('vaga_id', selectedVagaId)
        .single();

      if (existingCandidatura) {
        toast.error('Este candidato já foi enviado para esta vaga');
        return;
      }

      // Criar candidatura
      const { error } = await supabase
        .from('candidatos_vagas')
        .insert({
          candidato_id: curriculo.candidato_id,
          vaga_id: selectedVagaId,
          status_atual: 'curriculo_enviado',
          data_candidatura: new Date().toISOString(),
          observacoes: observacoes || `Currículo enviado via banco de CVs - ${curriculo.nome_arquivo}`,
          fonte_candidatura: 'banco_curriculos'
        });

      if (error) throw error;

      toast.success('Currículo enviado para a vaga com sucesso!');
      onSuccess?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao enviar currículo:', error);
      toast.error('Erro ao enviar currículo para a vaga');
    } finally {
      setLoading(false);
    }
  };

  const selectedVaga = vagas.find(v => v.id === selectedVagaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar Currículo para Vaga</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Candidato */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Candidato</h3>
            <div className="text-sm text-gray-600">
              <p><strong>Nome:</strong> {curriculo.candidato?.nome}</p>
              <p><strong>Email:</strong> {curriculo.candidato?.email}</p>
              <p><strong>Arquivo:</strong> {curriculo.nome_arquivo}</p>
            </div>
          </div>

          {/* Seleção de Vaga */}
          <div className="space-y-2">
            <Label htmlFor="vaga">Selecionar Vaga *</Label>
            {loadingVagas ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando vagas...
              </div>
            ) : (
              <Select value={selectedVagaId} onValueChange={setSelectedVagaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma vaga..." />
                </SelectTrigger>
                <SelectContent>
                  {vagas.map((vaga) => (
                    <SelectItem key={vaga.id} value={vaga.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{vaga.cargo}</span>
                        <span className="text-xs text-gray-500">
                          {vaga.empresa?.razao_social} • Vaga {vaga.numero_vaga}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Detalhes da Vaga Selecionada */}
          {selectedVaga && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">Detalhes da Vaga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>{selectedVaga.empresa?.razao_social}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Vaga {selectedVaga.numero_vaga}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span>R$ {selectedVaga.salario}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>{selectedVaga.local_trabalho}</span>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre o envio (opcional)..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSend}
              className="flex-1"
              disabled={loading || !selectedVagaId || loadingVagas}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Vaga
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 