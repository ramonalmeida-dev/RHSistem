import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuestionarioService } from '@/lib/questionarioService'
import { PerguntaQuestionario } from '@/types'

// Mock do fetch global
global.fetch = vi.fn()

describe('QuestionarioService', () => {
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
      pergunta: 'Tecnologias que domina',
      tipo: 'multipla_escolha',
      obrigatoria: false,
      opcoes: ['React', 'Vue', 'Angular'],
      ordem: 2
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock do import.meta.env
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
      },
    })
  })

  describe('validarPerguntas', () => {
    it('should return valid for empty questions array', () => {
      const result = QuestionarioService.validarPerguntas([])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid for correct questions', () => {
      const result = QuestionarioService.validarPerguntas(mockPerguntas)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect empty question text', () => {
      const perguntasInvalidas: PerguntaQuestionario[] = [
        {
          id: '1',
          pergunta: '',
          tipo: 'texto',
          obrigatoria: true,
          ordem: 1
        }
      ]
      
      const result = QuestionarioService.validarPerguntas(perguntasInvalidas)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Pergunta 1: O texto da pergunta é obrigatório')
    })

    it('should detect missing options for choice questions', () => {
      const perguntasInvalidas: PerguntaQuestionario[] = [
        {
          id: '1',
          pergunta: 'Escolha uma opção',
          tipo: 'escolha_unica',
          obrigatoria: false,
          ordem: 1
        }
      ]
      
      const result = QuestionarioService.validarPerguntas(perguntasInvalidas)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Pergunta 1: Perguntas de escolha devem ter pelo menos uma opção')
    })

    it('should detect insufficient options for choice questions', () => {
      const perguntasInvalidas: PerguntaQuestionario[] = [
        {
          id: '1',
          pergunta: 'Escolha uma opção',
          tipo: 'multipla_escolha',
          obrigatoria: false,
          opcoes: ['Só uma opção'],
          ordem: 1
        }
      ]
      
      const result = QuestionarioService.validarPerguntas(perguntasInvalidas)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Pergunta 1: Perguntas de escolha devem ter pelo menos duas opções válidas')
    })

    it('should detect duplicate order numbers', () => {
      const perguntasInvalidas: PerguntaQuestionario[] = [
        {
          id: '1',
          pergunta: 'Pergunta 1',
          tipo: 'texto',
          obrigatoria: false,
          ordem: 1
        },
        {
          id: '2',
          pergunta: 'Pergunta 2',
          tipo: 'texto',
          obrigatoria: false,
          ordem: 1 // Ordem duplicada
        }
      ]
      
      const result = QuestionarioService.validarPerguntas(perguntasInvalidas)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(error => error.includes('Ordem duplicada'))).toBe(true)
    })
  })

  describe('gerarQuestionarioParaVaga', () => {
    it('should generate questionario with correct structure', () => {
      const vagaId = 'vaga-123'
      const titulo = 'Questionário Teste'
      const descricao = 'Descrição do questionário'
      
      const result = QuestionarioService.gerarQuestionarioParaVaga(
        vagaId,
        mockPerguntas,
        titulo,
        descricao
      )
      
      expect(result).toEqual({
        vaga_id: vagaId,
        titulo,
        descricao,
        ativo: true,
        perguntas: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            ordem: 1
          }),
          expect.objectContaining({
            id: '2',
            ordem: 2
          })
        ])
      })
    })

    it('should reorder questions correctly', () => {
      const perguntasDesordenadas: PerguntaQuestionario[] = [
        {
          id: '2',
          pergunta: 'Segunda pergunta',
          tipo: 'texto',
          obrigatoria: false,
          ordem: 3
        },
        {
          id: '1',
          pergunta: 'Primeira pergunta',
          tipo: 'texto',
          obrigatoria: false,
          ordem: 1
        }
      ]
      
      const result = QuestionarioService.gerarQuestionarioParaVaga(
        'vaga-123',
        perguntasDesordenadas
      )
      
      expect(result.perguntas[0]).toEqual(
        expect.objectContaining({
          id: '1',
          ordem: 1
        })
      )
      expect(result.perguntas[1]).toEqual(
        expect.objectContaining({
          id: '2',
          ordem: 2
        })
      )
    })

    it('should use default title when not provided', () => {
      const result = QuestionarioService.gerarQuestionarioParaVaga(
        'vaga-123',
        mockPerguntas
      )
      
      expect(result.titulo).toBe('Questionário da Vaga')
    })
  })

  describe('gerarPreviewPerguntas', () => {
    it('should return empty message for no questions', () => {
      const result = QuestionarioService.gerarPreviewPerguntas([])
      
      expect(result).toBe('Nenhuma pergunta adicionada')
    })

    it('should generate preview for questions', () => {
      const result = QuestionarioService.gerarPreviewPerguntas(mockPerguntas)
      
      expect(result).toContain('1. Qual sua experiência com React? *')
      expect(result).toContain('2. Tecnologias que domina')
      expect(result).not.toContain('*', result.indexOf('Tecnologias que domina'))
    })

    it('should limit preview to 3 questions', () => {
      const muitasPerguntas: PerguntaQuestionario[] = [
        ...mockPerguntas,
        {
          id: '3',
          pergunta: 'Terceira pergunta',
          tipo: 'texto',
          obrigatoria: false,
          ordem: 3
        },
        {
          id: '4',
          pergunta: 'Quarta pergunta',
          tipo: 'texto',
          obrigatoria: false,
          ordem: 4
        }
      ]
      
      const result = QuestionarioService.gerarPreviewPerguntas(muitasPerguntas)
      
      expect(result).toContain('... e mais 1 pergunta(s)')
      expect(result.split('\n')).toHaveLength(4) // 3 perguntas + linha adicional
    })
  })

  describe('buscarQuestionarioPorVaga', () => {
    it('should fetch questionario successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'questionario-123',
            vaga_id: 'vaga-123',
            titulo: 'Questionário Teste',
            perguntas: mockPerguntas
          }
        })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)
      
      const result = await QuestionarioService.buscarQuestionarioPorVaga('vaga-123')
      
      expect(fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/questionarios/vaga?vaga_id=vaga-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'apikey': 'test-key'
          })
        })
      )
      
      expect(result).toEqual(expect.objectContaining({
        id: 'questionario-123',
        vaga_id: 'vaga-123'
      }))
    })

    it('should return null for 404 response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)
      
      const result = await QuestionarioService.buscarQuestionarioPorVaga('vaga-inexistente')
      
      expect(result).toBeNull()
    })

    it('should throw error for other HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      }
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)
      
      await expect(
        QuestionarioService.buscarQuestionarioPorVaga('vaga-123')
      ).rejects.toThrow('Server error')
    })
  })

  describe('salvarQuestionarioVaga', () => {
    it('should throw error for empty questions', async () => {
      await expect(
        QuestionarioService.salvarQuestionarioVaga('vaga-123', [])
      ).rejects.toThrow('Nenhuma pergunta fornecida para o questionário')
    })

    it('should create new questionario when none exists', async () => {
      // Mock buscarQuestionarioPorVaga retornando null
      const mockSearchResponse = {
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      }
      
      const mockCreateResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'novo-questionario',
            vaga_id: 'vaga-123',
            titulo: 'Questionário da Vaga',
            perguntas: mockPerguntas
          }
        })
      }
      
      vi.mocked(fetch)
        .mockResolvedValueOnce(mockSearchResponse as any) // buscar
        .mockResolvedValueOnce(mockCreateResponse as any) // criar
      
      const result = await QuestionarioService.salvarQuestionarioVaga(
        'vaga-123',
        mockPerguntas,
        'Questionário Teste'
      )
      
      expect(result).toEqual(expect.objectContaining({
        id: 'novo-questionario',
        vaga_id: 'vaga-123'
      }))
    })
  })
}) 