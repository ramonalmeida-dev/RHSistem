import { supabase } from './supabase';

interface CreateConsultorData {
  email: string;
  nome: string;
  password: string;
  tipo: 'admin' | 'consultor';
  ativo?: boolean;
}

interface UpdateConsultorData {
  id: string;
  email?: string;
  nome?: string;
  password?: string;
  tipo?: 'admin' | 'consultor';
  ativo?: boolean;
}

export class ConsultoresService {
  private static async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  }

  static async listarConsultores() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`https://ustodblurmtaoexntmru.supabase.co/functions/v1/usuarios`, {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao listar consultores');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao listar consultores:', error);
      throw error;
    }
  }

  static async criarConsultor(data: CreateConsultorData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`https://ustodblurmtaoexntmru.supabase.co/functions/v1/usuarios`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao criar consultor');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao criar consultor:', error);
      throw error;
    }
  }

  static async atualizarConsultor(data: UpdateConsultorData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`https://ustodblurmtaoexntmru.supabase.co/functions/v1/usuarios`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao atualizar consultor');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao atualizar consultor:', error);
      throw error;
    }
  }

  static async excluirConsultor(id: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`https://ustodblurmtaoexntmru.supabase.co/functions/v1/usuarios?id=${id}`, {
        method: 'DELETE',
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao excluir consultor');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao excluir consultor:', error);
      throw error;
    }
  }

  static async buscarConsultor(id: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`https://ustodblurmtaoexntmru.supabase.co/functions/v1/usuarios?id=${id}`, {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao buscar consultor');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao buscar consultor:', error);
      throw error;
    }
  }
} 