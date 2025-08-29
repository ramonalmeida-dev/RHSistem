import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  X
} from "lucide-react";
import { toast } from "sonner";
import { PosicoesFechadasService, CurriculoAtualizado } from "@/lib/posicoesFechadasService";
import { validateAndProcessFile } from "@/lib/utils";

interface CandidatoItemProps {
  candidato: {
    id: string;
    nome: string;
    email: string;
    pretensao_salarial?: number;
    regime_trabalho?: string;
  };
  curriculoAtualizado?: CurriculoAtualizado;
  posicaoId: string;
  onRefresh: () => void;
  onCandidatoDataChange: (data: Record<string, {
    pretensaoSalarial: string;
    regimeTrabalho: string;
    observacoes: string;
  }>) => void;
}

export const CandidatoItem = ({ candidato, curriculoAtualizado, posicaoId, onRefresh, onCandidatoDataChange }: CandidatoItemProps) => {
  const [candidatoFile, setCandidatoFile] = useState<File | null>(null);
  const [pretensaoSalarial, setPretensaoSalarial] = useState<string>('');
  const [regimeTrabalho, setRegimeTrabalho] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Inicializar dados quando o currículo atualizado mudar
  useEffect(() => {
    if (curriculoAtualizado) {
      setPretensaoSalarial(curriculoAtualizado.pretensao_salarial?.toString() || '');
      setRegimeTrabalho(curriculoAtualizado.regime_trabalho || '');
      setObservacoes(curriculoAtualizado.observacoes || '');
    } else {
      // Usar dados originais do candidato
      setPretensaoSalarial(candidato.pretensao_salarial?.toString() || '');
      setRegimeTrabalho(candidato.regime_trabalho || '');
      setObservacoes('');
    }
  }, [curriculoAtualizado, candidato]);

  // Notificar mudanças nos dados para o componente pai
  useEffect(() => {
    onCandidatoDataChange({
      [candidato.id]: {
        pretensaoSalarial,
        regimeTrabalho,
        observacoes
      }
    });
  }, [candidato.id, pretensaoSalarial, regimeTrabalho, observacoes, onCandidatoDataChange]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      // Validar e processar o arquivo
      const validation = validateAndProcessFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        requireSanitization: true
      });

      if (!validation.isValid) {
        toast.error(`Erro na validação do arquivo: ${validation.errors.join(', ')}`);
        return;
      }

      setCandidatoFile(validation.processedFile!);
    } else {
      setCandidatoFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!candidatoFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    setUploading(true);
    try {
      await PosicoesFechadasService.uploadCurriculo(
        posicaoId,
        candidato.id,
        candidato.nome,
        candidatoFile,
        pretensaoSalarial ? parseFloat(pretensaoSalarial) : undefined,
        regimeTrabalho || undefined,
        observacoes || undefined
      );

      toast.success(`Currículo de ${candidato.nome} atualizado com sucesso!`);
      setCandidatoFile(null);
      setPretensaoSalarial('');
      setRegimeTrabalho('');
      setObservacoes('');
      onRefresh();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do currículo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCurriculo = async (curriculoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este currículo?')) return;

    try {
      await PosicoesFechadasService.deleteCurriculo(curriculoId);
      toast.success('Currículo excluído com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar currículo:', error);
      toast.error('Erro ao deletar currículo');
    }
  };

  return (
    <div className="p-4 border-t bg-gray-50 space-y-4">
      {/* Informações do Candidato */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Pretensão Salarial</Label>
          <Input
            type="number"
            placeholder="0,00"
            value={pretensaoSalarial}
            onChange={(e) => setPretensaoSalarial(e.target.value)}
          />
        </div>
        <div>
          <Label>Regime de Trabalho</Label>
          <Select value={regimeTrabalho} onValueChange={setRegimeTrabalho}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o regime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLT">CLT</SelectItem>
              <SelectItem value="PJ">PJ</SelectItem>
              <SelectItem value="Temporário">Temporário</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          placeholder="Observações sobre o candidato..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Upload de Currículo */}
      <div className="space-y-3">
        <Label>Currículo Atualizado</Label>
        {!candidatoFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
              id={`curriculo-${candidato.id}`}
            />
            <label htmlFor={`curriculo-${candidato.id}`} className="cursor-pointer">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Clique para selecionar
                </span> ou arraste e solte
              </div>
              <div className="text-xs text-gray-500 mt-1">
                PDF, DOC ou DOCX (máximo 5MB)
              </div>
            </label>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="font-medium text-sm">{candidatoFile.name}</div>
                  <div className="text-xs text-gray-500">
                    {(candidatoFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCandidatoFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleFileUpload}
                  disabled={uploading}
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <Clock className="mr-2 h-3 w-3 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-3 w-3" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Currículo Atualizado Existente */}
      {curriculoAtualizado && (
        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-green-800">Currículo Atualizado</p>
                <p className="text-xs text-green-600">
                  {curriculoAtualizado.curriculo_atualizado_nome}
                </p>
                {curriculoAtualizado.pretensao_salarial && (
                  <p className="text-xs text-green-600">
                    Pretensão: R$ {curriculoAtualizado.pretensao_salarial.toLocaleString('pt-BR')}
                  </p>
                )}
                {curriculoAtualizado.regime_trabalho && (
                  <p className="text-xs text-green-600">
                    Regime: {curriculoAtualizado.regime_trabalho}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(curriculoAtualizado.curriculo_atualizado_url, '_blank')}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(curriculoAtualizado.curriculo_atualizado_url, '_blank')}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteCurriculo(curriculoAtualizado.id)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 