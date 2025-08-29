import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Componente de teste para simular páginas
const TestPage = ({ name }: { name: string }) => <div>Página {name}</div>;

// Wrapper para testes de rota
const RouteTestWrapper = ({ 
  children, 
  mockUsuario, 
  mockPermissoes = [] 
}: { 
  children: React.ReactNode; 
  mockUsuario: any; 
  mockPermissoes?: any[]; 
}) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {children}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Proteção de Rotas', () => {
  describe('Rotas que requerem autenticação', () => {
    it('deve redirecionar para login quando não autenticado', () => {
      // Mock sem usuário autenticado
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <RouteTestWrapper mockUsuario={null}>
          <Route 
            path="/test" 
            element={
              <ProtectedRoute>
                <TestPage name="Protegida" />
              </ProtectedRoute>
            } 
          />
        </RouteTestWrapper>
      );

      // Deve redirecionar para login
      expect(window.location.pathname).toBe('/login');
    });

    it('deve permitir acesso quando autenticado', () => {
      const mockUsuario = {
        id: 'test-1',
        email: 'test@test.com',
        nome: 'Teste',
        role_id: 'role-test',
        role_nome: 'consultor',
        role_descricao: 'Teste',
        nivel_acesso: 1,
        ativo: true,
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'test-1',
              email: 'test@test.com',
              user_metadata: { nome: 'Teste' }
            } 
          } 
        },
        error: null,
      });

      render(
        <RouteTestWrapper mockUsuario={mockUsuario}>
          <Route 
            path="/test" 
            element={
              <ProtectedRoute>
                <TestPage name="Protegida" />
              </ProtectedRoute>
            } 
          />
        </RouteTestWrapper>
      );

      expect(screen.getByText('Página Protegida')).toBeInTheDocument();
    });
  });

  describe('Rotas específicas por perfil', () => {
    describe('Consultor', () => {
      const mockConsultor = {
        id: 'consultor-1',
        email: 'consultor@test.com',
        nome: 'Consultor Teste',
        role_id: 'role-consultor',
        role_nome: 'consultor',
        role_descricao: 'Consultor',
        nivel_acesso: 1,
        ativo: true,
      };

      const mockPermissoesConsultor = [
        { permissao_nome: 'candidatos_visualizar', modulo: 'candidatos', acao: 'visualizar' },
        { permissao_nome: 'clientes_visualizar', modulo: 'clientes', acao: 'visualizar' },
        { permissao_nome: 'vagas_visualizar', modulo: 'vagas', acao: 'visualizar' },
        { permissao_nome: 'posicoes_fechadas_visualizar', modulo: 'posicoes_fechadas', acao: 'visualizar' },
      ];

      beforeEach(() => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: mockPermissoesConsultor,
          error: null,
        });
      });

      it('deve ter acesso a /curriculos (candidatos)', () => {
        render(
          <RouteTestWrapper mockUsuario={mockConsultor} mockPermissoes={mockPermissoesConsultor}>
            <Route 
              path="/curriculos" 
              element={
                <ProtectedRoute>
                  <TestPage name="Currículos" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        expect(screen.getByText('Página Currículos')).toBeInTheDocument();
      });

      it('deve ter acesso a /clientes', () => {
        render(
          <RouteTestWrapper mockUsuario={mockConsultor} mockPermissoes={mockPermissoesConsultor}>
            <Route 
              path="/clientes" 
              element={
                <ProtectedRoute>
                  <TestPage name="Clientes" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        expect(screen.getByText('Página Clientes')).toBeInTheDocument();
      });

      it('deve ter acesso a /vagas', () => {
        render(
          <RouteTestWrapper mockUsuario={mockConsultor} mockPermissoes={mockPermissoesConsultor}>
            <Route 
              path="/vagas" 
              element={
                <ProtectedRoute>
                  <TestPage name="Vagas" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        expect(screen.getByText('Página Vagas')).toBeInTheDocument();
      });

      it('deve ter acesso a /relatorios/posicoes-fechadas', () => {
        render(
          <RouteTestWrapper mockUsuario={mockConsultor} mockPermissoes={mockPermissoesConsultor}>
            <Route 
              path="/relatorios/posicoes-fechadas" 
              element={
                <ProtectedRoute>
                  <TestPage name="Posições Fechadas" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        expect(screen.getByText('Página Posições Fechadas')).toBeInTheDocument();
      });

      it('NÃO deve ter acesso a /consultores (usuários)', () => {
        render(
          <RouteTestWrapper mockUsuario={mockConsultor} mockPermissoes={mockPermissoesConsultor}>
            <Route 
              path="/consultores" 
              element={
                <ProtectedRoute>
                  <TestPage name="Usuários" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        // Deve mostrar página de acesso negado ou redirecionar
        expect(screen.queryByText('Página Usuários')).not.toBeInTheDocument();
      });

      it('NÃO deve ter acesso a /relatorios/financeiro', () => {
        render(
          <RouteTestWrapper mockUsuario={mockConsultor} mockPermissoes={mockPermissoesConsultor}>
            <Route 
              path="/relatorios/financeiro" 
              element={
                <ProtectedRoute>
                  <TestPage name="Financeiro" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        expect(screen.queryByText('Página Financeiro')).not.toBeInTheDocument();
      });
    });

    describe('Coordenador', () => {
      const mockCoordenador = {
        id: 'coordenador-1',
        email: 'coordenador@test.com',
        nome: 'Coordenador Teste',
        role_id: 'role-coordenador',
        role_nome: 'coordenador',
        role_descricao: 'Coordenador',
        nivel_acesso: 2,
        ativo: true,
      };

      const mockPermissoesCoordenador = [
        { permissao_nome: 'candidatos_visualizar', modulo: 'candidatos', acao: 'visualizar' },
        { permissao_nome: 'clientes_visualizar', modulo: 'clientes', acao: 'visualizar' },
        { permissao_nome: 'clientes_editar', modulo: 'clientes', acao: 'editar' },
        { permissao_nome: 'vagas_visualizar', modulo: 'vagas', acao: 'visualizar' },
        { permissao_nome: 'usuarios_visualizar', modulo: 'usuarios', acao: 'visualizar' },
        { permissao_nome: 'posicoes_fechadas_visualizar', modulo: 'posicoes_fechadas', acao: 'visualizar' },
        { permissao_nome: 'relatorios_financeiro', modulo: 'relatorios', acao: 'financeiro' },
      ];

      beforeEach(() => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: mockPermissoesCoordenador,
          error: null,
        });
      });

      it('deve ter acesso a /consultores (usuários)', () => {
        render(
          <RouteTestWrapper mockUsuario={mockCoordenador} mockPermissoes={mockPermissoesCoordenador}>
            <Route 
              path="/consultores" 
              element={
                <ProtectedRoute>
                  <TestPage name="Usuários" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        expect(screen.getByText('Página Usuários')).toBeInTheDocument();
      });

      it('deve ter acesso a /relatorios/financeiro', () => {
        render(
          <RouteTestWrapper mockUsuario={mockCoordenador} mockPermissoes={mockPermissoesCoordenador}>
            <Route 
              path="/relatorios/financeiro" 
              element={
                <ProtectedRoute>
                  <TestPage name="Financeiro" />
                </ProtectedRoute>
              } 
            />
          </RouteTestWrapper>
        );

        expect(screen.getByText('Página Financeiro')).toBeInTheDocument();
      });
    });
  });
}); 