import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Eye, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { PosicaoFechada, CurriculoAtualizado } from "@/lib/posicoesFechadasService";
import { PosicoesFechadasService } from "@/lib/posicoesFechadasService";

interface EnvioEmailProps {
  posicao: PosicaoFechada;
  curriculosAtualizados: CurriculoAtualizado[];
  candidatosData?: Record<string, {
    pretensaoSalarial: string;
    regimeTrabalho: string;
    observacoes: string;
  }>;
  onRefresh: () => void;
}

export const EnvioEmail = ({ posicao, curriculosAtualizados, candidatosData, onRefresh }: EnvioEmailProps) => {
  const [emailAssunto, setEmailAssunto] = useState<string>("");
  const [emailCorpo, setEmailCorpo] = useState<string>("");
  const [emailDestinatario, setEmailDestinatario] = useState<string>("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Função para gerar email padrão
  const generateDefaultEmail = () => {
    if (!posicao) return;

    // Definir email do cliente
    setEmailDestinatario(posicao.empresa_email || '');

    // Buscar informações dos currículos atualizados
    const candidatosComCurriculos = posicao.candidatos_aprovados.map(candidato => {
      const curriculoAtualizado = curriculosAtualizados.find(c => c.candidato_id === candidato.id);
      const candidatoInterface = candidatosData?.[candidato.id];
      
      let pretensao = 'Não informado';
      let regime = 'Não informado';
      
      // Prioridade: 1. Dados da interface, 2. Currículo atualizado, 3. Dados originais
      if (candidatoInterface?.pretensaoSalarial) {
        pretensao = `R$ ${parseFloat(candidatoInterface.pretensaoSalarial).toLocaleString('pt-BR')}`;
      } else if (curriculoAtualizado?.pretensao_salarial) {
        pretensao = `R$ ${curriculoAtualizado.pretensao_salarial.toLocaleString('pt-BR')}`;
      } else if (candidato.pretensao_salarial) {
        pretensao = `R$ ${candidato.pretensao_salarial.toLocaleString('pt-BR')}`;
      }
      
      if (candidatoInterface?.regimeTrabalho) {
        regime = candidatoInterface.regimeTrabalho;
      } else if (curriculoAtualizado?.regime_trabalho) {
        regime = curriculoAtualizado.regime_trabalho;
      } else if (candidato.regime_trabalho) {
        regime = candidato.regime_trabalho;
      }
      
      return {
        nome: candidato.nome,
        pretensao,
        regime,
        temCurriculoAtualizado: !!curriculoAtualizado,
        temDadosInterface: !!(candidatoInterface?.pretensaoSalarial || candidatoInterface?.regimeTrabalho)
      };
    });

    const candidatosInfo = candidatosComCurriculos.map(candidato => {
      let statusInfo = '';
      if (candidato.temDadosInterface) {
        statusInfo = ' (Dados atualizados)';
      } else if (candidato.temCurriculoAtualizado) {
        statusInfo = ' (Currículo atualizado)';
      }
      return `${candidato.nome}${statusInfo}: ${candidato.pretensao} (${candidato.regime})`;
    }).join('\n');

    const totalCurriculosAtualizados = candidatosComCurriculos.filter(c => c.temCurriculoAtualizado).length;
    const anexosInfo = totalCurriculosAtualizados > 0 
      ? `\n\nEm anexo, seguem os currículos atualizados dos candidatos selecionados.`
      : '';

    setEmailAssunto(`Posição ${posicao.cargo} - ${posicao.numero_vaga}`);
    setEmailCorpo(`Olá,

Como vai?

Me chamo ${posicao.consultor_nome}, trabalho na Consultoria LotusArev.

Estamos encaminhando candidatos para a posição de ${posicao.cargo} (${posicao.numero_vaga}).

Destaco que os candidatos avaliados apresentam pretensões diferentes:

${candidatosInfo}${anexosInfo}

Seguimos com a busca de novos profissionais para ampliar as opções e trazer perfis cada vez mais aderentes em termos técnicos e salariais.

Fico à disposição para quaisquer ajustes ou direcionamentos que considerar necessários.

Att,
${posicao.consultor_nome}`);
  };

  // Atualizar email quando posição ou currículos mudarem
  useEffect(() => {
    if (posicao && showEmailForm) {
      generateDefaultEmail();
    }
  }, [posicao, curriculosAtualizados, candidatosData, showEmailForm]);

  // Atualizar email quando o formulário for aberto
  const handleShowEmailForm = () => {
    setShowEmailForm(true);
    // Pequeno delay para garantir que o estado seja atualizado
    setTimeout(() => {
      generateDefaultEmail();
    }, 100);
  };

  const handleSendEmail = async () => {
    if (!posicao || !emailAssunto || !emailCorpo || !emailDestinatario) {
      toast.error('Preencha o assunto, corpo do email e destinatário');
      return;
    }

    setSendingEmail(true);
    try {
      await PosicoesFechadasService.enviarEmail(posicao.id, emailAssunto, emailCorpo, emailDestinatario);
      toast.success('Email enviado com sucesso!');
      setShowEmailForm(false);
      onRefresh();
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Envio de Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showEmailForm ? (
          <div className="flex gap-2">
            <Button onClick={handleShowEmailForm}>
              <Mail className="mr-2 h-4 w-4" />
              Preparar Email
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Email do Destinatário</Label>
              <Input
                value={emailDestinatario}
                onChange={(e) => setEmailDestinatario(e.target.value)}
                placeholder="email@empresa.com"
                type="email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email da empresa associada à vaga: {posicao.empresa_nome}
              </p>
            </div>

            <div>
              <Label>Assunto</Label>
              <Input
                value={emailAssunto}
                onChange={(e) => setEmailAssunto(e.target.value)}
                placeholder="Assunto do email"
              />
            </div>

            <div>
              <Label>Corpo do Email</Label>
              <Textarea
                value={emailCorpo}
                onChange={(e) => setEmailCorpo(e.target.value)}
                placeholder="Corpo do email"
                rows={10}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSendEmail} 
                disabled={sendingEmail || !emailAssunto || !emailCorpo || !emailDestinatario}
              >
                {sendingEmail ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Email
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowEmailForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 