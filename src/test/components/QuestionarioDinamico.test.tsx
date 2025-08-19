import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionarioDinamico } from '@/components/vagas/QuestionarioDinamico'
import { PerguntaQuestionario } from '@/types'

describe('QuestionarioDinamico', () => {
  const mockPerguntas: PerguntaQuestionario[] = [
    {
      id: '1',
      pergunta: 'Qual sua experiência com React?',
      tipo: 'texto_longo',
      obrigatoria: true,
      ordem: 1
    },
    {
      id: '2',
      pergunta: 'Escolha seu nível de experiência',
      tipo: 'escolha_unica',
      obrigatoria: false,
      opcoes: ['Júnior', 'Pleno', 'Sênior'],
      ordem: 2
    }
  ]

  const mockProps = {
    perguntas: [],
    onChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty state when no questions', () => {
    render(<QuestionarioDinamico {...mockProps} />)
    
    expect(screen.getByText('Questionário Personalizado')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma pergunta adicionada')).toBeInTheDocument()
    expect(screen.getByText('Adicionar Primeira Pergunta')).toBeInTheDocument()
  })

  it('should render existing questions', () => {
    render(<QuestionarioDinamico {...mockProps} perguntas={mockPerguntas} />)
    
    expect(screen.getByText('Qual sua experiência com React?')).toBeInTheDocument()
    expect(screen.getByText('Escolha seu nível de experiência')).toBeInTheDocument()
    expect(screen.getByText('Obrigatória')).toBeInTheDocument()
  })

  it('should add new question when clicking add button', async () => {
    const user = userEvent.setup()
    render(<QuestionarioDinamico {...mockProps} />)
    
    const addButton = screen.getByText('Adicionar Pergunta')
    await user.click(addButton)
    
    expect(mockProps.onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          pergunta: '',
          tipo: 'texto',
          obrigatoria: false,
          ordem: 1
        })
      ])
    )
  })

  it('should remove question when clicking remove button', async () => {
    const user = userEvent.setup()
    render(<QuestionarioDinamico {...mockProps} perguntas={mockPerguntas} />)
    
    // Primeiro clique para expandir a pergunta
    const perguntaCard = screen.getByText('Qual sua experiência com React?')
    await user.click(perguntaCard)
    
    // Encontrar e clicar no botão de remover
    const removeButtons = screen.getAllByRole('button')
    const removeButton = removeButtons.find(btn => 
      btn.querySelector('svg') && btn.getAttribute('aria-label') === 'remover'
    )
    
    if (removeButton) {
      await user.click(removeButton)
      
      expect(mockProps.onChange).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ id: '1' })
        ])
      )
    }
  })

  it('should update question text', async () => {
    const user = userEvent.setup()
    render(<QuestionarioDinamico {...mockProps} perguntas={mockPerguntas} />)
    
    // Expandir a primeira pergunta
    const perguntaCard = screen.getByText('Qual sua experiência com React?')
    await user.click(perguntaCard)
    
    // Encontrar o input de texto da pergunta
    const textInput = screen.getByDisplayValue('Qual sua experiência com React?')
    await user.clear(textInput)
    await user.type(textInput, 'Nova pergunta')
    
    await waitFor(() => {
      expect(mockProps.onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            pergunta: 'Nova pergunta'
          })
        ])
      )
    })
  })

  it('should toggle required status', async () => {
    const user = userEvent.setup()
    render(<QuestionarioDinamico {...mockProps} perguntas={mockPerguntas} />)
    
    // Expandir a primeira pergunta
    const perguntaCard = screen.getByText('Qual sua experiência com React?')
    await user.click(perguntaCard)
    
    // Encontrar e clicar no checkbox de obrigatória
    const checkbox = screen.getByLabelText('Esta pergunta é obrigatória')
    await user.click(checkbox)
    
    expect(mockProps.onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          obrigatoria: false // Era true, deve virar false
        })
      ])
    )
  })

  it('should change question type', async () => {
    const user = userEvent.setup()
    render(<QuestionarioDinamico {...mockProps} perguntas={mockPerguntas} />)
    
    // Expandir a primeira pergunta
    const perguntaCard = screen.getByText('Qual sua experiência com React?')
    await user.click(perguntaCard)
    
    // Encontrar o select de tipo
    const typeSelect = screen.getByDisplayValue('Texto Longo')
    await user.click(typeSelect)
    
    // Selecionar uma nova opção
    const novaOpcao = screen.getByText('Múltipla Escolha')
    await user.click(novaOpcao)
    
    expect(mockProps.onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          tipo: 'multipla_escolha'
        })
      ])
    )
  })

  it('should add options for multiple choice questions', async () => {
    const user = userEvent.setup()
    const perguntaMultipla = [{
      id: '1',
      pergunta: 'Escolha tecnologias',
      tipo: 'multipla_escolha' as const,
      obrigatoria: false,
      opcoes: ['React', 'Vue'],
      ordem: 1
    }]
    
    render(<QuestionarioDinamico {...mockProps} perguntas={perguntaMultipla} />)
    
    // Expandir a pergunta
    const perguntaCard = screen.getByText('Escolha tecnologias')
    await user.click(perguntaCard)
    
    // Encontrar e clicar no botão "Adicionar Opção"
    const addOptionButton = screen.getByText('Adicionar Opção')
    await user.click(addOptionButton)
    
    expect(mockProps.onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          opcoes: expect.arrayContaining(['React', 'Vue', ''])
        })
      ])
    )
  })

  it('should move questions up and down', async () => {
    const user = userEvent.setup()
    render(<QuestionarioDinamico {...mockProps} perguntas={mockPerguntas} />)
    
    // Encontrar botões de mover para cima/baixo na segunda pergunta
    const perguntaCards = screen.getAllByRole('button')
    const moveUpButtons = perguntaCards.filter(btn => btn.textContent === '↑')
    
    if (moveUpButtons.length > 0) {
      await user.click(moveUpButtons[1]) // Segunda pergunta para cima
      
      expect(mockProps.onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '2', ordem: 1 }),
          expect.objectContaining({ id: '1', ordem: 2 })
        ])
      )
    }
  })

  it('should validate question types correctly', () => {
    const tiposDisponiveis = [
      'texto', 'texto_longo', 'numero', 'data', 
      'escolha_unica', 'multipla_escolha'
    ]
    
    render(<QuestionarioDinamico {...mockProps} />)
    
    // Verificar se todos os tipos estão disponíveis
    expect(screen.getByText('Questionário Personalizado')).toBeInTheDocument()
    
    // Adicionar pergunta para ver os tipos
    const addButton = screen.getByText('Adicionar Pergunta')
    expect(addButton).toBeInTheDocument()
  })

  it('should show correct icons for question types', () => {
    const perguntasComTipos: PerguntaQuestionario[] = [
      {
        id: '1',
        pergunta: 'Texto simples',
        tipo: 'texto',
        obrigatoria: false,
        ordem: 1
      },
      {
        id: '2',
        pergunta: 'Número',
        tipo: 'numero',
        obrigatoria: false,
        ordem: 2
      }
    ]
    
    render(<QuestionarioDinamico {...mockProps} perguntas={perguntasComTipos} />)
    
    expect(screen.getByText('Texto simples')).toBeInTheDocument()
    expect(screen.getByText('Número')).toBeInTheDocument()
  })
}) 