import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosicoesFechadasService } from '@/lib/posicoesFechadasService';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe('Posições Fechadas - Validação de Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar apenas posições de vagas encerradas', async () => {
    const mockPosicoes = [
      {
        id: '123',
        vaga_id: 'vaga-1',
        numero_vaga: '001',
        cargo: 'Desenvolvedor',
        empresa_id: 'empresa-1',
        empresa_nome: 'Empresa Teste',
        empresa_email: 'teste@empresa.com',
        consultor_id: 'consultor-1',
        consultor_nome: 'Consultor Teste',
        data_recebimento: '2024-01-01',
        data_encerramento: '2024-01-31',
        status_posicao: 'em_analise',
        candidatos_aprovados: [
          {
            id: 'candidato-1',
            nome: 'João Silva',
            email: 'joao@email.com',
            data_aprovacao: '2024-01-15'
          }
        ],
        total_days: 30,
        observacoes: null,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockPosicoes,
      error: null
    } as any);

    const resultado = await PosicoesFechadasService.list();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].numero_vaga).toBe('001');
    expect(supabase.rpc).toHaveBeenCalledWith('get_posicoes_fechadas', {
      p_consultor_id: null,
      p_empresa_id: null,
      p_data_inicio: null,
      p_data_fim: null
    });
  });

  it('deve aplicar filtros corretamente', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null
    } as any);

    const filters = {
      consultor_id: 'consultor-1',
      empresa_id: 'empresa-1',
      data_inicio: '2024-01-01',
      data_fim: '2024-01-31'
    };

    await PosicoesFechadasService.list(filters);

    expect(supabase.rpc).toHaveBeenCalledWith('get_posicoes_fechadas', {
      p_consultor_id: 'consultor-1',
      p_empresa_id: 'empresa-1',
      p_data_inicio: '2024-01-01',
      p_data_fim: '2024-01-31'
    });
  });

  it('deve retornar array vazio quando não há posições válidas', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null
    } as any);

    const resultado = await PosicoesFechadasService.list();

    expect(resultado).toEqual([]);
  });

  it('deve lidar com erro na consulta', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Erro na consulta' }
    } as any);

    await expect(PosicoesFechadasService.list()).rejects.toThrow('Erro na consulta');
  });
}); 