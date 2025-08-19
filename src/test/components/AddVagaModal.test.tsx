import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddVagaModal } from '@/components/vagas/AddVagaModal'

const mockClientes = [
  { id: '1', razao_social: 'Empresa Teste LTDA' },
  { id: '2', razao_social: 'Tech Solutions Inc' }
]

const mockUsuarios = [
  { id: '1', nome: 'João Silva' },
  { id: '2', nome: 'Maria Santos' }
]

// Mock do Supabase com dados específicos
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'clientes') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockClientes, error: null }))
            }))
          }))
        }
      }
      if (table === 'usuarios') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockUsuarios, error: null }))
            }))
          }))
        }
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }
    })
  }
}))

describe('AddVagaModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when open', () => {
    render(<AddVagaModal {...mockProps} />)
    
    expect(screen.getByText('Cadastrar Nova Vaga')).toBeInTheDocument()
    expect(screen.getByText('Informações Básicas')).toBeInTheDocument()
    expect(screen.getByText('Cronograma do Processo')).toBeInTheDocument()
    expect(screen.getByText('Documentos e Informações')).toBeInTheDocument()
  })

  it('should not render modal when closed', () => {
    render(<AddVagaModal {...mockProps} isOpen={false} />)
    
    expect(screen.queryByText('Cadastrar Nova Vaga')).not.toBeInTheDocument()
  })

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(<AddVagaModal {...mockProps} />)
    
    const submitButton = screen.getByText('Cadastrar Vaga')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Número da vaga é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Empresa é obrigatória')).toBeInTheDocument()
      expect(screen.getByText('Contato é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('E-mail é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Cargo é obrigatório')).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<AddVagaModal {...mockProps} />)
    
    const emailInput = screen.getByPlaceholderText('contato@empresa.com.br')
    await user.type(emailInput, 'email-inválido')
    
    const submitButton = screen.getByText('Cadastrar Vaga')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('E-mail deve ser válido')).toBeInTheDocument()
    })
  })

  it('should format phone number correctly', async () => {
    const user = userEvent.setup()
    render(<AddVagaModal {...mockProps} />)
    
    const phoneInput = screen.getByPlaceholderText('(XX) XXXXX-XXXX')
    await user.type(phoneInput, '11999887766')
    
    await waitFor(() => {
      expect(phoneInput).toHaveValue('(11) 99988-7766')
    })
  })

  it('should load clients and users when modal opens', async () => {
    render(<AddVagaModal {...mockProps} />)
    
    await waitFor(() => {
      // Verifica se os selects foram populados
      expect(screen.getByText('Selecione a empresa')).toBeInTheDocument()
      expect(screen.getByText('Selecione o consultor')).toBeInTheDocument()
    })
  })

  it('should render questionário tabs', () => {
    render(<AddVagaModal {...mockProps} />)
    
    expect(screen.getByText('Editor de Perguntas')).toBeInTheDocument()
    expect(screen.getByText('Prévia (0)')).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<AddVagaModal {...mockProps} />)
    
    // Preencher campos obrigatórios
    await user.type(screen.getByPlaceholderText('Ex: DEV-001, MKT-002'), 'TEST-001')
    await user.type(screen.getByPlaceholderText('Nome do contato'), 'João Silva')
    await user.type(screen.getByPlaceholderText('contato@empresa.com.br'), 'joao@empresa.com')
    await user.type(screen.getByPlaceholderText('(XX) XXXXX-XXXX'), '11999887766')
    await user.type(screen.getByPlaceholderText('Ex: Desenvolvedor Senior'), 'Desenvolvedor Frontend')
    await user.type(screen.getByPlaceholderText('Ex: R$ 5.000 - R$ 8.000'), 'R$ 8.000')
    await user.type(screen.getByPlaceholderText('Ex: São Paulo, SP - Híbrido'), 'São Paulo, SP')
    
    // Preencher datas
    const today = new Date().toISOString().split('T')[0]
    const dateInputs = screen.getAllByDisplayValue('')
    dateInputs.forEach(async (input) => {
      if (input.getAttribute('type') === 'date') {
        await user.type(input, today)
      }
    })
    
    // Submeter formulário
    const submitButton = screen.getByText('Cadastrar Vaga')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalled()
    })
  })

  it('should close modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<AddVagaModal {...mockProps} />)
    
    const cancelButton = screen.getByText('Cancelar')
    await user.click(cancelButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('should add new question to questionário', async () => {
    const user = userEvent.setup()
    render(<AddVagaModal {...mockProps} />)
    
    // Clicar no botão de adicionar pergunta
    const addButton = screen.getByText('Adicionar Pergunta')
    await user.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Prévia (1)')).toBeInTheDocument()
    })
  })

  it('should switch between editor and preview tabs', async () => {
    const user = userEvent.setup()
    render(<AddVagaModal {...mockProps} />)
    
    // Adicionar uma pergunta primeiro
    const addButton = screen.getByText('Adicionar Pergunta')
    await user.click(addButton)
    
    // Trocar para aba de prévia
    const previewTab = screen.getByText('Prévia (1)')
    await user.click(previewTab)
    
    await waitFor(() => {
      expect(screen.getByText('Prévia do Questionário')).toBeInTheDocument()
    })
  })
}) 