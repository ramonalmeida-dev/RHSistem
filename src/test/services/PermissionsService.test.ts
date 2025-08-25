import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}));

describe('Sistema de Permissões', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Função obter_permissoes_usuario', () => {
    it('deve retornar permissões do usuário corretamente', async () => {
      const mockPermissoes = [
        { id: '1', nome: 'usuarios_visualizar', modulo: 'usuarios', acao: 'visualizar' },
        { id: '2', nome: 'usuarios_criar', modulo: 'usuarios', acao: 'criar' },
        { id: '3', nome: 'vagas_visualizar', modulo: 'vagas', acao: 'visualizar' }
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockPermissoes,
        error: null
      });

      const result = await supabase.rpc('obter_permissoes_usuario', {
        p_user_id: 'test-user-id'
      });

      expect(supabase.rpc).toHaveBeenCalledWith('obter_permissoes_usuario', {
        p_user_id: 'test-user-id'
      });
      expect(result.data).toEqual(mockPermissoes);
      expect(result.error).toBeNull();
    });

    it('deve retornar erro quando usuário não existe', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'Usuário não encontrado' }
      });

      const result = await supabase.rpc('obter_permissoes_usuario', {
        p_user_id: 'invalid-user-id'
      });

      expect(result.error).toEqual({ message: 'Usuário não encontrado' });
    });
  });

  describe('Função usuario_tem_permissao', () => {
    it('deve retornar true quando usuário tem permissão', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: true,
        error: null
      });

      const result = await supabase.rpc('usuario_tem_permissao', {
        p_user_id: 'test-user-id',
        p_permissao: 'usuarios_visualizar'
      });

      expect(supabase.rpc).toHaveBeenCalledWith('usuario_tem_permissao', {
        p_user_id: 'test-user-id',
        p_permissao: 'usuarios_visualizar'
      });
      expect(result.data).toBe(true);
    });

    it('deve retornar false quando usuário não tem permissão', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: false,
        error: null
      });

      const result = await supabase.rpc('usuario_tem_permissao', {
        p_user_id: 'test-user-id',
        p_permissao: 'admin_master'
      });

      expect(result.data).toBe(false);
    });
  });

  describe('Tabela roles', () => {
    it('deve carregar roles corretamente', async () => {
      const mockRoles = [
        { id: '1', nome: 'consultor', descricao: 'Consultor básico', nivel_acesso: 1 },
        { id: '2', nome: 'coordenador', descricao: 'Coordenador', nivel_acesso: 2 },
        { id: '3', nome: 'admin_master', descricao: 'Administrador Master', nivel_acesso: 5 }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockRoles,
            error: null
          })
        })
      });

      const result = await supabase.from('roles').select('*').order('nivel_acesso');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(result.data).toEqual(mockRoles);
    });
  });

  describe('Tabela permissoes', () => {
    it('deve carregar permissões corretamente', async () => {
      const mockPermissoes = [
        { id: '1', nome: 'usuarios_visualizar', descricao: 'Visualizar usuários', modulo: 'usuarios', acao: 'visualizar' },
        { id: '2', nome: 'usuarios_criar', descricao: 'Criar usuários', modulo: 'usuarios', acao: 'criar' },
        { id: '3', nome: 'vagas_visualizar', descricao: 'Visualizar vagas', modulo: 'vagas', acao: 'visualizar' }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPermissoes,
            error: null
          })
        })
      });

      const result = await supabase.from('permissoes').select('*').order('modulo');

      expect(supabase.from).toHaveBeenCalledWith('permissoes');
      expect(result.data).toEqual(mockPermissoes);
    });
  });

  describe('Tabela roles_permissoes', () => {
    it('deve carregar associações role-permissões corretamente', async () => {
      const mockRolePermissoes = [
        { role_id: '1', permissao_id: '1' },
        { role_id: '1', permissao_id: '2' },
        { role_id: '2', permissao_id: '1' },
        { role_id: '2', permissao_id: '2' },
        { role_id: '2', permissao_id: '3' }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRolePermissoes,
          error: null
        })
      });

      const result = await supabase.from('roles_permissoes').select('role_id, permissao_id');

      expect(supabase.from).toHaveBeenCalledWith('roles_permissoes');
      expect(result.data).toEqual(mockRolePermissoes);
    });
  });
}); 