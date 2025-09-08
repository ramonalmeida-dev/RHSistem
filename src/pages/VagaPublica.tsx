import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidatoExterno } from '../contexts/CandidatoExternoContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Vaga } from '../../supabase/types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { validateAndProcessFile } from '../lib/utils';
import { Loader2, Building2, MapPin, Calendar, DollarSign, FileText, CheckCircle, XCircle, Upload, Send, Eye, ArrowLeft, User, PartyPopper, BriefcaseIcon, ArrowRight } from 'lucide-react';

interface Pergunta {
  id: string;
  tipo: 'texto' | 'textarea' | 'multipla_escolha' | 'checkbox' | 'select';
  pergunta: string;
  obrigatoria: boolean;
  opcoes?: string[];
  ordem: number;
}

interface Questionario {
  id: string;
  titulo: string;
  descricao?: string;
  perguntas: Pergunta[];
}

const VagaPublica: React.FC = () => {
  const { vagaId } = useParams<{ vagaId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Contextos
  const { user: adminUser, usuario } = useAuth();
  const { candidato, isAuthenticated, aplicarVaga, verificarCandidatura, loading, error } = useCandidatoExterno();
  
  const isAdmin = !!usuario; // Usar usuario ao invés de adminUser
  
  const [vaga, setVaga] = useState<any>(null);
  const [questionario, setQuestionario] = useState<Questionario | null>(null);
  const [jaCandidatou, setJaCandidatou] = useState(false);
  const [loadingVaga, setLoadingVaga] = useState(true);
  const [loadingCandidatura, setLoadingCandidatura] = useState(false);
  const [loadingVerificacao, setLoadingVerificacao] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Dados do formulário
  const [curriculoFile, setCurriculoFile] = useState<File | null>(null);
  const [curriculoSelecionado, setCurriculoSelecionado] = useState<'arquivo' | 'existente'>(
    candidato?.curriculo_url ? 'existente' : 'arquivo'
  );
  const [observacoes, setObservacoes] = useState('');
  const [respostasQuestionario, setRespostasQuestionario] = useState<Record<string, any>>({});
  const [candidaturaEnviada, setCandidaturaEnviada] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (vagaId) {
      carregarVaga();
    }
  }, [vagaId]);

  useEffect(() => {
    if (isAuthenticated && vagaId && !isAdmin && candidato) {
      verificarCandidaturaExistente();
    }
  }, [isAuthenticated, vagaId, isAdmin, candidato]);

  useEffect(() => {
    // Definir opção padrão baseada no perfil do candidato
    if (candidato?.curriculo_url) {
      setCurriculoSelecionado('existente');
    } else {
      setCurriculoSelecionado('arquivo');
    }
  }, [candidato]);

  const carregarVaga = async () => {
    if (!vagaId) return;

    try {
      setLoadingVaga(true);
      
      // Usar função RPC para buscar dados completos da vaga
      const { data, error } = await supabase.rpc('buscar_vaga_publica', {
        p_vaga_id: vagaId
      });

      if (error) {
        console.error('Erro ao carregar vaga:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a vaga.",
          variant: "destructive",
        });
        return;
      }

      if (!data.success) {
        toast({
          title: "Vaga não encontrada",
          description: data.error || "Esta vaga não está mais disponível.",
          variant: "destructive",
        });
        return;
      }

      const vagaData = data.vaga;
      
      // Verificar se a vaga está disponível para candidaturas
      if (vagaData.status !== 'publicada') {
        const statusMessages: Record<string, string> = {
          'pausada': 'Esta vaga está temporariamente pausada e não está recebendo candidaturas no momento.',
          'encerrada': 'Esta vaga foi encerrada e não está mais recebendo candidaturas.',
          'rascunho': 'Esta vaga ainda não foi publicada.',
          'em_analise': 'Esta vaga está em análise e não está recebendo candidaturas no momento.'
        };
        
        toast({
          title: "Vaga não disponível",
          description: statusMessages[vagaData.status] || "Esta vaga não está disponível para candidaturas.",
          variant: "destructive",
        });
        
        // Definir vaga mesmo assim para mostrar informações, mas desabilitar candidatura
        setVaga({ ...vagaData, candidaturaDisponivel: false });
        return;
      }

      setVaga({ ...vagaData, candidaturaDisponivel: true });
      
      // Definir questionário se existir
      if (data.questionario) {
        setQuestionario(data.questionario);
      }

    } catch (error) {
      console.error('Erro ao carregar vaga:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar a vaga.",
        variant: "destructive",
      });
    } finally {
      setLoadingVaga(false);
    }
  };

  const verificarCandidaturaExistente = async () => {
    if (!vagaId || !isAuthenticated) return;

    try {
      setLoadingVerificacao(true);
      const candidatou = await verificarCandidatura(vagaId);
      setJaCandidatou(candidatou);
    } catch (error) {
      console.error('Erro ao verificar candidatura:', error);
    } finally {
      setLoadingVerificacao(false);
    }
  };

  const handleIniciarCandidatura = async () => {
    if (!vagaId || !isAuthenticated) {
      // Redirecionar para login
      navigate('/candidato/login', { state: { returnUrl: `/vaga/${vagaId}` } });
      return;
    }

    // Ir para o step 2 (formulário de candidatura)
    setCurrentStep(2);
  };

  const handleVoltarStep = () => {
    setCurrentStep(1);
    // Limpar dados do formulário
    setRespostasQuestionario({});
    setCurriculoFile(null);
    setCurriculoSelecionado(candidato?.curriculo_url ? 'existente' : 'arquivo');
    setObservacoes('');
  };

  const validarQuestionario = (): boolean => {
    if (!questionario) return true;

    for (const pergunta of questionario.perguntas) {
      if (pergunta.obrigatoria) {
        const resposta = respostasQuestionario[pergunta.id];
        if (!resposta || (typeof resposta === 'string' && !resposta.trim())) {
          toast({
            title: "Questionário incompleto",
            description: `A pergunta "${pergunta.pergunta}" é obrigatória.`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleEnviarCandidatura = async () => {
    if (!vagaId) return;

    // Validações obrigatórias
    if (curriculoSelecionado === 'arquivo' && !curriculoFile) {
      toast({
        title: "Currículo obrigatório",
        description: "Por favor, anexe seu currículo.",
        variant: "destructive",
      });
      return;
    }

    if (curriculoSelecionado === 'existente' && !candidato?.curriculo_url) {
      toast({
        title: "Currículo não encontrado",
        description: "Você não possui currículo anexado no perfil. Por favor, selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }

    // Validar questionário (se existir)
    if (!validarQuestionario()) {
      return;
    }

    try {
      setLoadingCandidatura(true);
      
      // Preparar dados da candidatura
      let curriculoUrl = '';
      
      if (curriculoSelecionado === 'existente' && candidato?.curriculo_url) {
        // Usar currículo do perfil
        curriculoUrl = candidato.curriculo_url;
      } else if (curriculoSelecionado === 'arquivo' && curriculoFile) {
        // Validar e processar o arquivo
        const validation = validateAndProcessFile(curriculoFile, {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          requireSanitization: true
        });

        if (!validation.isValid) {
          toast({
            title: "Erro na validação do arquivo",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }

        const processedFile = validation.processedFile!;
        const fileName = `${Date.now()}_${processedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('curriculos')
          .upload(fileName, processedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          toast({
            title: "Erro no upload",
            description: "Erro ao fazer upload do currículo. Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        // Obter URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('curriculos')
          .getPublicUrl(fileName);

        curriculoUrl = publicUrl;
      }

      // Preparar observações incluindo respostas do questionário
      const observacoesCompletas = [];
      
      if (questionario && Object.keys(respostasQuestionario).length > 0) {
        observacoesCompletas.push(`Respostas do questionário "${questionario.titulo}":`);
        questionario.perguntas.forEach(pergunta => {
          const resposta = respostasQuestionario[pergunta.id];
          if (resposta) {
            observacoesCompletas.push(`${pergunta.pergunta}: ${Array.isArray(resposta) ? resposta.join(', ') : resposta}`);
          }
        });
      }
      
      if (observacoes.trim()) {
        observacoesCompletas.push(`Observações adicionais: ${observacoes}`);
      }

      const success = await aplicarVaga(vagaId, observacoesCompletas.join('\n\n'), curriculoUrl);
      
      if (success) {
        // Salvar respostas do questionário se existir
        if (questionario && Object.keys(respostasQuestionario).length > 0) {
          const { data: resultadoRespostas, error: erroRespostas } = await supabase
            .rpc('salvar_respostas_questionario', {
              p_questionario_id: questionario.id,
              p_candidato_id: candidato?.id,
              p_vaga_id: vagaId,
              p_respostas: respostasQuestionario,
              p_completado: true
            });

          if (erroRespostas) {
            console.error('Erro ao salvar respostas do questionário:', erroRespostas);
            // Não falhar a candidatura por erro no questionário
          }
        }

        // Atualizar estados
        setJaCandidatou(true);
        setCandidaturaEnviada(true);
        setCurrentStep(1);
        
        // Limpar formulário
        setRespostasQuestionario({});
        setCurriculoFile(null);
        setCurriculoSelecionado(candidato?.curriculo_url ? 'existente' : 'arquivo');
        setObservacoes('');
        
        // Toast de sucesso
        toast({
          title: "🎉 Candidatura enviada!",
          description: "Sua candidatura foi enviada com sucesso. Entraremos em contato caso você seja selecionado.",
          duration: 5000,
        });
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível enviar sua candidatura. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar na vaga:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoadingCandidatura(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validar e processar o arquivo
    const validation = validateAndProcessFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      requireSanitization: true
    });

    if (!validation.isValid) {
      toast({
        title: "Erro na validação do arquivo",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setCurriculoFile(validation.processedFile!);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleQuestionarioChange = (perguntaId: string, valor: any) => {
    setRespostasQuestionario(prev => ({
      ...prev,
      [perguntaId]: valor
    }));
  };

  const renderPergunta = (pergunta: Pergunta) => {
    const valor = respostasQuestionario[pergunta.id] || '';

    switch (pergunta.tipo) {
      case 'texto':
        return (
          <Input
            value={valor}
            onChange={(e) => handleQuestionarioChange(pergunta.id, e.target.value)}
            placeholder="Digite sua resposta..."
            required={pergunta.obrigatoria}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={valor}
            onChange={(e) => handleQuestionarioChange(pergunta.id, e.target.value)}
            placeholder="Digite sua resposta..."
            className="min-h-[100px]"
            required={pergunta.obrigatoria}
          />
        );
      
      case 'multipla_escolha':
        return (
          <RadioGroup
            value={valor}
            onValueChange={(value) => handleQuestionarioChange(pergunta.id, value)}
          >
            {pergunta.opcoes?.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={opcao} id={`${pergunta.id}_${index}`} />
                <Label htmlFor={`${pergunta.id}_${index}`} className="text-sm">
                  {opcao}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'checkbox':
        const valoresCheckbox = Array.isArray(valor) ? valor : [];
        return (
          <div className="space-y-2">
            {pergunta.opcoes?.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${pergunta.id}_${index}`}
                  checked={valoresCheckbox.includes(opcao)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleQuestionarioChange(pergunta.id, [...valoresCheckbox, opcao]);
                    } else {
                      handleQuestionarioChange(pergunta.id, valoresCheckbox.filter((v: string) => v !== opcao));
                    }
                  }}
                />
                <Label htmlFor={`${pergunta.id}_${index}`} className="text-sm">
                  {opcao}
                </Label>
              </div>
            ))}
          </div>
        );
      
      case 'select':
        return (
          <Select
            value={valor}
            onValueChange={(value) => handleQuestionarioChange(pergunta.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção..." />
            </SelectTrigger>
            <SelectContent>
              {pergunta.opcoes?.map((opcao, index) => (
                <SelectItem key={index} value={opcao}>
                  {opcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };

  const handleLogin = () => {
    navigate('/candidato/login', { state: { returnUrl: `/vaga/${vagaId}` } });
  };

  const handleRegister = () => {
    navigate('/candidato/register', { state: { returnUrl: `/vaga/${vagaId}` } });
  };

  if (loadingVaga) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando vaga...</p>
        </div>
      </div>
    );
  }

  if (!vaga) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Vaga não encontrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Esta vaga não foi encontrada ou não está mais disponível.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Aviso para admin */}
          {isAdmin && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <Eye className="h-4 w-4" />
              <AlertDescription className="text-blue-700">
                <strong>Visualização Administrativa:</strong> Você está vendo esta vaga como os candidatos externos a veem.
              </AlertDescription>
            </Alert>
          )}

          {/* Mensagem de sucesso quando candidatura enviada */}
          {candidaturaEnviada && jaCandidatou && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <PartyPopper className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                <strong>Candidatura enviada com sucesso!</strong> Sua candidatura foi recebida e está sendo analisada.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-8">
            {/* Conteúdo principal - alternando entre vaga e formulário */}
            <div className="max-w-4xl mx-auto w-full">
              {currentStep === 1 ? (
                /* Step 1: Informações da Vaga */
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold mb-2">{vaga.cargo}</CardTitle>
                        <CardDescription className="text-blue-100 text-lg">
                          Vaga de Emprego
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        <BriefcaseIcon className="h-3 w-3 mr-1" />
                        Vaga Ativa
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Informações básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Localização</p>
                          <p className="font-medium">{vaga.local_trabalho}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Publicada em</p>
                          <p className="font-medium">
                            {new Date(vaga.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Descrição da vaga - usando perfil_word */}
                    {vaga.perfil_word && (
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Perfil da Vaga
                        </h3>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">
                          {vaga.perfil_word}
                        </div>
                      </div>
                    )}

                    {/* Informações complementares */}
                    {vaga.informacoes_complementares && (
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Informações Complementares
                        </h3>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">
                          {vaga.informacoes_complementares}
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    {vaga.observacoes && (
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                          Observações
                        </h3>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">
                          {vaga.observacoes}
                        </div>
                      </div>
                    )}

                    {/* Questionário técnico - apenas mostrar que existe */}
                    {questionario && questionario.perguntas.length > 0 && (
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          Questionário da Vaga
                        </h3>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-purple-800 font-medium mb-2">{questionario.titulo}</p>
                          {questionario.descricao && (
                            <p className="text-purple-700 text-sm mb-3">{questionario.descricao}</p>
                          )}
                          <p className="text-purple-700 text-sm">
                            Este questionário contém {questionario.perguntas.length} pergunta(s) e será apresentado durante o processo de candidatura.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Seção de candidatura */}
                    <Separator />
                    
                    <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                      <h3 className="font-bold text-xl text-emerald-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Candidatar-se para esta vaga
                      </h3>
                      
                      {!isAdmin ? (
                        <>
                          {loadingVerificacao ? (
                            <div className="text-center py-6">
                              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                              </div>
                              <h4 className="text-lg font-bold text-blue-800 mb-2">
                                Verificando candidatura...
                              </h4>
                              <p className="text-blue-700">
                                Aguarde enquanto verificamos se você já se candidatou.
                              </p>
                            </div>
                          ) : jaCandidatou ? (
                            <div className="text-center py-6">
                              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                              </div>
                              <h4 className="text-lg font-bold text-green-800 mb-2">
                                Candidatura Enviada!
                              </h4>
                              <p className="text-green-700 mb-2">
                                Você já se candidatou para esta vaga.
                              </p>
                              <p className="text-sm text-gray-600">
                                Entraremos em contato caso você seja selecionado.
                              </p>
                            </div>
                          ) : isAuthenticated ? (
                            vaga?.candidaturaDisponivel === false ? (
                              <div className="text-center py-6">
                                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                  <XCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <h4 className="text-lg font-bold text-red-800 mb-2">
                                  Candidaturas Indisponíveis
                                </h4>
                                <p className="text-red-700 mb-2">
                                  Esta vaga não está recebendo candidaturas no momento.
                                </p>
                                <p className="text-sm text-gray-600">
                                  {vaga?.status === 'pausada' && 'A vaga está temporariamente pausada.'}
                                  {vaga?.status === 'encerrada' && 'A vaga foi encerrada.'}
                                  {vaga?.status === 'rascunho' && 'A vaga ainda não foi publicada.'}
                                  {vaga?.status === 'em_analise' && 'A vaga está em análise.'}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <p className="text-sm text-blue-800">
                                    Olá, <strong>{candidato?.nome}</strong>! 
                                  </p>
                                </div>
                                
                                <p className="text-emerald-700">
                                  Revise todos os detalhes da vaga acima e clique no botão abaixo para iniciar sua candidatura.
                                </p>
                                <Button 
                                  onClick={handleIniciarCandidatura}
                                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                  size="lg"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Candidatar-se para esta Vaga
                                </Button>
                              </div>
                            )
                          ) : (
                            vaga?.candidaturaDisponivel === false ? (
                              <div className="text-center py-6">
                                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                  <XCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <h4 className="text-lg font-bold text-red-800 mb-2">
                                  Candidaturas Indisponíveis
                                </h4>
                                <p className="text-red-700 mb-2">
                                  Esta vaga não está recebendo candidaturas no momento.
                                </p>
                                <p className="text-sm text-gray-600">
                                  {vaga?.status === 'pausada' && 'A vaga está temporariamente pausada.'}
                                  {vaga?.status === 'encerrada' && 'A vaga foi encerrada.'}
                                  {vaga?.status === 'rascunho' && 'A vaga ainda não foi publicada.'}
                                  {vaga?.status === 'em_analise' && 'A vaga está em análise.'}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="text-center py-4">
                                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <h4 className="font-bold text-gray-900 mb-2">Entre ou cadastre-se</h4>
                                  <p className="text-sm text-gray-600">
                                    Para se candidatar a esta vaga, você precisa fazer login ou criar uma conta.
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Button 
                                  onClick={handleLogin} 
                                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                  size="lg"
                                >
                                  Fazer Login
                                </Button>
                                <Button 
                                  onClick={handleRegister} 
                                  variant="outline" 
                                  className="w-full"
                                  size="lg"
                                >
                                  Criar Conta
                                </Button>
                              </div>
                              </div>
                            )
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Eye className="h-8 w-8 text-blue-600" />
                          </div>
                          <h4 className="font-bold text-blue-900 mb-2">Visualização Administrativa</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Candidatos externos verão o formulário de candidatura nesta área.
                          </p>
                          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar ao Dashboard
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Step 2: Formulário de Candidatura */
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Candidatura para: {vaga.cargo}
                        </CardTitle>
                      </div>
                      <Button
                        onClick={handleVoltarStep}
                        variant="ghost"
                        size="sm"
                        className="text-emerald-100 hover:text-white hover:bg-emerald-700"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-emerald-100 mb-2">
                        <span>Etapa 2 de 2</span>
                        <span>Formulário de Candidatura</span>
                      </div>
                      <Progress value={100} className="h-2 bg-emerald-700" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Seleção de currículo */}
                      <div>
                        <Label className="text-sm font-bold text-gray-900">Currículo *</Label>
                        <RadioGroup 
                          value={curriculoSelecionado} 
                          onValueChange={(value: 'arquivo' | 'existente') => setCurriculoSelecionado(value)}
                          className="mt-3"
                        >
                          {candidato?.curriculo_url && (
                            <div className="flex items-center space-x-3 p-3 border rounded-lg">
                              <RadioGroupItem value="existente" id="existente" />
                              <Label htmlFor="existente" className="text-sm flex-1">
                                Usar currículo do perfil
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(candidato.curriculo_url, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <RadioGroupItem value="arquivo" id="arquivo" />
                            <Label htmlFor="arquivo" className="text-sm">
                              Enviar novo currículo
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Upload de arquivo */}
                      {curriculoSelecionado === 'arquivo' && (
                        <div>
                          <Label className="text-sm font-bold text-gray-900 mb-3 block">
                            Selecionar arquivo *
                          </Label>
                          
                          {!curriculoFile ? (
                            // Área de upload drag & drop style
                            <div className="relative">
                              <Input
                                id="curriculo"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div 
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 bg-gray-50 ${isDragOver ? 'border-blue-400 bg-blue-50' : ''}`}
                              >
                                <div className="flex flex-col items-center space-y-3">
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Arraste e solte seu currículo aqui
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      ou clique para selecionar
                                    </p>
                                  </div>
                                  <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors pointer-events-none">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Escolher arquivo
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Arquivo selecionado
                            <div className="border border-green-300 rounded-lg p-4 bg-green-50 file-selected">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-green-900 word-break-filename">
                                      {curriculoFile.name}
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                      {(curriculoFile.size / 1024 / 1024).toFixed(2)} MB • {curriculoFile.type.includes('pdf') ? 'PDF' : curriculoFile.type.includes('word') ? 'Word' : 'Documento'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-3">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const input = document.getElementById('curriculo-change') as HTMLInputElement;
                                      input.click();
                                    }}
                                    className="text-green-700 hover:text-green-800 hover:bg-green-100"
                                    title="Trocar arquivo"
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurriculoFile(null)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                    title="Remover arquivo"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Input escondido para troca de arquivo */}
                              <Input
                                id="curriculo-change"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </div>
                          )}
                          
                          {/* Informações sobre formatos aceitos */}
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>PDF, DOC, DOCX</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Máximo 5MB</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Questionário dinâmico */}
                      {questionario && (
                        <div>
                          <Label className="text-sm font-bold text-gray-900">
                            {questionario.titulo}
                            {questionario.perguntas.some(p => p.obrigatoria) && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            {questionario.descricao && (
                              <p className="text-sm text-blue-800 mb-4">{questionario.descricao}</p>
                            )}
                            <div className="space-y-4">
                              {questionario.perguntas
                                .sort((a, b) => a.ordem - b.ordem)
                                .map(pergunta => (
                                <div key={pergunta.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                  <Label className="text-sm font-medium text-gray-900 mb-2 block">
                                    {pergunta.pergunta}
                                    {pergunta.obrigatoria && (
                                      <span className="text-red-500 ml-1">*</span>
                                    )}
                                  </Label>
                                  {renderPergunta(pergunta)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      <div>
                        <Label htmlFor="observacoes" className="text-sm font-bold text-gray-900">
                          Observações adicionais
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Conte um pouco mais sobre você ou sua motivação para esta vaga..."
                          className="mt-2 min-h-[100px]"
                        />
                      </div>

                      {/* Botão de envio */}
                      <div className="pt-4">
                        <Button
                          onClick={handleEnviarCandidatura}
                          disabled={loadingCandidatura}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          size="lg"
                        >
                          {loadingCandidatura ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando candidatura...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Candidatura
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VagaPublica; 