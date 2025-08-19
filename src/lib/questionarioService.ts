import { supabase } from './supabase';
import { QuestionarioVaga, CreateQuestionarioVaga, PerguntaQuestionario } from '@/types';

export class QuestionarioService {
  /**
   * Cria um questionário para uma vaga
   */
  static async criarQuestionario(questionario: CreateQuestionarioVaga): Promise<QuestionarioVaga> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(questionario),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar questionário');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Busca o questionário de uma vaga
   */
  static async buscarQuestionarioPorVaga(vagaId: string): Promise<QuestionarioVaga | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionarios/vaga?vaga_id=${vagaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      console.error('Erro ao buscar questionário:', error);
      throw new Error(error.error || 'Erro ao buscar questionário');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Atualiza um questionário
   */
  static async atualizarQuestionario(id: string, updates: Partial<QuestionarioVaga>): Promise<QuestionarioVaga> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar questionário');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Remove um questionário
   */
  static async removerQuestionario(id: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao remover questionário');
    }
  }

  /**
   * Valida perguntas antes de salvar
   */
  static validarPerguntas(perguntas: PerguntaQuestionario[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar se há pelo menos uma pergunta
    if (perguntas.length === 0) {
      return { valid: true, errors: [] }; // Questionário vazio é permitido
    }

    perguntas.forEach((pergunta, index) => {
      // Validar texto da pergunta
      if (!pergunta.pergunta.trim()) {
        errors.push(`Pergunta ${index + 1}: O texto da pergunta é obrigatório`);
      }

      // Validar opções para perguntas de múltipla escolha
      if (['multipla_escolha', 'escolha_unica'].includes(pergunta.tipo)) {
        if (!pergunta.opcoes || pergunta.opcoes.length === 0) {
          errors.push(`Pergunta ${index + 1}: Perguntas de escolha devem ter pelo menos uma opção`);
        } else {
          const opcoesValidas = pergunta.opcoes.filter(opcao => opcao.trim());
          if (opcoesValidas.length < 2) {
            errors.push(`Pergunta ${index + 1}: Perguntas de escolha devem ter pelo menos duas opções válidas`);
          }
        }
      }

      // Verificar duplicação de ordem
      const perguntasComMesmaOrdem = perguntas.filter(p => p.ordem === pergunta.ordem);
      if (perguntasComMesmaOrdem.length > 1) {
        errors.push(`Pergunta ${index + 1}: Ordem duplicada encontrada`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gera um objeto questionário pronto para salvar no banco
   */
  static gerarQuestionarioParaVaga(
    vagaId: string, 
    perguntas: PerguntaQuestionario[],
    titulo?: string,
    descricao?: string
  ): CreateQuestionarioVaga {
    // Ordenar perguntas por ordem
    const perguntasOrdenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);
    
    // Renumerar ordens para garantir sequência
    const perguntasRenumeradas = perguntasOrdenadas.map((pergunta, index) => ({
      ...pergunta,
      ordem: index + 1
    }));

    return {
      vaga_id: vagaId,
      titulo: titulo || 'Questionário da Vaga',
      descricao,
      ativo: true,
      perguntas: perguntasRenumeradas
    };
  }

  /**
   * Salva ou atualiza o questionário de uma vaga
   */
  static async salvarQuestionarioVaga(
    vagaId: string,
    perguntas: PerguntaQuestionario[],
    titulo?: string,
    descricao?: string
  ): Promise<QuestionarioVaga> {
    try {
      // Se não há perguntas, não criar questionário
      if (!perguntas || perguntas.length === 0) {
        throw new Error('Nenhuma pergunta fornecida para o questionário');
      }

      // Verificar se já existe um questionário para esta vaga
      const questionarioExistente = await this.buscarQuestionarioPorVaga(vagaId);
      
      if (questionarioExistente) {
        // Atualizar questionário existente
        return await this.atualizarQuestionario(questionarioExistente.id, {
          titulo: titulo || questionarioExistente.titulo,
          descricao,
          perguntas: this.gerarQuestionarioParaVaga(vagaId, perguntas, titulo, descricao).perguntas,
          ativo: true
        });
      } else {
        // Criar novo questionário
        const novoQuestionario = this.gerarQuestionarioParaVaga(vagaId, perguntas, titulo, descricao);
        return await this.criarQuestionario(novoQuestionario);
      }
    } catch (error) {
      console.error('Erro ao salvar questionário:', error);
      throw error;
    }
  }

  /**
   * Gera preview das perguntas para exibição
   */
  static gerarPreviewPerguntas(perguntas: PerguntaQuestionario[]): string {
    if (perguntas.length === 0) {
      return 'Nenhuma pergunta adicionada';
    }

    const preview = perguntas
      .sort((a, b) => a.ordem - b.ordem)
      .slice(0, 3) // Mostrar apenas as 3 primeiras
      .map((pergunta, index) => {
        const obrigatoria = pergunta.obrigatoria ? ' *' : '';
        return `${index + 1}. ${pergunta.pergunta}${obrigatoria}`;
      })
      .join('\n');

    const adicional = perguntas.length > 3 ? `\n... e mais ${perguntas.length - 3} pergunta(s)` : '';
    
    return preview + adicional;
  }
} 