import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendToVagaModal } from "./SendToVagaModal";
import { 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  Star, 
  Download, 
  Send, 
  ExternalLink,
  FileText,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CurriculoDetailsModalProps {
  curriculo: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getDisponibilidadeBadge = (disponibilidade: string) => {
  const config = {
    disponivel: { label: "Disponível", color: "bg-success text-success-foreground" },
    empregado: { label: "Empregado", color: "bg-warning text-warning-foreground" },
    indisponivel: { label: "Indisponível", color: "bg-muted text-muted-foreground" }
  };
  
  const badgeConfig = config[disponibilidade as keyof typeof config];
  return <Badge className={badgeConfig.color}>{badgeConfig.label}</Badge>;
};

const getStatusBadge = (status: string) => {
  return status === "ativo" 
    ? <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
    : <Badge variant="secondary">Inativo</Badge>;
};

const renderStars = (rating: number) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
};

export const CurriculoDetailsModal = ({ curriculo, open, onOpenChange }: CurriculoDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [sendToVagaModalOpen, setSendToVagaModalOpen] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Se é arquivo não disponível
      if (curriculo.url_storage === 'ARQUIVO_NAO_DISPONIVEL') {
        alert('Este arquivo não está disponível. Foi marcado como necessário re-upload.');
        return;
      }

      // Se já é uma URL completa (candidatos externos), abrir diretamente
      if (curriculo.url_storage.startsWith('http')) {
        window.open(curriculo.url_storage, '_blank');
        return;
      }
      
      // Para arquivos no storage do Supabase
      const { data, error } = await supabase.storage
        .from('curriculos')
        .download(curriculo.url_storage);
      
      if (error) {
        console.error('Erro ao baixar currículo:', error);
        
        // Fallback: tentar URL pública
        const { data: publicData } = supabase.storage
          .from('curriculos')
          .getPublicUrl(curriculo.url_storage);
        
        if (publicData?.publicUrl) {
          window.open(publicData.publicUrl, '_blank');
        } else {
          alert('Erro ao baixar currículo. Arquivo pode não estar disponível.');
        }
        return;
      }
      
      // Criar blob e download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = curriculo.nome_arquivo || 'curriculo.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao processar download:', error);
      alert('Erro ao baixar currículo');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToVaga = () => {
    setSendToVagaModalOpen(true);
  };

  if (!curriculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Currículo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header com foto e informações básicas */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${curriculo.candidato.nome}`} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {curriculo.candidato.nome.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{curriculo.candidato.nome}</h2>
                {curriculo.avaliacao && (
                  <div className="flex items-center gap-1">
                    {renderStars(curriculo.avaliacao)}
                    <span className="text-sm text-muted-foreground">({curriculo.avaliacao}/5)</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mb-3">
                {getDisponibilidadeBadge(curriculo.disponibilidade)}
                {getStatusBadge(curriculo.status)}
                {curriculo.favorito && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <Star className="mr-1 h-3 w-3 fill-yellow-400" />
                    Favorito
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{curriculo.area_atuacao || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{curriculo.experiencia_anos || 0} anos de experiência</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações de contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações de Contato</h3>
              <div className="space-y-3">
                {curriculo.candidato.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{curriculo.candidato.email}</p>
                    </div>
                  </div>
                )}
                {curriculo.candidato.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{curriculo.candidato.telefone}</p>
                    </div>
                  </div>
                )}
                {curriculo.localizacao && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Localização</p>
                      <p className="font-medium">{curriculo.localizacao}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Profissionais</h3>
              <div className="space-y-3">
                {curriculo.formacao && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Formação</p>
                      <p className="font-medium">{curriculo.formacao}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Arquivo</p>
                    <p className="font-medium">{curriculo.nome_arquivo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                    <p className="font-medium">
                      {new Date(curriculo.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links externos */}
          {(curriculo.linkedin_url || curriculo.portfolio_url) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Links</h3>
              <div className="flex gap-3">
                {curriculo.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={curriculo.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {curriculo.portfolio_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={curriculo.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Portfolio
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {curriculo.observacoes && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Observações</h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">{curriculo.observacoes}</p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleDownload} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Currículo
                </>
              )}
            </Button>
            <Button onClick={handleSendToVaga} variant="outline" className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              Enviar para Vaga
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal para enviar para vaga */}
      <SendToVagaModal
        curriculo={curriculo}
        open={sendToVagaModalOpen}
        onOpenChange={setSendToVagaModalOpen}
        onSuccess={() => {
          // Opcional: callback para atualizar dados
        }}
      />
    </Dialog>
  );
}; 