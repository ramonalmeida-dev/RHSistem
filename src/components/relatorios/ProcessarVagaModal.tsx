import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  FileText, 
  User, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PosicoesFechadasService } from "@/lib/posicoesFechadasService";

interface Vaga {
  id: string;
  numero_vaga: string;
  cargo: string;
  empresa_nome: string;
  consultor_nome: string;
  data_recebimento: string;
  data_encerramento: string;
  candidatos_aprovados: Array<{
    id: string;
    nome: string;
    email: string;
  }>;
}

interface ProcessarVagaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ProcessarVagaModal = ({ open, onOpenChange, onSuccess }: ProcessarVagaModalProps) => {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      loadVagas();
    }
  }, [open]);

  const loadVagas = async () => {
    setLoading(true);
    try {
      // Buscar vagas que têm candidatos aprovados mas não foram processadas
      const { data, error } = await supabase
        .from('vagas')
        .select(`
          id,
          numero_vaga,
          cargo,
          data_recebimento,
          data_encerramento,
          clientes!inner(razao_social),
          usuarios!inner(nome),
          candidatos_vagas!inner(
            candidato_id,
            status_atual,
            candidatos!inner(id, nome, email)
          )
        `)
        .eq('candidatos_vagas.status_atual', 'aprovado')
        .not('id', 'in', `(SELECT vaga_id FROM posicoes_fechadas)`);

      if (error) throw error;

      // Processar dados
      const vagasProcessadas = data?.map((vaga: any) => ({
        id: vaga.id,
        numero_vaga: vaga.numero_vaga,
        cargo: vaga.cargo,
        empresa_nome: vaga.clientes.razao_social,
        consultor_nome: vaga.usuarios.nome,
        data_recebimento: vaga.data_recebimento,
        data_encerramento: vaga.data_encerramento,
        candidatos_aprovados: vaga.candidatos_vagas
          .filter((cv: any) => cv.status_atual === 'aprovado')
          .map((cv: any) => ({
            id: cv.candidatos.id,
            nome: cv.candidatos.nome,
            email: cv.candidatos.email
          }))
      })) || [];

      setVagas(vagasProcessadas);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessVaga = async (vagaId: string) => {
    setProcessing(true);
    try {
      await PosicoesFechadasService.processVaga(vagaId);
      toast.success('Vaga processada com sucesso!');
      loadVagas(); // Recarregar lista
      onSuccess(); // Atualizar lista principal
    } catch (error) {
      console.error('Erro ao processar vaga:', error);
      toast.error('Erro ao processar vaga');
    } finally {
      setProcessing(false);
    }
  };

  const filteredVagas = vagas.filter(vaga =>
    vaga.numero_vaga.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Processar Vagas para Posições Fechadas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por vaga, cargo ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Vagas */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredVagas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma vaga encontrada' : 'Nenhuma vaga pendente de processamento'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca'
                  : 'As vagas aparecerão aqui quando houver candidatos aprovados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVagas.map((vaga) => (
                <Card key={vaga.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{vaga.numero_vaga} - {vaga.cargo}</h3>
                          <Badge variant="outline">
                            {vaga.candidatos_aprovados.length} aprovado(s)
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p><strong>Empresa:</strong> {vaga.empresa_nome}</p>
                            <p><strong>Consultor:</strong> {vaga.consultor_nome}</p>
                          </div>
                          <div>
                            <p><strong>Recebimento:</strong> {new Date(vaga.data_recebimento).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Encerramento:</strong> {new Date(vaga.data_encerramento).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>

                        {/* Candidatos Aprovados */}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Candidatos Aprovados:</p>
                          <div className="flex flex-wrap gap-2">
                            {vaga.candidatos_aprovados.map((candidato) => (
                              <Badge key={candidato.id} variant="secondary" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {candidato.nome}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button
                          onClick={() => handleProcessVaga(vaga.id)}
                          disabled={processing}
                          className="whitespace-nowrap"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Processar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 