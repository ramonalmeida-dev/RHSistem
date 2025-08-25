import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { PosicaoFechada, CurriculoAtualizado } from "@/lib/posicoesFechadasService";
import { CandidatoItem } from "./CandidatoItem";

interface CandidatosAprovadosProps {
  posicao: PosicaoFechada;
  curriculosAtualizados: CurriculoAtualizado[];
  onRefresh: () => void;
  onCandidatoDataChange: (data: Record<string, {
    pretensaoSalarial: string;
    regimeTrabalho: string;
    observacoes: string;
  }>) => void;
}

export const CandidatosAprovados = ({ 
  posicao, 
  curriculosAtualizados, 
  onRefresh, 
  onCandidatoDataChange 
}: CandidatosAprovadosProps) => {
  const [expandedCandidatos, setExpandedCandidatos] = useState<Set<string>>(new Set());

  const toggleCandidatoExpansion = (candidatoId: string) => {
    const newExpanded = new Set(expandedCandidatos);
    if (newExpanded.has(candidatoId)) {
      newExpanded.delete(candidatoId);
    } else {
      newExpanded.add(candidatoId);
    }
    setExpandedCandidatos(newExpanded);
  };

  const getCurriculoAtualizado = (candidatoId: string) => {
    return curriculosAtualizados.find(c => c.candidato_id === candidatoId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Candidatos Aprovados ({posicao.candidatos_aprovados.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {posicao.candidatos_aprovados.map((candidato) => {
            const isExpanded = expandedCandidatos.has(candidato.id);
            const curriculoAtualizado = getCurriculoAtualizado(candidato.id);
            const hasCurriculoAtualizado = !!curriculoAtualizado;
            
            return (
              <Collapsible key={candidato.id} open={isExpanded} onOpenChange={() => toggleCandidatoExpansion(candidato.id)}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{candidato.nome}</p>
                          <p className="text-sm text-muted-foreground">{candidato.email}</p>
                          {candidato.pretensao_salarial && (
                            <p className="text-sm text-muted-foreground">
                              Pretensão: R$ {candidato.pretensao_salarial.toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasCurriculoAtualizado && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Currículo Atualizado
                          </Badge>
                        )}
                        {candidato.regime_trabalho && (
                          <Badge variant="outline">
                            {candidato.regime_trabalho}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CandidatoItem 
                      candidato={candidato}
                      curriculoAtualizado={curriculoAtualizado}
                      posicaoId={posicao.id}
                      onRefresh={onRefresh}
                      onCandidatoDataChange={onCandidatoDataChange}
                    />
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 