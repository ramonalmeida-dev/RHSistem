import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const CandidatoRecuperarSenha: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnUrl = location.state?.returnUrl || '/candidato/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificar se o email existe na tabela de candidatos_externos
      const { data: candidato, error: candidatoError } = await supabase
        .from('candidatos_externos')
        .select('id, email')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (candidatoError || !candidato) {
        // Mesmo que não encontre, não revelar isso por segurança
        // Mas ainda enviar o email de reset se o usuário existir no auth
        console.log('Candidato não encontrado ou erro:', candidatoError);
      }

      // Enviar email de recuperação de senha via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/candidato/redefinir-senha`,
      });

      if (resetError) {
        console.error('Erro ao enviar email de recuperação:', resetError);
        // Não revelar se o email existe ou não por segurança
        setError('Erro ao enviar email de recuperação. Verifique se o email está correto e tente novamente.');
      } else {
        setEnviado(true);
      }
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    navigate('/candidato/login', { state: { returnUrl } });
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Email Enviado!</h2>
                <p className="text-gray-600 mb-6">
                  Se o email <strong>{email}</strong> estiver cadastrado, você receberá 
                  as instruções para redefinir sua senha em alguns minutos.
                </p>
                <div className="space-y-3">
                  <Button onClick={handleVoltar} className="w-full">
                    Voltar ao Login
                  </Button>
                  <p className="text-sm text-gray-500">
                    Não recebeu o email? Verifique sua caixa de spam ou tente novamente em alguns minutos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Recuperar Senha
          </h2>
          <p className="text-gray-600">
            Digite seu email para receber as instruções
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              Enviaremos um link para redefinir sua senha por email
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
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Instruções'
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

export default CandidatoRecuperarSenha; 