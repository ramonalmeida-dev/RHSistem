import { supabase } from './supabase';

export interface CreateUserData {
  email: string;
  nome: string;
  role_id: string;
  senha: string;
}

export const usuariosService = {
  async criarUsuario(userData: CreateUserData) {
    try {
      // Verificar se o role existe antes de criar o usuário
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id, nome')
        .eq('id', userData.role_id)
        .single();

      if (roleError || !roleData) {
        throw new Error(`Role não encontrado: ${userData.role_id}`);
      }

      // Usar a Edge Function para criar o usuário
      const { data, error } = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: userData.email,
          password: userData.senha,
          nome: userData.nome,
          role_id: userData.role_id
        }
      });

      if (error) {
        throw new Error(`Erro na criação: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido na criação do usuário');
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error: any) {
      throw error;
    }
  },

  async listarUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nome,
          email,
          ativo,
          role_id,
          created_at,
          roles!inner (
            nome,
            descricao,
            nivel_acesso
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        ativo: usuario.ativo,
        role_id: usuario.role_id,
        role_nome: (usuario.roles as any).nome,
        role_descricao: (usuario.roles as any).descricao,
        nivel_acesso: (usuario.roles as any).nivel_acesso,
        created_at: usuario.created_at
      })) || [];
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  },

  async deletarUsuario(userId: string) {
    try {
      // Deletar diretamente da tabela usuarios
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(`Erro na exclusão: ${error.message}`);
      }

      return { success: true };
    } catch (error: any) {
      throw error;
    }
  },

  async desativarUsuario(userId: string, ativo: boolean) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: ativo })
        .eq('id', userId);

      if (error) {
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }

      return { success: true };
    } catch (error: any) {
      throw error;
    }
  }
}; 