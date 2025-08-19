import { PerguntaQuestionario, TipoPergunta } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  CheckSquare, 
  Circle, 
  Hash, 
  Calendar,
  AlignLeft
} from "lucide-react";

interface PreviewQuestionarioProps {
  perguntas: PerguntaQuestionario[];
  titulo?: string;
}

const getTipoIcon = (tipo: TipoPergunta) => {
  const iconMap = {
    texto: FileText,
    texto_longo: AlignLeft,
    numero: Hash,
    data: Calendar,
    escolha_unica: Circle,
    multipla_escolha: CheckSquare,
  };
  
  const IconComponent = iconMap[tipo] || FileText;
  return <IconComponent className="h-4 w-4" />;
};

const renderCampoResposta = (pergunta: PerguntaQuestionario) => {
  switch (pergunta.tipo) {
    case 'texto':
      return (
        <Input 
          placeholder="Sua resposta..." 
          disabled 
          className="bg-muted/50"
        />
      );
    
    case 'texto_longo':
      return (
        <Textarea 
          placeholder="Sua resposta..." 
          disabled 
          className="bg-muted/50"
          rows={3}
        />
      );
    
    case 'numero':
      return (
        <Input 
          type="number" 
          placeholder="0" 
          disabled 
          className="bg-muted/50"
        />
      );
    
    case 'data':
      return (
        <Input 
          type="date" 
          disabled 
          className="bg-muted/50"
        />
      );
    
    case 'escolha_unica':
      return (
        <RadioGroup disabled className="space-y-2">
          {(pergunta.opcoes || []).map((opcao, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={`opcao-${index}`} disabled />
              <Label className="text-muted-foreground">{opcao || `Opção ${index + 1}`}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    
    case 'multipla_escolha':
      return (
        <div className="space-y-2">
          {(pergunta.opcoes || []).map((opcao, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox disabled />
              <Label className="text-muted-foreground">{opcao || `Opção ${index + 1}`}</Label>
            </div>
          ))}
        </div>
      );
    
    default:
      return null;
  }
};

export function PreviewQuestionario({ perguntas, titulo = "Prévia do Questionário" }: PreviewQuestionarioProps) {
  if (perguntas.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma pergunta no questionário</h3>
          <p className="text-sm text-muted-foreground">
            As perguntas adicionadas aparecerão aqui para prévia
          </p>
        </CardContent>
      </Card>
    );
  }

  const perguntasOrdenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-semibold">{titulo}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {perguntas.length} pergunta(s) • {perguntas.filter(p => p.obrigatoria).length} obrigatória(s)
            </p>
          </div>

          <div className="space-y-6">
            {perguntasOrdenadas.map((pergunta, index) => (
              <div key={pergunta.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getTipoIcon(pergunta.tipo)}
                      <Label className="text-base font-medium">
                        {pergunta.pergunta}
                        {pergunta.obrigatoria && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {pergunta.tipo.replace('_', ' ')}
                      </Badge>
                      {pergunta.obrigatoria && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatória
                        </Badge>
                      )}
                    </div>
                    
                    <div className="pl-2">
                      {renderCampoResposta(pergunta)}
                    </div>
                  </div>
                </div>
                
                {index < perguntasOrdenadas.length - 1 && (
                  <hr className="border-border/50" />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Esta é uma prévia de como o questionário aparecerá para os candidatos
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 