import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Users, 
  CheckCircle, 
  Calendar,
  Building2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { CandidatosAprovadosService } from "@/lib/candidatosAprovadosService";

interface CandidatoAprovado {
  id: string;
  nome: string;
  nome_abreviado: string;
  data_aprovacao: string;
  status: 'aprovado' | 'contratado' | 'em_processo';
  vaga_id: string;
  vaga_numero: string;
  vaga_cargo: string;
  empresa_nome: string;
}

interface CandidatosAprovadosModalProps {
  vaga: {
    id: string;
    numero_vaga: string;
    cargo: string;
    empresa: string;
  } | null;
  candidatos: CandidatoAprovado[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidatosAprovadosModal({ 
  vaga, 
  candidatos, 
  open, 
  onOpenChange 
}: CandidatosAprovadosModalProps) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    try {
      setExporting(true);
      
      await CandidatosAprovadosService.exportToExcel(candidatos, vaga?.numero_vaga || '');
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error('Erro na exportação:', error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aprovado: { label: "Aprovado", color: "bg-success text-success-foreground" },
      contratado: { label: "Contratado", color: "bg-primary text-primary-foreground" },
      em_processo: { label: "Em Processo", color: "bg-warning text-warning-foreground" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Candidatos Aprovados - {vaga?.numero_vaga}
          </DialogTitle>
        </DialogHeader>
        
        {vaga && (
          <div className="space-y-4">
            {/* Informações da Vaga */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  {vaga.cargo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Empresa:</span> {vaga.empresa}
                  </div>
                  <div>
                    <span className="font-medium">Vaga:</span> #{vaga.numero_vaga}
                  </div>
                  <div>
                    <span className="font-medium">Total de Aprovados:</span> {candidatos.length}
                  </div>
                  <div>
                    <span className="font-medium">Última Atualização:</span> {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de Exportação */}
            <div className="flex justify-end">
              <Button 
                onClick={exportToExcel}
                disabled={exporting || candidatos.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exportando...' : 'Exportar Excel'}
              </Button>
            </div>

            {/* Lista de Candidatos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Candidatos Selecionados e Encaminhados ao Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidatos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum candidato aprovado encontrado para esta vaga.</p>
                    </div>
                  ) : (
                    candidatos.map((candidato, index) => (
                      <div 
                        key={candidato.id} 
                        className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{candidato.nome_abreviado}</div>
                            <div className="text-sm text-muted-foreground">
                              {candidato.nome}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {new Date(candidato.data_aprovacao).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">Data de Aprovação</div>
                          </div>
                          {getStatusBadge(candidato.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 