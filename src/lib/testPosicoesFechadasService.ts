import { supabase } from './supabase';

export class TestPosicoesFechadasService {
  private static API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/posicoes-fechadas`;

  static async testConnection(): Promise<any> {
    try {
      console.log('=== TESTE DE CONEXÃO ===');
      console.log('API_URL:', this.API_URL);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'Valid' : 'Invalid');
      console.log('Token:', session?.access_token ? 'Present' : 'Missing');
      
      // Teste sem autenticação primeiro
      console.log('Testando sem autenticação...');
      const responseWithoutAuth = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response sem auth - Status:', responseWithoutAuth.status);
      console.log('Response sem auth - Headers:', Object.fromEntries(responseWithoutAuth.headers.entries()));
      
      const resultWithoutAuth = await responseWithoutAuth.text();
      console.log('Response sem auth - Body:', resultWithoutAuth);
      
      // Teste com autenticação
      if (session?.access_token) {
        console.log('Testando com autenticação...');
        const responseWithAuth = await fetch(this.API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response com auth - Status:', responseWithAuth.status);
        console.log('Response com auth - Headers:', Object.fromEntries(responseWithAuth.headers.entries()));
        
        const resultWithAuth = await responseWithAuth.text();
        console.log('Response com auth - Body:', resultWithAuth);
      }
      
      return {
        success: true,
        apiUrl: this.API_URL,
        sessionValid: !!session,
        tokenPresent: !!session?.access_token
      };
    } catch (error) {
      console.error('Erro no teste:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async testDirectDatabase(): Promise<any> {
    try {
      console.log('=== TESTE DIRETO DO BANCO ===');
      
      const { data, error } = await supabase
        .from('vagas')
        .select('id, numero_vaga, status')
        .eq('status', 'encerrada')
        .limit(5);
      
      console.log('Dados do banco:', data);
      console.log('Erro do banco:', error);
      
      return {
        success: !error,
        data: data,
        error: error
      };
    } catch (error) {
      console.error('Erro no teste do banco:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 