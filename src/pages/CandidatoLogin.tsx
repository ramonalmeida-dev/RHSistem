import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCandidatoExterno } from '../contexts/CandidatoExternoContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Mail, Lock, UserPlus, KeyRound } from 'lucide-react';

const CandidatoLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, isAuthenticated } = useCandidatoExterno();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const returnUrl = location.state?.returnUrl || '/';

  useEffect(() => {
    if (isAuthenticated) {
      // Se autenticado, redirecionar para onde estava tentando ir
      navigate(returnUrl);
    }
  }, [isAuthenticated, navigate, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      const success = await login(email, senha);
      if (success) {
        // Redirecionar de volta para a vaga
        navigate(returnUrl);
      }
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = () => {
    navigate('/candidato/register', { state: { returnUrl } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Entrar como Candidato
          </CardTitle>
          <CardDescription className="text-center">
            Faça login para se candidatar às vagas
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
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                  disabled={loading || submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <button
                  type="button"
                  onClick={() => navigate('/candidato/recuperar-senha', { state: { returnUrl } })}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={loading || submitting}
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  disabled={loading || submitting}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || submitting}
            >
              {(loading || submitting) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Não tem conta?</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleRegister}
              disabled={loading || submitting}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidatoLogin; 