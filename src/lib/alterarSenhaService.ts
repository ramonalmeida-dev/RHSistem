import { supabase } from './supabase';

interface AlterarSenhaResponse {
  data?: {
    message: string;
    user: {
      id: string;
      email: string;
      nome: string;
    };
  };
  error?: {
    message: string;
    code: string;
  };
}

class AlterarSenhaService {
  /**
   * Altera a senha de um usuário (apenas admins)
   */
  async alterarSenhaUsuario(userId: string, newPassword: string): Promise<AlterarSenhaResponse> {
    try {
      // Validar entrada
      if (!userId || !newPassword) {
        throw new Error('ID do usuário e nova senha são obrigatórios');
      }

      if (newPassword.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      // Obter sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Obter dados do usuário atual
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (!currentUser.user) {
        throw new Error('Usuário atual não encontrado');
      }

      // Fazer chamada para a edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/alterar-senha-admin`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          newPassword,
          currentUserId: currentUser.user.id,
        }),
      });

      let result;
      try {
        const responseText = await response.text();
        
        if (!responseText) {
          throw new Error(`Resposta vazia do servidor (Status: ${response.status})`);
        }
        
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Erro ao parsear resposta:', jsonError);
        throw new Error(`Erro na comunicação com o servidor (Status: ${response.status})`);
      }

      if (!response.ok) {
        throw new Error(result.error?.message || `Erro HTTP ${response.status}: ${result.error?.code || 'UNKNOWN'}`);
      }

      return result;
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      return {
        error: {
          message: error.message || 'Erro interno do servidor',
          code: 'ALTER_PASSWORD_ERROR',
        },
      };
    }
  }

  /**
   * Valida a força de uma senha
   */
  validarSenha(password: string): string[] {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Deve ter pelo menos 6 caracteres');
    }
    if (password.length > 50) {
      errors.push('Deve ter no máximo 50 caracteres');
    }
    
    return errors;
  }

  /**
   * Gera uma senha aleatória
   */
  gerarSenhaAleatoria(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const alterarSenhaService = new AlterarSenhaService();
export default alterarSenhaService; 