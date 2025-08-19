import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionarioDinamico } from '@/components/vagas/QuestionarioDinamico';
import { PreviewQuestionario } from '@/components/vagas/PreviewQuestionario';

// Mock das perguntas para teste
const mockQuestionsSimples = [
  {
    id: '1',
    pergunta: 'Qual sua experiência com React?',
    tipo: 'multipla_escolha',
    opcoes: ['Iniciante', 'Intermediário', 'Avançado'],
    obrigatoria: true
  },
  {
    id: '2',
    pergunta: 'Você tem experiência com TypeScript?',
    tipo: 'sim_nao',
    obrigatoria: true
  },
  {
    id: '3',
    pergunta: 'Descreva seus projetos anteriores:',
    tipo: 'texto_longo',
    obrigatoria: false
  }
];

const mockQuestionsComplexas = [
  {
    id: '1',
    pergunta: 'Quantos anos de experiência você tem com desenvolvimento web?',
    tipo: 'multipla_escolha',
    opcoes: ['Menos de 1 ano', '1-2 anos', '3-5 anos', 'Mais de 5 anos'],
    obrigatoria: true
  },
  {
    id: '2',
    pergunta: 'Quais tecnologias você domina?',
    tipo: 'multipla_escolha',
    opcoes: ['React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java'],
    obrigatoria: true
  },
  {
    id: '3',
    pergunta: 'Você está disponível para trabalho remoto?',
    tipo: 'sim_nao',
    obrigatoria: true
  },
  {
    id: '4',
    pergunta: 'Qual sua expectativa salarial?',
    tipo: 'texto_curto',
    obrigatoria: false
  },
  {
    id: '5',
    pergunta: 'Conte sobre um projeto desafiador que você desenvolveu:',
    tipo: 'texto_longo',
    obrigatoria: false
  },
  {
    id: '6',
    pergunta: 'Você aceita trabalhar em horário flexível?',
    tipo: 'sim_nao',
    obrigatoria: false
  }
];

describe('Validação de Questionário - Testes de Integração', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('QuestionarioDinamico - Validações Básicas', () => {
    it('deve exibir todas as perguntas corretamente', () => {
      const mockOnChange = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={{}}
          onChange={mockOnChange}
        />
      );

      // Verificar se todas as perguntas estão sendo exibidas
      expect(screen.getByText('Qual sua experiência com React?')).toBeInTheDocument();
      expect(screen.getByText('Você tem experiência com TypeScript?')).toBeInTheDocument();
      expect(screen.getByText('Descreva seus projetos anteriores:')).toBeInTheDocument();

      // Verificar indicadores de obrigatoriedade
      const obrigatoriaLabels = screen.getAllByText('*');
      expect(obrigatoriaLabels).toHaveLength(2); // Apenas 2 perguntas obrigatórias
    });

    it('deve validar perguntas obrigatórias não respondidas', async () => {
      const mockOnChange = vi.fn();
      const mockOnValidate = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={{}}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );

      // Tentar validar sem responder perguntas obrigatórias
      const validateButton = screen.getByRole('button', { name: /validar/i });
      await user.click(validateButton);

      // Verificar se a validação falhou
      expect(mockOnValidate).toHaveBeenCalledWith(false, expect.arrayContaining(['1', '2']));
    });

    it('deve permitir responder pergunta de múltipla escolha', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={{}}
          onChange={mockOnChange}
        />
      );

      // Selecionar opção da primeira pergunta
      const radioButton = screen.getByLabelText('Intermediário');
      await user.click(radioButton);

      // Verificar se onChange foi chamado
      expect(mockOnChange).toHaveBeenCalledWith({
        '1': 'Intermediário'
      });
    });

    it('deve permitir responder pergunta sim/não', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={{}}
          onChange={mockOnChange}
        />
      );

      // Clicar em "Sim" para a segunda pergunta
      const simButton = screen.getByLabelText(/sim.*typescript/i);
      await user.click(simButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        '2': 'sim'
      });
    });

    it('deve permitir responder pergunta de texto longo', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={{}}
          onChange={mockOnChange}
        />
      );

      // Escrever na textarea
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Desenvolvi diversos projetos utilizando React e Node.js');

      expect(mockOnChange).toHaveBeenCalledWith({
        '3': 'Desenvolvi diversos projetos utilizando React e Node.js'
      });
    });

    it('deve validar com sucesso quando todas as perguntas obrigatórias estão respondidas', async () => {
      const mockOnChange = vi.fn();
      const mockOnValidate = vi.fn();
      
      const respostasCompletas = {
        '1': 'Intermediário',
        '2': 'sim',
        '3': 'Projetos diversos'
      };
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={respostasCompletas}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );

      // Validar questionário
      const validateButton = screen.getByRole('button', { name: /validar/i });
      await user.click(validateButton);

      // Verificar se a validação passou
      expect(mockOnValidate).toHaveBeenCalledWith(true, []);
    });
  });

  describe('QuestionarioDinamico - Cenários Complexos', () => {
    it('deve lidar com questionário com muitas perguntas', () => {
      const mockOnChange = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsComplexas}
          respostas={{}}
          onChange={mockOnChange}
        />
      );

      // Verificar se todas as perguntas complexas estão sendo exibidas
      expect(screen.getByText(/anos de experiência.*desenvolvimento web/i)).toBeInTheDocument();
      expect(screen.getByText(/tecnologias você domina/i)).toBeInTheDocument();
      expect(screen.getByText(/trabalho remoto/i)).toBeInTheDocument();
      expect(screen.getByText(/expectativa salarial/i)).toBeInTheDocument();
      expect(screen.getByText(/projeto desafiador/i)).toBeInTheDocument();
      expect(screen.getByText(/horário flexível/i)).toBeInTheDocument();

      // Verificar contagem de perguntas obrigatórias
      const obrigatoriaLabels = screen.getAllByText('*');
      expect(obrigatoriaLabels).toHaveLength(3); // 3 perguntas obrigatórias
    });

    it('deve permitir responder múltiplas perguntas de diferentes tipos', async () => {
      const mockOnChange = vi.fn();
      let respostas = {};
      
      // Mock para atualizar respostas localmente
      mockOnChange.mockImplementation((novasRespostas) => {
        respostas = { ...respostas, ...novasRespostas };
      });
      
      const { rerender } = render(
        <QuestionarioDinamico
          perguntas={mockQuestionsComplexas}
          respostas={respostas}
          onChange={mockOnChange}
        />
      );

      // Responder primeira pergunta (múltipla escolha)
      await user.click(screen.getByLabelText('3-5 anos'));
      
      // Responder segunda pergunta (múltipla escolha)
      await user.click(screen.getByLabelText('React'));
      
      // Responder terceira pergunta (sim/não)
      await user.click(screen.getByLabelText(/sim.*remoto/i));
      
      // Responder quarta pergunta (texto curto)
      const textInput = screen.getByRole('textbox');
      await user.type(textInput, 'R$ 8.000');
      
      // Responder quinta pergunta (texto longo)
      const textareas = screen.getAllByRole('textbox');
      const textareaLongo = textareas[textareas.length - 1];
      await user.type(textareaLongo, 'Desenvolvi um sistema completo de e-commerce usando React, Node.js e PostgreSQL');

      // Verificar se todas as respostas foram registradas
      expect(mockOnChange).toHaveBeenCalledTimes(5);
    });

    it('deve identificar perguntas obrigatórias não respondidas em questionário complexo', async () => {
      const mockOnChange = vi.fn();
      const mockOnValidate = vi.fn();
      
      // Responder apenas algumas perguntas (deixar obrigatórias sem resposta)
      const respostasIncompletas = {
        '4': 'R$ 8.000', // pergunta opcional
        '5': 'Projeto de e-commerce' // pergunta opcional
      };
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsComplexas}
          respostas={respostasIncompletas}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );

      // Tentar validar
      const validateButton = screen.getByRole('button', { name: /validar/i });
      await user.click(validateButton);

      // Verificar se identificou as 3 perguntas obrigatórias não respondidas
      expect(mockOnValidate).toHaveBeenCalledWith(false, ['1', '2', '3']);
    });
  });

  describe('PreviewQuestionario', () => {
    it('deve exibir preview do questionário corretamente', () => {
      render(
        <PreviewQuestionario
          perguntas={mockQuestionsSimples}
          titulo="Preview do Questionário"
        />
      );

      // Verificar título
      expect(screen.getByText('Preview do Questionário')).toBeInTheDocument();

      // Verificar se todas as perguntas estão no preview
      expect(screen.getByText('Qual sua experiência com React?')).toBeInTheDocument();
      expect(screen.getByText('Você tem experiência com TypeScript?')).toBeInTheDocument();
      expect(screen.getByText('Descreva seus projetos anteriores:')).toBeInTheDocument();

      // Verificar tipos de pergunta
      expect(screen.getByText('Múltipla escolha')).toBeInTheDocument();
      expect(screen.getByText('Sim/Não')).toBeInTheDocument();
      expect(screen.getByText('Texto longo')).toBeInTheDocument();

      // Verificar indicadores de obrigatoriedade
      expect(screen.getAllByText('Obrigatória')).toHaveLength(2);
      expect(screen.getByText('Opcional')).toBeInTheDocument();
    });

    it('deve exibir opções para perguntas de múltipla escolha no preview', () => {
      render(
        <PreviewQuestionario
          perguntas={mockQuestionsSimples}
          titulo="Preview"
        />
      );

      // Verificar se as opções da pergunta de múltipla escolha estão sendo exibidas
      expect(screen.getByText('Iniciante')).toBeInTheDocument();
      expect(screen.getByText('Intermediário')).toBeInTheDocument();
      expect(screen.getByText('Avançado')).toBeInTheDocument();
    });
  });

  describe('Fluxo de Candidatura com Questionário', () => {
    it('deve simular fluxo completo de preenchimento e validação', async () => {
      const mockOnChange = vi.fn();
      const mockOnValidate = vi.fn();
      let respostasAtivas = {};

      // Mock que simula comportamento real do onChange
      mockOnChange.mockImplementation((novasRespostas) => {
        respostasAtivas = { ...respostasAtivas, ...novasRespostas };
      });

      const { rerender } = render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={respostasAtivas}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );

      // Passo 1: Tentar validar sem respostas
      await user.click(screen.getByRole('button', { name: /validar/i }));
      expect(mockOnValidate).toHaveBeenLastCalledWith(false, ['1', '2']);

      // Passo 2: Responder primeira pergunta
      await user.click(screen.getByLabelText('Avançado'));
      respostasAtivas = { ...respostasAtivas, '1': 'Avançado' };
      
      rerender(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={respostasAtivas}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );

      // Passo 3: Tentar validar novamente (ainda falta uma obrigatória)
      await user.click(screen.getByRole('button', { name: /validar/i }));
      expect(mockOnValidate).toHaveBeenLastCalledWith(false, ['2']);

      // Passo 4: Responder segunda pergunta obrigatória
      await user.click(screen.getByLabelText(/sim.*typescript/i));
      respostasAtivas = { ...respostasAtivas, '2': 'sim' };
      
      rerender(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={respostasAtivas}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );

      // Passo 5: Validar com sucesso
      await user.click(screen.getByRole('button', { name: /validar/i }));
      expect(mockOnValidate).toHaveBeenLastCalledWith(true, []);

      // Passo 6: Adicionar resposta opcional
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Trabalhei em projetos de e-commerce e sistemas administrativos');
      respostasAtivas = { ...respostasAtivas, '3': 'Trabalhei em projetos de e-commerce e sistemas administrativos' };

      // Passo 7: Validar novamente (deve continuar válido)
      rerender(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={respostasAtivas}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );
      
      await user.click(screen.getByRole('button', { name: /validar/i }));
      expect(mockOnValidate).toHaveBeenLastCalledWith(true, []);

      // Verificar que todas as respostas foram coletadas
      expect(Object.keys(respostasAtivas)).toEqual(['1', '2', '3']);
      expect(respostasAtivas['1']).toBe('Avançado');
      expect(respostasAtivas['2']).toBe('sim');
      expect(respostasAtivas['3']).toBe('Trabalhei em projetos de e-commerce e sistemas administrativos');
    });
  });

  describe('Casos Extremos e Validações Especiais', () => {
    it('deve lidar com questionário vazio', () => {
      const mockOnChange = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={[]}
          respostas={{}}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/nenhuma pergunta configurada/i)).toBeInTheDocument();
    });

    it('deve validar questionário apenas com perguntas opcionais', async () => {
      const perguntasOpcionais = [
        {
          id: '1',
          pergunta: 'Comentários adicionais:',
          tipo: 'texto_longo',
          obrigatoria: false
        },
        {
          id: '2',
          pergunta: 'Disponibilidade para viagem:',
          tipo: 'sim_nao',
          obrigatoria: false
        }
      ];

      const mockOnChange = vi.fn();
      const mockOnValidate = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={perguntasOpcionais}
          respostas={{}}
          onChange={mockOnChange}
          onValidate={mockOnValidate}
        />
      );

      // Validar sem responder nenhuma pergunta (deve passar)
      await user.click(screen.getByRole('button', { name: /validar/i }));
      expect(mockOnValidate).toHaveBeenCalledWith(true, []);
    });

    it('deve preservar respostas ao recarregar componente', () => {
      const respostasExistentes = {
        '1': 'Intermediário',
        '2': 'sim',
        '3': 'Resposta preservada'
      };

      const mockOnChange = vi.fn();
      
      render(
        <QuestionarioDinamico
          perguntas={mockQuestionsSimples}
          respostas={respostasExistentes}
          onChange={mockOnChange}
        />
      );

      // Verificar se as respostas foram preservadas
      expect(screen.getByDisplayValue('Intermediário')).toBeInTheDocument();
      expect(screen.getByDisplayValue('sim')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Resposta preservada')).toBeInTheDocument();
    });
  });
}); 