import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('usePermissions Hook', () => {
  const mockUseAuth = vi.mocked(require('@/contexts/AuthContext').useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Usuário Admin Master', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => true),
        temRole: vi.fn((role: string) => role === 'admin_master'),
        temNivelAcesso: vi.fn((nivel: number) => nivel <= 5),
        usuario: {
          id: '1',
          nome: 'Admin Master',
          email: 'admin@teste.com',
          role_id: '5',
          role_nome: 'admin_master',
          nivel_acesso: 5,
          ativo: true
        },
        permissoes: [
          { id: '1', nome: 'usuarios_visualizar', modulo: 'usuarios', acao: 'visualizar' },
          { id: '2', nome: 'usuarios_criar', modulo: 'usuarios', acao: 'criar' },
          { id: '3', nome: 'usuarios_editar', modulo: 'usuarios', acao: 'editar' },
          { id: '4', nome: 'usuarios_excluir', modulo: 'usuarios', acao: 'excluir' },
          { id: '5', nome: 'usuarios_gerenciar_roles', modulo: 'usuarios', acao: 'gerenciar_roles' }
        ]
      });
    });

    it('deve ter todas as permissões de usuários', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.podeVerUsuarios()).toBe(true);
      expect(result.current.podeCriarUsuarios()).toBe(true);
      expect(result.current.podeEditarUsuarios()).toBe(true);
      expect(result.current.podeExcluirUsuarios()).toBe(true);
      expect(result.current.podeGerenciarRoles()).toBe(true);
    });

    it('deve ter role admin_master', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdminMaster()).toBe(true);
      expect(result.current.temNivelAdminMaster()).toBe(true);
    });

    it('deve ter acesso a todos os níveis', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.temNivelConsultor()).toBe(true);
      expect(result.current.temNivelCoordenador()).toBe(true);
      expect(result.current.temNivelDiretoria()).toBe(true);
      expect(result.current.temNivelAdmin1()).toBe(true);
      expect(result.current.temNivelAdminMaster()).toBe(true);
    });
  });

  describe('Usuário Consultor', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => {
          // Consultor tem apenas permissões básicas
          const permissoesBasicas = [
            'vagas_visualizar',
            'candidatos_visualizar',
            'clientes_visualizar',
            'posicoes_fechadas_visualizar'
          ];
          return permissoesBasicas.includes(permissao);
        }),
        temRole: vi.fn((role: string) => role === 'consultor'),
        temNivelAcesso: vi.fn((nivel: number) => nivel <= 1),
        usuario: {
          id: '2',
          nome: 'Consultor',
          email: 'consultor@teste.com',
          role_id: '1',
          role_nome: 'consultor',
          nivel_acesso: 1,
          ativo: true
        },
        permissoes: [
          { id: '1', nome: 'vagas_visualizar', modulo: 'vagas', acao: 'visualizar' },
          { id: '2', nome: 'candidatos_visualizar', modulo: 'candidatos', acao: 'visualizar' },
          { id: '3', nome: 'clientes_visualizar', modulo: 'clientes', acao: 'visualizar' },
          { id: '4', nome: 'posicoes_fechadas_visualizar', modulo: 'posicoes_fechadas', acao: 'visualizar' }
        ]
      });
    });

    it('deve ter apenas permissões básicas', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.podeVerVagas()).toBe(true);
      expect(result.current.podeVerCandidatos()).toBe(true);
      expect(result.current.podeVerClientes()).toBe(true);
      expect(result.current.podeVerPosicoesFechadas()).toBe(true);
      
      // Não deve ter permissões administrativas
      expect(result.current.podeVerUsuarios()).toBe(false);
      expect(result.current.podeCriarUsuarios()).toBe(false);
      expect(result.current.podeEditarUsuarios()).toBe(false);
      expect(result.current.podeExcluirUsuarios()).toBe(false);
      expect(result.current.podeGerenciarRoles()).toBe(false);
    });

    it('deve ter role consultor', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isConsultor()).toBe(true);
      expect(result.current.temNivelConsultor()).toBe(true);
    });

    it('não deve ter acesso a níveis superiores', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.temNivelConsultor()).toBe(true);
      expect(result.current.temNivelCoordenador()).toBe(false);
      expect(result.current.temNivelDiretoria()).toBe(false);
      expect(result.current.temNivelAdmin1()).toBe(false);
      expect(result.current.temNivelAdminMaster()).toBe(false);
    });
  });

  describe('Usuário Coordenador', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => {
          // Coordenador tem permissões intermediárias
          const permissoesCoordenador = [
            'vagas_visualizar', 'vagas_criar', 'vagas_editar',
            'candidatos_visualizar', 'candidatos_criar', 'candidatos_editar',
            'clientes_visualizar', 'clientes_criar', 'clientes_editar',
            'posicoes_fechadas_visualizar', 'posicoes_fechadas_gerenciar',
            'relatorios_visualizar'
          ];
          return permissoesCoordenador.includes(permissao);
        }),
        temRole: vi.fn((role: string) => role === 'coordenador'),
        temNivelAcesso: vi.fn((nivel: number) => nivel <= 2),
        usuario: {
          id: '3',
          nome: 'Coordenador',
          email: 'coordenador@teste.com',
          role_id: '2',
          role_nome: 'coordenador',
          nivel_acesso: 2,
          ativo: true
        },
        permissoes: [
          { id: '1', nome: 'vagas_visualizar', modulo: 'vagas', acao: 'visualizar' },
          { id: '2', nome: 'vagas_criar', modulo: 'vagas', acao: 'criar' },
          { id: '3', nome: 'vagas_editar', modulo: 'vagas', acao: 'editar' },
          { id: '4', nome: 'candidatos_visualizar', modulo: 'candidatos', acao: 'visualizar' },
          { id: '5', nome: 'candidatos_criar', modulo: 'candidatos', acao: 'criar' },
          { id: '6', nome: 'candidatos_editar', modulo: 'candidatos', acao: 'editar' },
          { id: '7', nome: 'clientes_visualizar', modulo: 'clientes', acao: 'visualizar' },
          { id: '8', nome: 'clientes_criar', modulo: 'clientes', acao: 'criar' },
          { id: '9', nome: 'clientes_editar', modulo: 'clientes', acao: 'editar' },
          { id: '10', nome: 'posicoes_fechadas_visualizar', modulo: 'posicoes_fechadas', acao: 'visualizar' },
          { id: '11', nome: 'posicoes_fechadas_gerenciar', modulo: 'posicoes_fechadas', acao: 'gerenciar' },
          { id: '12', nome: 'relatorios_visualizar', modulo: 'relatorios', acao: 'visualizar' }
        ]
      });
    });

    it('deve ter permissões intermediárias', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.podeVerVagas()).toBe(true);
      expect(result.current.podeCriarVagas()).toBe(true);
      expect(result.current.podeEditarVagas()).toBe(true);
      expect(result.current.podeVerCandidatos()).toBe(true);
      expect(result.current.podeCriarCandidatos()).toBe(true);
      expect(result.current.podeEditarCandidatos()).toBe(true);
      expect(result.current.podeVerClientes()).toBe(true);
      expect(result.current.podeCriarClientes()).toBe(true);
      expect(result.current.podeEditarClientes()).toBe(true);
      expect(result.current.podeVerPosicoesFechadas()).toBe(true);
      expect(result.current.podeGerenciarPosicoesFechadas()).toBe(true);
      expect(result.current.podeVerRelatorios()).toBe(true);
      
      // Não deve ter permissões de exclusão ou administrativas
      expect(result.current.podeExcluirVagas()).toBe(false);
      expect(result.current.podeExcluirCandidatos()).toBe(false);
      expect(result.current.podeExcluirClientes()).toBe(false);
      expect(result.current.podeVerUsuarios()).toBe(false);
      expect(result.current.podeGerenciarRoles()).toBe(false);
    });

    it('deve ter role coordenador', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isCoordenador()).toBe(true);
      expect(result.current.temNivelCoordenador()).toBe(true);
    });
  });

  describe('Usuário sem permissões', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn(() => false),
        temRole: vi.fn(() => false),
        temNivelAcesso: vi.fn(() => false),
        usuario: null,
        permissoes: []
      });
    });

    it('não deve ter nenhuma permissão', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.podeVerVagas()).toBe(false);
      expect(result.current.podeCriarVagas()).toBe(false);
      expect(result.current.podeEditarVagas()).toBe(false);
      expect(result.current.podeExcluirVagas()).toBe(false);
      expect(result.current.podeVerUsuarios()).toBe(false);
      expect(result.current.podeCriarUsuarios()).toBe(false);
      expect(result.current.podeEditarUsuarios()).toBe(false);
      expect(result.current.podeExcluirUsuarios()).toBe(false);
      expect(result.current.podeGerenciarRoles()).toBe(false);
    });

    it('não deve ter nenhum role', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isConsultor()).toBe(false);
      expect(result.current.isCoordenador()).toBe(false);
      expect(result.current.isDiretoria()).toBe(false);
      expect(result.current.isAdminNivel1()).toBe(false);
      expect(result.current.isAdminMaster()).toBe(false);
    });
  });
}); 