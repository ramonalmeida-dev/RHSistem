import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientesService } from '@/lib/clientesService';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe('Validação de CNPJ Duplicado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar cliente existente quando CNPJ já está cadastrado', async () => {
    const mockCliente = {
      id: '123',
      razao_social: 'EMPRESA TESTE LTDA',
      nome_fantasia: 'EMPRESA TESTE',
      cnpj: '01.641.045/0005-31',
      ativo: true
    };

    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockCliente],
      error: null
    } as any);

    const resultado = await ClientesService.verificarCNPJExistente('01.641.045/0005-31');

    expect(resultado).toEqual([mockCliente]);
    expect(supabase.rpc).toHaveBeenCalledWith('verificar_cnpj_cliente', {
      cnpj_busca: '01.641.045/0005-31'
    });
  });

  it('deve retornar array vazio quando CNPJ não está cadastrado', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null
    } as any);

    const resultado = await ClientesService.verificarCNPJExistente('99.999.999/9999-99');

    expect(resultado).toEqual([]);
    expect(supabase.rpc).toHaveBeenCalledWith('verificar_cnpj_cliente', {
      cnpj_busca: '99.999.999/9999-99'
    });
  });

  it('deve lidar com CNPJ com máscaras diferentes', async () => {
    const mockCliente = {
      id: '123',
      razao_social: 'EMPRESA TESTE LTDA',
      nome_fantasia: 'EMPRESA TESTE',
      cnpj: '01.641.045/0005-31',
      ativo: true
    };

    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockCliente],
      error: null
    } as any);

    // Testar com CNPJ sem máscaras
    const resultado = await ClientesService.verificarCNPJExistente('01641045000531');

    expect(resultado).toEqual([mockCliente]);
    expect(supabase.rpc).toHaveBeenCalledWith('verificar_cnpj_cliente', {
      cnpj_busca: '01641045000531'
    });
  });

  it('deve lançar erro quando a consulta falha', async () => {
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Erro na consulta' }
    } as any);

    await expect(ClientesService.verificarCNPJExistente('01.641.045/0005-31'))
      .rejects.toThrow();
  });
}); 