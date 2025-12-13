import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  candidateName: string;
  fileName?: string;
  fileType?: string;
}

export function PdfViewerModal({ isOpen, onClose, pdfUrl, candidateName, fileName, fileType }: PdfViewerModalProps) {
  // Detectar tipo de arquivo quando o modal abre ou quando os dados mudam
  const isPdf = useMemo(() => {
    if (fileType) {
      return fileType.includes('pdf') || fileType === 'application/pdf';
    }
    if (fileName) {
      return fileName.toLowerCase().endsWith('.pdf');
    }
    return pdfUrl.toLowerCase().includes('.pdf') || pdfUrl.includes('application/pdf');
  }, [fileType, fileName, pdfUrl]);

  const isWord = useMemo(() => {
    if (fileType) {
      return fileType.includes('word') || 
             fileType.includes('document') || 
             fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             fileType === 'application/msword';
    }
    if (fileName) {
      return fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
    }
    return pdfUrl.toLowerCase().includes('.docx') || pdfUrl.toLowerCase().includes('.doc');
  }, [fileType, fileName, pdfUrl]);

  const [loading, setLoading] = useState(true);

  // Atualizar loading quando o modal abre ou quando detectamos que é Word
  useEffect(() => {
    if (isOpen) {
      // Se for Word ou outro tipo não-PDF, não precisa de loading (mostra mensagem imediatamente)
      if (isWord || (!isPdf && !isWord)) {
        setLoading(false);
      } else if (isPdf) {
        // Para PDFs, mostrar loading até o iframe carregar
        setLoading(true);
      }
    } else {
      // Reset loading quando o modal fecha
      setLoading(true);
    }
  }, [isOpen, isWord, isPdf]);


  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    const extension = isPdf ? '.pdf' : isWord ? '.docx' : '';
    link.download = `curriculo_${candidateName.replace(/\s+/g, '_')}${extension}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Currículo - {candidateName}</DialogTitle>
            <div className="flex items-center gap-2 mr-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Baixar currículo"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenNewTab}
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Nova aba
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative bg-gray-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando currículo...</p>
              </div>
            </div>
          )}
          
          {isPdf ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              title={`Currículo de ${candidateName}`}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                console.error('Erro ao carregar PDF');
              }}
            />
          ) : isWord ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 max-w-md">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Arquivo Word (.docx)
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Arquivos Word não podem ser visualizados diretamente no navegador.
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    Por favor, baixe o arquivo ou abra em nova aba para visualizar com Microsoft Word ou outro editor compatível.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleDownload} variant="default" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-gray-600 mb-4">Tipo de arquivo não suportado para visualização inline.</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleDownload} variant="default">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                  <Button onClick={handleOpenNewTab} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

