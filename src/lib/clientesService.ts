import { supabase } from './supabase';

interface Cliente {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateClienteData {
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ativo?: boolean;
}

interface UpdateClienteData extends Partial<CreateClienteData> {
  id: string;
}

export class ClientesService {
  private static async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  }

  static async listarClientes(search?: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (search) {
        // Usar função RPC para busca inteligente
        const { data, error } = await supabase
          .rpc('buscar_clientes_simples', {
            termo_busca: search
          });
        
        if (error) {
          throw error;
        }
        
        return data;
      } else {
        // Busca simples sem filtro
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        return data;
      }
    } catch (error: any) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  }

  static async buscarCliente(id: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`https://ustodblurmtaoexntmru.supabase.co/functions/v1/clientes?id=${id}`, {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao buscar cliente');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
  }

  static async criarCliente(data: CreateClienteData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('https://ustodblurmtaoexntmru.supabase.co/functions/v1/clientes', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao criar cliente');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  static async atualizarCliente(data: UpdateClienteData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('https://ustodblurmtaoexntmru.supabase.co/functions/v1/clientes', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao atualizar cliente');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  static async excluirCliente(id: string) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`https://ustodblurmtaoexntmru.supabase.co/functions/v1/clientes?id=${id}`, {
        method: 'DELETE',
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao excluir cliente');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      throw error;
    }
  }
} 