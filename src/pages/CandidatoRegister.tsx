import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCandidatoExterno } from '../contexts/CandidatoExternoContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, User, Mail, Lock, Phone, UserPlus } from 'lucide-react';

const CandidatoRegister: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading, error, clearError, isAuthenticated } = useCandidatoExterno();
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  const returnUrl = location.state?.returnUrl || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl);
    }
  }, [isAuthenticated, navigate, returnUrl]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.senha) {
      errors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      errors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      errors.confirmarSenha = 'Senhas não coincidem';
    }

    if (!formData.telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório';
    }

    if (!lgpdAccepted) {
      errors.lgpd = 'Você deve concordar com o tratamento dos seus dados pessoais';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    try {
      const success = await register({
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        senha_hash: formData.senha,
        telefone: formData.telefone.trim()
      });

      if (success) {
        navigate(returnUrl);
      }
    } catch (error) {
      console.error('Erro no registro:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro de validação quando o usuário começa a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogin = () => {
    navigate('/candidato/login', { state: { returnUrl } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Criar Conta
          </h2>
          <p className="text-gray-600">
            Cadastre-se para começar a se candidatar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registro</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para criar sua conta
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
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Seu nome completo"
                    className="pl-10"
                    required
                    disabled={submitting}
                  />
                </div>
                {validationErrors.nome && (
                  <p className="text-sm text-red-600">{validationErrors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                    disabled={submitting}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    required
                    disabled={submitting}
                  />
                </div>
                {validationErrors.telefone && (
                  <p className="text-sm text-red-600">{validationErrors.telefone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10"
                    required
                    disabled={submitting}
                  />
                </div>
                {validationErrors.senha && (
                  <p className="text-sm text-red-600">{validationErrors.senha}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                    placeholder="Confirme sua senha"
                    className="pl-10"
                    required
                    disabled={submitting}
                  />
                </div>
                {validationErrors.confirmarSenha && (
                  <p className="text-sm text-red-600">{validationErrors.confirmarSenha}</p>
                )}
              </div>

              {/* Checkbox LGPD */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Checkbox
                    id="lgpd-consent"
                    checked={lgpdAccepted}
                    onCheckedChange={(checked) => setLgpdAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor="lgpd-consent" 
                      className="text-sm text-blue-800 leading-relaxed cursor-pointer"
                    >
                      <strong>Proteção de Dados (LGPD):</strong> Ao criar sua conta, você concorda com o tratamento dos seus dados pessoais (nome, e-mail e telefone) pela Lotusarev Consulting, exclusivamente para fins de participação em processos de recrutamento e seleção, contato profissional e comunicação sobre oportunidades compatíveis com seu perfil.
                    </Label>
                  </div>
                </div>
                {validationErrors.lgpd && (
                  <p className="text-sm text-red-600">{validationErrors.lgpd}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={submitting || loading}
              >
                {submitting || loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Button 
                  variant="link" 
                  onClick={handleLogin}
                  className="p-0 h-auto font-medium"
                >
                  Fazer login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-gray-600"
          >
            ← Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CandidatoRegister; 