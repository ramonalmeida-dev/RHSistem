import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const CandidatoRedefinirSenha: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validandoToken, setValidandoToken] = useState(true);

  useEffect(() => {
    // Verificar se há uma sessão de recuperação de senha
    const verificarSessao = async () => {
      try {
        // Processar hash da URL manualmente (já que detectSessionInUrl está desabilitado)
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const type = hashParams.get('type');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && type === 'recovery' && refreshToken) {
            // Definir a sessão manualmente
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              throw sessionError;
            }
            
            // Limpar o hash da URL
            window.history.replaceState(null, '', window.location.pathname);
            setValidandoToken(false);
          } else {
            setError('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.');
            setValidandoToken(false);
          }
        } else {
          // Verificar se já existe uma sessão válida
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setValidandoToken(false);
          } else {
            setError('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.');
            setValidandoToken(false);
          }
        }
      } catch (error: any) {
        console.error('Erro ao verificar sessão:', error);
        setError(error.message || 'Erro ao validar o link de recuperação. Tente novamente.');
        setValidandoToken(false);
      }
    };

    verificarSessao();
  }, []);

  const validarSenha = (password: string): string | null => {
    if (password.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    const senhaError = validarSenha(senha);
    if (senhaError) {
      setError(senhaError);
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Atualizar a senha usando a sessão de recuperação
      const { error: updateError } = await supabase.auth.updateUser({
        password: senha
      });

      if (updateError) {
        throw updateError;
      }

      setSucesso(true);
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/candidato/login');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setError(error.message || 'Erro ao redefinir senha. O link pode ter expirado. Por favor, solicite um novo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    navigate('/candidato/login');
  };

  if (validandoToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Validando link de recuperação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Senha Redefinida!</h2>
              <p className="text-gray-600 mb-6">
                Sua senha foi redefinida com sucesso. Você será redirecionado para a tela de login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Redefinir Senha
          </h2>
          <p className="text-gray-600">
            Digite sua nova senha
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Senha</CardTitle>
            <CardDescription>
              Sua senha deve ter no mínimo 6 caracteres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="senha">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmarSenha"
                    type={mostrarConfirmarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !senha.trim() || !confirmarSenha.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={handleVoltar}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidatoRedefinirSenha;

