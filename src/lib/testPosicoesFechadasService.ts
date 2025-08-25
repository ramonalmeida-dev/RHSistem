import { supabase } from './supabase';

export class TestPosicoesFechadasService {
  private static API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/posicoes-fechadas`;

  static async testConnection(): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Teste sem autenticação primeiro
      const responseWithoutAuth = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const resultWithoutAuth = await responseWithoutAuth.text();
      
      // Teste com autenticação
      if (session?.access_token) {
        const responseWithAuth = await fetch(this.API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        const resultWithAuth = await responseWithAuth.text();
      }
      
      return {
        success: true,
        apiUrl: this.API_URL,
        sessionValid: !!session,
        tokenPresent: !!session?.access_token
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async testDirectDatabase(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('vagas')
        .select('id, numero_vaga, status')
        .eq('status', 'encerrada')
        .limit(5);
      
      return {
        success: !error,
        data: data,
        error: error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
} 