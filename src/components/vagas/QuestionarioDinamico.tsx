import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  FileText, 
  CheckSquare, 
  Circle, 
  Hash, 
  Calendar,
  AlignLeft,
  HelpCircle
} from "lucide-react";
import { PerguntaQuestionario, TipoPergunta } from "@/types";

interface QuestionarioDinamicoProps {
  perguntas: PerguntaQuestionario[];
  onChange: (perguntas: PerguntaQuestionario[]) => void;
}

const TIPOS_PERGUNTA: { value: TipoPergunta; label: string; icon: any }[] = [
  { value: 'texto', label: 'Texto Simples', icon: FileText },
  { value: 'texto_longo', label: 'Texto Longo', icon: AlignLeft },
  { value: 'numero', label: 'Número', icon: Hash },
  { value: 'data', label: 'Data', icon: Calendar },
  { value: 'escolha_unica', label: 'Escolha Única', icon: Circle },
  { value: 'multipla_escolha', label: 'Múltipla Escolha', icon: CheckSquare },
];

export function QuestionarioDinamico({ perguntas, onChange }: QuestionarioDinamicoProps) {
  const [perguntaExpandida, setPerguntaExpandida] = useState<string | null>(null);

  const adicionarPergunta = () => {
    const novaPergunta: PerguntaQuestionario = {
      id: `pergunta_${Date.now()}`,
      pergunta: '',
      tipo: 'texto',
      obrigatoria: false,
      ordem: perguntas.length + 1
    };
    
    onChange([...perguntas, novaPergunta]);
    setPerguntaExpandida(novaPergunta.id);
  };

  const removerPergunta = (id: string) => {
    const novasPerguntas = perguntas.filter(p => p.id !== id);
    // Reordenar perguntas
    const perguntasReordenadas = novasPerguntas.map((p, index) => ({
      ...p,
      ordem: index + 1
    }));
    onChange(perguntasReordenadas);
    
    if (perguntaExpandida === id) {
      setPerguntaExpandida(null);
    }
  };

  const atualizarPergunta = (id: string, campo: keyof PerguntaQuestionario, valor: any) => {
    const novasPerguntas = perguntas.map(p => {
      if (p.id === id) {
        const perguntaAtualizada = { ...p, [campo]: valor };
        
        // Se mudou o tipo e não é mais múltipla escolha/escolha única, remover opções
        if (campo === 'tipo' && !['multipla_escolha', 'escolha_unica'].includes(valor)) {
          delete perguntaAtualizada.opcoes;
        }
        
        // Se mudou para múltipla escolha/escolha única e não tem opções, criar array vazio
        if (campo === 'tipo' && ['multipla_escolha', 'escolha_unica'].includes(valor) && !perguntaAtualizada.opcoes) {
          perguntaAtualizada.opcoes = [''];
        }
        
        return perguntaAtualizada;
      }
      return p;
    });
    
    onChange(novasPerguntas);
  };

  const adicionarOpcao = (perguntaId: string) => {
    const novasPerguntas = perguntas.map(p => {
      if (p.id === perguntaId) {
        return {
          ...p,
          opcoes: [...(p.opcoes || []), '']
        };
      }
      return p;
    });
    onChange(novasPerguntas);
  };

  const removerOpcao = (perguntaId: string, indiceOpcao: number) => {
    const novasPerguntas = perguntas.map(p => {
      if (p.id === perguntaId && p.opcoes) {
        return {
          ...p,
          opcoes: p.opcoes.filter((_, index) => index !== indiceOpcao)
        };
      }
      return p;
    });
    onChange(novasPerguntas);
  };

  const atualizarOpcao = (perguntaId: string, indiceOpcao: number, valor: string) => {
    const novasPerguntas = perguntas.map(p => {
      if (p.id === perguntaId && p.opcoes) {
        const novasOpcoes = [...p.opcoes];
        novasOpcoes[indiceOpcao] = valor;
        return {
          ...p,
          opcoes: novasOpcoes
        };
      }
      return p;
    });
    onChange(novasPerguntas);
  };

  const moverPergunta = (id: string, direcao: 'up' | 'down') => {
    const indiceAtual = perguntas.findIndex(p => p.id === id);
    if (
      (direcao === 'up' && indiceAtual === 0) ||
      (direcao === 'down' && indiceAtual === perguntas.length - 1)
    ) {
      return;
    }

    const novasPerguntas = [...perguntas];
    const indiceNovo = direcao === 'up' ? indiceAtual - 1 : indiceAtual + 1;
    
    [novasPerguntas[indiceAtual], novasPerguntas[indiceNovo]] = 
    [novasPerguntas[indiceNovo], novasPerguntas[indiceAtual]];
    
    // Atualizar ordem
    const perguntasReordenadas = novasPerguntas.map((p, index) => ({
      ...p,
      ordem: index + 1
    }));
    
    onChange(perguntasReordenadas);
  };

  const getTipoIcon = (tipo: TipoPergunta) => {
    const tipoConfig = TIPOS_PERGUNTA.find(t => t.value === tipo);
    return tipoConfig?.icon || HelpCircle;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questionário Personalizado</h3>
          <p className="text-sm text-muted-foreground">
            Adicione perguntas específicas para esta vaga
          </p>
        </div>
        <Button
          type="button"
          onClick={adicionarPergunta}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Pergunta
        </Button>
      </div>

      {perguntas.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma pergunta adicionada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em "Adicionar Pergunta" para criar perguntas personalizadas para esta vaga
            </p>
            <Button
              type="button"
              onClick={adicionarPergunta}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Primeira Pergunta
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {perguntas.map((pergunta, index) => {
          const TipoIcon = getTipoIcon(pergunta.tipo);
          const isExpanded = perguntaExpandida === pergunta.id;
          
          return (
            <Card key={pergunta.id} className="border-l-4 border-l-primary">
              <CardHeader 
                className="pb-2 cursor-pointer"
                onClick={() => setPerguntaExpandida(isExpanded ? null : pergunta.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                    <TipoIcon className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-sm">
                        {pergunta.pergunta || `Pergunta ${index + 1}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {TIPOS_PERGUNTA.find(t => t.value === pergunta.tipo)?.label}
                        </Badge>
                        {pergunta.obrigatoria && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatória
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moverPergunta(pergunta.id, 'up');
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moverPergunta(pergunta.id, 'down');
                      }}
                      disabled={index === perguntas.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removerPergunta(pergunta.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`pergunta-${pergunta.id}`}>
                        Texto da Pergunta *
                      </Label>
                      <Input
                        id={`pergunta-${pergunta.id}`}
                        placeholder="Digite a pergunta..."
                        value={pergunta.pergunta}
                        onChange={(e) => atualizarPergunta(pergunta.id, 'pergunta', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`tipo-${pergunta.id}`}>
                        Tipo da Pergunta
                      </Label>
                      <Select
                        value={pergunta.tipo}
                        onValueChange={(valor) => atualizarPergunta(pergunta.id, 'tipo', valor as TipoPergunta)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PERGUNTA.map((tipo) => {
                            const IconComponent = tipo.icon;
                            return (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {tipo.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`obrigatoria-${pergunta.id}`}
                      checked={pergunta.obrigatoria}
                      onCheckedChange={(checked) => 
                        atualizarPergunta(pergunta.id, 'obrigatoria', checked)
                      }
                    />
                    <Label htmlFor={`obrigatoria-${pergunta.id}`}>
                      Esta pergunta é obrigatória
                    </Label>
                  </div>
                  
                  {['multipla_escolha', 'escolha_unica'].includes(pergunta.tipo) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Opções de Resposta</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => adicionarOpcao(pergunta.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Opção
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {(pergunta.opcoes || []).map((opcao, indiceOpcao) => (
                          <div key={indiceOpcao} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs min-w-6 text-center">
                              {indiceOpcao + 1}
                            </Badge>
                            <Input
                              placeholder={`Opção ${indiceOpcao + 1}`}
                              value={opcao}
                              onChange={(e) => atualizarOpcao(pergunta.id, indiceOpcao, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerOpcao(pergunta.id, indiceOpcao)}
                              disabled={(pergunta.opcoes?.length || 0) <= 1}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
} 