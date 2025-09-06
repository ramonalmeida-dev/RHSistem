  static async updateStatus(posicaoId: string, status: PosicaoFechada["status_posicao"]): Promise<PosicaoFechada> {
    console.log("DEBUG: updateStatus chamado com", { posicaoId, status });
    try {
      console.log("Chamando Edge Function com path correto...");
      const { data, error } = await supabase.functions.invoke('posicoes-fechadas', {
        method: 'POST',
        body: {
          path: 'update-status',
          id: posicaoId,
          status_posicao: status
        }
      });

      if (error) {
        console.log("ERRO da Edge Function:", error);
        throw error;
      }
      console.log("Dados retornados:", data);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
