import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidatoExterno } from '../contexts/CandidatoExternoContext';
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
import { Loader2, Building2, MapPin, Calendar, DollarSign, FileText, CheckCircle, XCircle, Upload, Send, Eye } from 'lucide-react';

const VagaPublica: React.FC = () => {
  const { vagaId } = useParams<{ vagaId: string }>();
  const navigate = useNavigate();
  const { candidato, isAuthenticated, aplicarVaga, verificarCandidatura, loading, error } = useCandidatoExterno();
  
  const [vaga, setVaga] = useState<any>(null);
  const [jaCandidatou, setJaCandidatou] = useState(false);
  const [loadingVaga, setLoadingVaga] = useState(true);
  const [loadingCandidatura, setLoadingCandidatura] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [respostasQuestionario, setRespostasQuestionario] = useState('');
  const [curriculoFile, setCurriculoFile] = useState<File | null>(null);
  const [curriculoSelecionado, setCurriculoSelecionado] = useState<'arquivo' | 'existente'>(
    candidato?.curriculo_url ? 'existente' : 'arquivo'
  );
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (vagaId) {
      carregarVaga();
    }
  }, [vagaId]);

  useEffect(() => {
    if (isAuthenticated && vagaId) {
      verificarCandidaturaExistente();
    }
  }, [isAuthenticated, vagaId]);

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
      
      const { data, error } = await supabase
        .from('vagas')
        .select(`
          *,
          clientes:empresa_id (
            razao_social,
            cnpj,
            contato,
            email
          )
        `)
        .eq('id', vagaId)
        .eq('status', 'publicada')
        .single();

      if (error) {
        console.error('Erro ao carregar vaga:', error);
        return;
      }

      setVaga(data);
    } catch (error) {
      console.error('Erro ao carregar vaga:', error);
    } finally {
      setLoadingVaga(false);
    }
  };

  const verificarCandidaturaExistente = async () => {
    if (!vagaId || !isAuthenticated) return;

    try {
      const candidatou = await verificarCandidatura(vagaId);
      setJaCandidatou(candidatou);
    } catch (error) {
      console.error('Erro ao verificar candidatura:', error);
    }
  };

  const handleAplicar = async () => {
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
    setRespostasQuestionario('');
    setCurriculoFile(null);
    setCurriculoSelecionado('arquivo');
    setObservacoes('');
  };

  const handleEnviarCandidatura = async () => {
    if (!vagaId) return;

    // Validações obrigatórias no Step 2
    if (curriculoSelecionado === 'arquivo' && !curriculoFile) {
      alert('Por favor, anexe seu currículo.');
      return;
    }

    if (curriculoSelecionado === 'existente' && !candidato?.curriculo_url) {
      alert('Você não possui currículo anexado no perfil. Por favor, selecione um arquivo.');
      return;
    }

    if (vaga.questionario_tecnico && !respostasQuestionario.trim()) {
      alert('Por favor, responda ao questionário técnico.');
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
        // Upload real para Supabase Storage
        const fileName = `${Date.now()}_${curriculoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('curriculos')
          .upload(fileName, curriculoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          alert('Erro ao fazer upload do currículo. Tente novamente.');
          return;
        }

        // Obter URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('curriculos')
          .getPublicUrl(fileName);

        curriculoUrl = publicUrl;
      }

      const observacoesCompletas = [
        vaga.questionario_tecnico ? `Respostas do questionário técnico:\n${respostasQuestionario}` : '',
        observacoes ? `Observações adicionais:\n${observacoes}` : ''
      ].filter(Boolean).join('\n\n');

      const success = await aplicarVaga(vagaId, observacoesCompletas, curriculoUrl);
      
      if (success) {
        setJaCandidatou(true);
        setCurrentStep(1);
        // Limpar formulário
        setRespostasQuestionario('');
        setCurriculoFile(null);
        setCurriculoSelecionado('arquivo');
        setObservacoes('');
      }
    } catch (error) {
      console.error('Erro ao aplicar na vaga:', error);
    } finally {
      setLoadingCandidatura(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor, selecione um arquivo PDF ou Word (.doc/.docx)');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 5MB');
        return;
      }
      
      setCurriculoFile(file);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando vaga...</p>
        </div>
      </div>
    );
  }

  if (!vaga) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Vaga não encontrada</h2>
              <p className="text-gray-600 mb-4">
                Esta vaga não está mais disponível ou não foi encontrada.
              </p>
              <Button onClick={() => navigate('/')}>
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{vaga.cargo}</CardTitle>
                  <CardDescription className="text-lg">
                    <Building2 className="inline h-4 w-4 mr-2" />
                    {vaga.clientes?.razao_social}
                  </CardDescription>
                </div>
                <Badge variant={vaga.status === 'publicada' ? 'default' : 'secondary'}>
                  {vaga.status === 'publicada' ? 'Aberta' : vaga.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Progress Steps */}
        {isAuthenticated && !jaCandidatou && (
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      1
                    </div>
                    <span className={`font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                      Detalhes da Vaga
                    </span>
                  </div>
                  
                  <div className="flex-1 mx-4">
                    <div className={`h-1 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      2
                    </div>
                    <span className={`font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                      Candidatar-se
                    </span>
                  </div>
                </div>
                <Progress value={currentStep === 1 ? 50 : 100} className="w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 1 && (
              <Card>
              <CardHeader>
                <CardTitle>Detalhes da Vaga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {vaga.local_trabalho || 'Local não informado'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {vaga.data_recebimento ? new Date(vaga.data_recebimento).toLocaleDateString('pt-BR') : 'Data não informada'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {vaga.salario || 'Salário não informado'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {vaga.numero_vaga}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Perfil da Vaga</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {vaga.perfil_word || 'Perfil não disponível.'}
                  </p>
                </div>

                {vaga.informacoes_complementares && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Informações Complementares</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {vaga.informacoes_complementares}
                      </p>
                    </div>
                  </>
                )}

                {vaga.questionario_tecnico && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Questionário Técnico</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {vaga.questionario_tecnico}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Formulário de Candidatura</CardTitle>
                  <CardDescription>
                    Complete as informações para se candidatar a esta vaga
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seleção de Currículo - SEMPRE obrigatório no Step 2 */}
                  <div className="space-y-4">
                    <Label>Currículo *</Label>
                    
                    {/* Opções de Currículo */}
                    <RadioGroup 
                      value={curriculoSelecionado} 
                      onValueChange={(value: 'arquivo' | 'existente') => setCurriculoSelecionado(value)}
                      className="space-y-3"
                    >
                      {/* Currículo Existente */}
                      {candidato?.curriculo_url && (
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="existente" id="curriculo-existente" className="mt-1" />
                          <div className="flex-1">
                            <Label 
                              htmlFor="curriculo-existente" 
                              className="font-medium cursor-pointer"
                            >
                              Usar currículo do perfil
                            </Label>
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-blue-900 truncate" title={candidato.curriculo_nome || 'curriculo.pdf'}>
                                      {candidato.curriculo_nome || 'curriculo.pdf'}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {candidato.curriculo_tamanho && 
                                        `${(candidato.curriculo_tamanho / 1024 / 1024).toFixed(2)} MB`
                                      } • Anexado em {new Date(candidato.data_cadastro).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Botão Visualizar */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(candidato.curriculo_url, '_blank')}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 flex-shrink-0 ml-2"
                                  title="Visualizar currículo"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Upload Novo Arquivo */}
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="arquivo" id="curriculo-arquivo" className="mt-1" />
                        <div className="flex-1">
                          <Label 
                            htmlFor="curriculo-arquivo" 
                            className="font-medium cursor-pointer"
                          >
                            Enviar novo currículo
                          </Label>
                          
                          {curriculoSelecionado === 'arquivo' && (
                            <div className="mt-2">
                              {!curriculoFile ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                  <input
                                    type="file"
                                    id="curriculo"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                  />
                                  <label htmlFor="curriculo" className="cursor-pointer">
                                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium text-blue-600 hover:text-blue-500">
                                        Clique para selecionar
                                      </span> seu currículo
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
                                        <div className="font-medium text-sm">{curriculoFile.name}</div>
                                        <div className="text-xs text-gray-500">
                                          {(curriculoFile.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCurriculoFile(null)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Questionário Técnico - se existir */}
                  {vaga.questionario_tecnico && (
                    <div className="space-y-2">
                      <Label htmlFor="questionario">Questionário Técnico *</Label>
                      <div className="p-3 bg-gray-50 rounded-lg mb-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {vaga.questionario_tecnico}
                        </p>
                      </div>
                      <Textarea
                        id="questionario"
                        value={respostasQuestionario}
                        onChange={(e) => setRespostasQuestionario(e.target.value)}
                        placeholder="Digite suas respostas aqui..."
                        rows={4}
                        required
                      />
                    </div>
                  )}

                  {/* Observações Adicionais */}
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações Adicionais</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Informações adicionais sobre sua candidatura (opcional)..."
                      rows={3}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleVoltarStep}
                      className="flex-1"
                    >
                      ← Voltar
                    </Button>
                    <Button 
                      onClick={handleEnviarCandidatura}
                      disabled={
                        loadingCandidatura || 
                        (curriculoSelecionado === 'arquivo' && !curriculoFile) ||
                        (curriculoSelecionado === 'existente' && !candidato?.curriculo_url) ||
                        (vaga.questionario_tecnico && !respostasQuestionario.trim())
                      }
                      className="flex-2"
                    >
                      {loadingCandidatura ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Candidatura
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Aplicação */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidatar-se</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {jaCandidatou ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">Você já se candidatou para esta vaga!</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Acompanhe o status da sua candidatura no seu perfil.
                    </p>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Olá, <strong>{candidato?.nome}</strong>! 
                    </p>
                    
                    {currentStep === 1 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          Revise os detalhes da vaga e clique em continuar para se candidatar.
                        </p>
                        <Button 
                          onClick={handleAplicar}
                          className="w-full"
                        >
                          Continuar →
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          Complete o formulário ao lado para finalizar sua candidatura.
                        </p>
                        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                          <strong>Próximos passos:</strong><br />
                          1. Anexe seu currículo<br />
                          {vaga.questionario_tecnico && "2. Responda ao questionário técnico"}<br />
                          {vaga.questionario_tecnico ? "3. " : "2. "}Adicione observações (opcional)<br />
                          {vaga.questionario_tecnico ? "4. " : "3. "}Envie sua candidatura
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Para se candidatar a esta vaga, você precisa fazer login ou criar uma conta.
                    </p>
                    <Button onClick={handleLogin} className="w-full">
                      Fazer Login
                    </Button>
                    <Button onClick={handleRegister} variant="outline" className="w-full">
                      Criar Conta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações da Empresa */}
            {vaga.clientes && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre a Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{vaga.clientes.razao_social}</p>
                      {vaga.clientes.cnpj && (
                        <p className="text-sm text-gray-600">CNPJ: {vaga.clientes.cnpj}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VagaPublica; 