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
  static async listarClientes(search?: string) {
    try {
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
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
  }

  static async criarCliente(data: CreateClienteData) {
    try {
      const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert({
          ...data,
          ativo: data.ativo ?? true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newCliente;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  static async atualizarCliente(data: UpdateClienteData) {
    try {
      const { id, ...updateData } = data;
      
      const { data: updatedCliente, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedCliente;
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  static async excluirCliente(id: string) {
    try {
      // Verificar se cliente tem vagas associadas
      const { data: vagas } = await supabase
        .from('vagas')
        .select('id')
        .eq('empresa_id', id);

      if (vagas && vagas.length > 0) {
        throw new Error('Não é possível deletar cliente com vagas associadas');
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { message: 'Cliente deletado com sucesso' };
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      throw error;
    }
  }
} 