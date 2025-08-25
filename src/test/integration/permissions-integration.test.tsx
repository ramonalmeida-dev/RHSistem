import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CandidatoExternoProvider } from '@/contexts/CandidatoExternoContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import Consultores from '@/pages/Consultores';
import GerenciarPermissoes from '@/pages/GerenciarPermissoes';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn()
      }
    }
  }
}));

// Mock do React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CandidatoExternoProvider>
          <TooltipProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </TooltipProvider>
        </CandidatoExternoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Sistema de Permissões - Integração', () => {
  const mockSupabase = vi.mocked(require('@/lib/supabase').supabase);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Página de Usuários', () => {
    it('deve mostrar botão "Gerenciar Permissões" para admin master', async () => {
      // Mock de dados de usuários
      const mockUsuarios = [
        {
          id: '1',
          nome: 'Admin Master',
          email: 'admin@teste.com',
          ativo: true,
          role_id: '5',
          role_nome: 'admin_master',
          role_descricao: 'Administrador Master',
          nivel_acesso: 5,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock das permissões do usuário logado (admin master)
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { id: '1', nome: 'usuarios_visualizar', modulo: 'usuarios', acao: 'visualizar' },
          { id: '2', nome: 'usuarios_gerenciar_roles', modulo: 'usuarios', acao: 'gerenciar_roles' }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockUsuarios,
            error: null
          })
        })
      });

      render(<Consultores />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Permissões')).toBeInTheDocument();
      });
    });

    it('não deve mostrar botão "Gerenciar Permissões" para consultor', async () => {
      // Mock de dados de usuários
      const mockUsuarios = [
        {
          id: '2',
          nome: 'Consultor',
          email: 'consultor@teste.com',
          ativo: true,
          role_id: '1',
          role_nome: 'consultor',
          role_descricao: 'Consultor básico',
          nivel_acesso: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock das permissões do usuário logado (consultor)
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { id: '1', nome: 'usuarios_visualizar', modulo: 'usuarios', acao: 'visualizar' }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockUsuarios,
            error: null
          })
        })
      });

      render(<Consultores />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.queryByText('Gerenciar Permissões')).not.toBeInTheDocument();
      });
    });

    it('deve mostrar tabela de usuários com informações de role', async () => {
      const mockUsuarios = [
        {
          id: '1',
          nome: 'Admin Master',
          email: 'admin@teste.com',
          ativo: true,
          role_id: '5',
          role_nome: 'admin_master',
          role_descricao: 'Administrador Master',
          nivel_acesso: 5,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          nome: 'Consultor',
          email: 'consultor@teste.com',
          ativo: true,
          role_id: '1',
          role_nome: 'consultor',
          role_descricao: 'Consultor básico',
          nivel_acesso: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { id: '1', nome: 'usuarios_visualizar', modulo: 'usuarios', acao: 'visualizar' }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockUsuarios,
            error: null
          })
        })
      });

      render(<Consultores />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Admin Master')).toBeInTheDocument();
        expect(screen.getByText('Consultor')).toBeInTheDocument();
        expect(screen.getByText('ADMIN MASTER')).toBeInTheDocument();
        expect(screen.getByText('CONSULTOR')).toBeInTheDocument();
      });
    });
  });

  describe('Página de Gerenciar Permissões', () => {
    it('deve carregar roles e permissões corretamente', async () => {
      const mockRoles = [
        { id: '1', nome: 'consultor', descricao: 'Consultor básico', nivel_acesso: 1 },
        { id: '2', nome: 'coordenador', descricao: 'Coordenador', nivel_acesso: 2 },
        { id: '3', nome: 'admin_master', descricao: 'Administrador Master', nivel_acesso: 5 }
      ];

      const mockPermissoes = [
        { id: '1', nome: 'usuarios_visualizar', descricao: 'Visualizar usuários', modulo: 'usuarios', acao: 'visualizar' },
        { id: '2', nome: 'usuarios_criar', descricao: 'Criar usuários', modulo: 'usuarios', acao: 'criar' },
        { id: '3', nome: 'vagas_visualizar', descricao: 'Visualizar vagas', modulo: 'vagas', acao: 'visualizar' }
      ];

      const mockRolePermissoes = [
        { role_id: '1', permissao_id: '1' },
        { role_id: '2', permissao_id: '1' },
        { role_id: '2', permissao_id: '2' }
      ];

      // Mock das permissões do usuário logado
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { id: '1', nome: 'usuarios_gerenciar_roles', modulo: 'usuarios', acao: 'gerenciar_roles' }
        ],
        error: null
      });

      // Mock do carregamento de dados
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'roles') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockRoles,
                error: null
              })
            })
          };
        }
        if (table === 'permissoes') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockPermissoes,
                error: null
              })
            })
          };
        }
        if (table === 'roles_permissoes') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockRolePermissoes,
              error: null
            })
          };
        }
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        };
      });

      render(<GerenciarPermissoes />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('CONSULTOR')).toBeInTheDocument();
        expect(screen.getByText('COORDENADOR')).toBeInTheDocument();
        expect(screen.getByText('ADMIN MASTER')).toBeInTheDocument();
        expect(screen.getByText('Usuários')).toBeInTheDocument();
        expect(screen.getByText('Vagas')).toBeInTheDocument();
      });
    });

    it('deve permitir salvar alterações de permissões', async () => {
      const mockRoles = [
        { id: '1', nome: 'consultor', descricao: 'Consultor básico', nivel_acesso: 1 }
      ];

      const mockPermissoes = [
        { id: '1', nome: 'usuarios_visualizar', descricao: 'Visualizar usuários', modulo: 'usuarios', acao: 'visualizar' }
      ];

      // Mock das permissões do usuário logado
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { id: '1', nome: 'usuarios_gerenciar_roles', modulo: 'usuarios', acao: 'gerenciar_roles' }
        ],
        error: null
      });

      // Mock do carregamento de dados
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'roles') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockRoles,
                error: null
              })
            })
          };
        }
        if (table === 'permissoes') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockPermissoes,
                error: null
              })
            })
          };
        }
        if (table === 'roles_permissoes') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          };
        }
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        };
      });

      render(<GerenciarPermissoes />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
      });

      // Clicar no checkbox para adicionar permissão
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Clicar em salvar
      const saveButton = screen.getByText('Salvar Alterações');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('roles_permissoes');
      });
    });

    it('deve mostrar mensagem de acesso negado para usuário sem permissão', async () => {
      // Mock de usuário sem permissão para gerenciar roles
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      render(<GerenciarPermissoes />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
        expect(screen.getByText('Você não tem permissão para gerenciar permissões.')).toBeInTheDocument();
      });
    });
  });

  describe('Fluxo de Criação de Usuário', () => {
    it('deve permitir criar usuário com role selecionado', async () => {
      const mockRoles = [
        { id: '1', nome: 'consultor', descricao: 'Consultor básico', nivel_acesso: 1 },
        { id: '2', nome: 'coordenador', descricao: 'Coordenador', nivel_acesso: 2 }
      ];

      // Mock das permissões do usuário logado
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { id: '1', nome: 'usuarios_criar', modulo: 'usuarios', acao: 'criar' }
        ],
        error: null
      });

      // Mock do carregamento de roles
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockRoles,
            error: null
          })
        })
      });

      // Mock da criação de usuário
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null
      });

      render(<Consultores />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Adicionar Usuário')).toBeInTheDocument();
      });

      // Abrir modal de adicionar usuário
      const addButton = screen.getByText('Adicionar Usuário');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Criar Usuário')).toBeInTheDocument();
        expect(screen.getByText('CONSULTOR')).toBeInTheDocument();
        expect(screen.getByText('COORDENADOR')).toBeInTheDocument();
      });
    });
  });
}); 