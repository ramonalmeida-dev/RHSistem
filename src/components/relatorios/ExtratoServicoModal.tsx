import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  FileText, 
  Building2,
  User,
  Calendar,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface ExtratoServicoData {
  vaga: {
    id: string;
    numero_vaga: string;
    cargo: string;
    empresa: string;
    salario: string;
    data_encerramento: string;
  };
  candidato: {
    id: string;
    nome: string;
    data_admissao: string;
    salario_contratado: number;
  };
  consultor: {
    nome: string;
  };
  comissao: number;
}

interface ExtratoServicoModalProps {
  data: ExtratoServicoData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtratoServicoModal({ data, open, onOpenChange }: ExtratoServicoModalProps) {
  const [generating, setGenerating] = useState(false);

  const generateExtrato = async () => {
    try {
      setGenerating(true);
      
      // Criar conteúdo do extrato em formato Word/HTML
      const extratoContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Extrato de Serviço - ${data?.vaga.numero_vaga}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .title { font-size: 18px; margin: 20px 0; }
            .section { margin: 20px 0; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
            .footer { margin-top: 40px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">LOTUSAREV</div>
            <div>Recursos Humanos</div>
          </div>
          
          <div class="title">EXTRATO DE SERVIÇO</div>
          
          <div class="section">
            <div class="field">
              <span class="label">Número da Vaga:</span>
              <span class="value">${data?.vaga.numero_vaga}</span>
            </div>
            <div class="field">
              <span class="label">Empresa Cliente:</span>
              <span class="value">${data?.vaga.empresa}</span>
            </div>
            <div class="field">
              <span class="label">Cargo:</span>
              <span class="value">${data?.vaga.cargo}</span>
            </div>
            <div class="field">
              <span class="label">Salário Proposto:</span>
              <span class="value">${data?.vaga.salario}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="field">
              <span class="label">Candidato Selecionado:</span>
              <span class="value">${data?.candidato.nome}</span>
            </div>
            <div class="field">
              <span class="label">Data de Admissão:</span>
              <span class="value">${new Date(data?.candidato.data_admissao || '').toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="field">
              <span class="label">Salário Contratado:</span>
              <span class="value">R$ ${data?.candidato.salario_contratado.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="field">
              <span class="label">Consultor Responsável:</span>
              <span class="value">${data?.consultor.nome}</span>
            </div>
            <div class="field">
              <span class="label">Data de Encerramento:</span>
              <span class="value">${new Date(data?.vaga.data_encerramento || '').toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="field">
              <span class="label">Comissão:</span>
              <span class="value">R$ ${data?.comissao.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="section">
            <p><strong>Solicitamos a validação dos dados acima para emissão da nota fiscal de serviços.</strong></p>
            <p>Em caso de divergências, favor entrar em contato conosco.</p>
          </div>
          
          <div class="footer">
            <p>Atenciosamente,</p>
            <p><strong>Equipe Lotusarev</strong></p>
            <p>Recursos Humanos</p>
          </div>
        </body>
        </html>
      `;

      // Download do arquivo HTML (pode ser aberto no Word)
      const blob = new Blob([extratoContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `extrato-servico-${data?.vaga.numero_vaga}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Extrato de serviço gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar extrato de serviço');
      console.error('Erro na geração:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Extrato de Serviço - {data.vaga.numero_vaga}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações da Vaga */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Informações da Vaga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Vaga:</span> #{data.vaga.numero_vaga}
                </div>
                <div>
                  <span className="font-medium">Empresa:</span> {data.vaga.empresa}
                </div>
                <div>
                  <span className="font-medium">Cargo:</span> {data.vaga.cargo}
                </div>
                <div>
                  <span className="font-medium">Salário Proposto:</span> {data.vaga.salario}
                </div>
                <div>
                  <span className="font-medium">Data Encerramento:</span> {new Date(data.vaga.data_encerramento).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Candidato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Candidato Contratado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {data.candidato.nome}
                </div>
                <div>
                  <span className="font-medium">Data Admissão:</span> {new Date(data.candidato.data_admissao).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <span className="font-medium">Salário Contratado:</span> R$ {data.candidato.salario_contratado.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Consultor:</span> {data.consultor.nome}
                </div>
                <div>
                  <span className="font-medium">Comissão:</span> R$ {data.comissao.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Geração */}
          <div className="flex justify-end">
            <Button 
              onClick={generateExtrato}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              {generating ? 'Gerando...' : 'Gerar Extrato'}
            </Button>
          </div>

          {/* Preview do Extrato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Preview do Extrato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <div className="text-center mb-4">
                  <div className="font-bold text-blue-600 text-lg">LOTUSAREV</div>
                  <div>Recursos Humanos</div>
                </div>
                
                <div className="font-bold mb-2">EXTRATO DE SERVIÇO</div>
                
                <div className="space-y-1 mb-4">
                  <div><strong>Vaga:</strong> #{data.vaga.numero_vaga}</div>
                  <div><strong>Empresa:</strong> {data.vaga.empresa}</div>
                  <div><strong>Cargo:</strong> {data.vaga.cargo}</div>
                  <div><strong>Candidato:</strong> {data.candidato.nome}</div>
                  <div><strong>Data Admissão:</strong> {new Date(data.candidato.data_admissao).toLocaleDateString('pt-BR')}</div>
                  <div><strong>Comissão:</strong> R$ {data.comissao.toLocaleString()}</div>
                </div>
                
                <div className="text-center text-xs text-gray-600">
                  <p><strong>Solicitamos a validação dos dados acima para emissão da nota fiscal de serviços.</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 