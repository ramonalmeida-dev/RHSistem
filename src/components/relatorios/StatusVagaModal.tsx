import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { VagaStatusRelatorio, StatusVagasService } from "@/lib/statusVagasService";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from "react";

interface StatusVagaModalProps {
  vaga: VagaStatusRelatorio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatusVagaModal({ vaga, open, onOpenChange }: StatusVagaModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (open && vaga) {
      generatePreview();
    }
  }, [open, vaga]);

  const generatePreview = async () => {
    if (!vaga) return;
    
    setLoading(true);
    try {
      const html = await StatusVagasService.generateHTMLContent([vaga]);
      setHtmlContent(html);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!vaga) return;
    
    setDownloadLoading(true);
    try {
      await StatusVagasService.exportToPDF([vaga]);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Status da Vaga - {vaga?.empresa_nome} - {vaga?.cargo}
            </DialogTitle>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloadLoading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 mr-8"
            >
              {downloadLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Baixar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Gerando visualização...</span>
            </div>
          ) : (
            <div 
              className="p-6"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


