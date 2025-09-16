import { supabase } from './supabase';

interface ResetSenhaResponse {
  data?: {
    message: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

class ResetSenhaService {
  /**
   * Solicita reset de senha para um email usando Supabase Auth nativo
   */
  async solicitarReset(email: string): Promise<ResetSenhaResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-senha`
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: {
          message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.'
        }
      };
    } catch (error: any) {
      console.error('Erro ao solicitar reset:', error);
      return {
        error: {
          message: error.message || 'Erro interno do servidor',
          code: 'RESET_REQUEST_ERROR'
        }
      };
    }
  }

  /**
   * Atualiza a senha do usuário usando o token de sessão do Supabase
   */
  async atualizarSenha(newPassword: string): Promise<ResetSenhaResponse> {
    try {
      // Validar força da senha
      const passwordErrors = this.validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(`Senha não atende aos critérios:\n${passwordErrors.join('\n')}`);
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: {
          message: 'Senha alterada com sucesso'
        }
      };
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      return {
        error: {
          message: error.message || 'Erro interno do servidor',
          code: 'UPDATE_PASSWORD_ERROR'
        }
      };
    }
  }

  /**
   * Verifica se há uma sessão de recuperação ativa
   */
  async verificarSessaoRecuperacao(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return false;
    }
  }

  /**
   * Valida a força de uma senha
   */
  private validatePassword(password: string): string[] {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Deve ter pelo menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Deve conter pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Deve conter pelo menos uma letra minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Deve conter pelo menos um número');
    }
    
    return errors;
  }

  /**
   * Verifica se as senhas coincidem
   */
  validatePasswordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  /**
   * Retorna os critérios de senha em formato legível
   */
  getPasswordCriteria(): string[] {
    return [
      'Pelo menos 8 caracteres',
      'Uma letra maiúscula',
      'Uma letra minúscula',
      'Um número'
    ];
  }
}

export const resetSenhaService = new ResetSenhaService();
export default resetSenhaService; 