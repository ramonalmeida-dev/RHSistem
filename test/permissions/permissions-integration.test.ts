import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

// Componente de teste para verificar permissões
const TestPermissions = () => {
  const { 
    podeVerUsuarios, 
    podeEditarClientes, 
    podeVerClientes,
    podeVerVagas,
    podeVerCandidatos,
    podeVerPosicoesFechadas,
    podeVerRelatoriosFinanceiros,
    isConsultor,
    isCoordenador
  } = usePermissions();

  return (
    <div>
      <div data-testid="pode-ver-usuarios">{podeVerUsuarios() ? 'sim' : 'nao'}</div>
      <div data-testid="pode-editar-clientes">{podeEditarClientes() ? 'sim' : 'nao'}</div>
      <div data-testid="pode-ver-clientes">{podeVerClientes() ? 'sim' : 'nao'}</div>
      <div data-testid="pode-ver-vagas">{podeVerVagas() ? 'sim' : 'nao'}</div>
      <div data-testid="pode-ver-candidatos">{podeVerCandidatos() ? 'sim' : 'nao'}</div>
      <div data-testid="pode-ver-posicoes-fechadas">{podeVerPosicoesFechadas() ? 'sim' : 'nao'}</div>
      <div data-testid="pode-ver-relatorios-financeiros">{podeVerRelatoriosFinanceiros() ? 'sim' : 'nao'}</div>
      <div data-testid="is-consultor">{isConsultor() ? 'sim' : 'nao'}</div>
      <div data-testid="is-coordenador">{isCoordenador() ? 'sim' : 'nao'}</div>
    </div>
  );
};

// Wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Validação de Permissões - Integração', () => {
  describe('Consultor', () => {
    beforeEach(() => {
      // Mock das permissões do consultor
      const mockPermissoesConsultor = [
        { permissao_nome: 'candidatos_criar', modulo: 'candidatos', acao: 'criar' },
        { permissao_nome: 'candidatos_editar', modulo: 'candidatos', acao: 'editar' },
        { permissao_nome: 'candidatos_visualizar', modulo: 'candidatos', acao: 'visualizar' },
        { permissao_nome: 'clientes_visualizar', modulo: 'clientes', acao: 'visualizar' },
        { permissao_nome: 'posicoes_fechadas_contratar', modulo: 'posicoes_fechadas', acao: 'contratar' },
        { permissao_nome: 'posicoes_fechadas_gerenciar', modulo: 'posicoes_fechadas', acao: 'gerenciar' },
        { permissao_nome: 'posicoes_fechadas_visualizar', modulo: 'posicoes_fechadas', acao: 'visualizar' },
        { permissao_nome: 'relatorios_visualizar', modulo: 'relatorios', acao: 'visualizar' },
        { permissao_nome: 'vagas_criar', modulo: 'vagas', acao: 'criar' },
        { permissao_nome: 'vagas_editar', modulo: 'vagas', acao: 'editar' },
        { permissao_nome: 'vagas_visualizar', modulo: 'vagas', acao: 'visualizar' },
      ];

      // Mock do Supabase
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockPermissoesConsultor,
        error: null,
      });
    });

    it('deve ter permissões corretas para consultor', () => {
      render(
        <TestWrapper>
          <TestPermissions />
        </TestWrapper>
      );

      // Consultor NÃO deve ter acesso a usuários
      expect(screen.getByTestId('pode-ver-usuarios')).toHaveTextContent('nao');
      
      // Consultor NÃO deve poder editar clientes
      expect(screen.getByTestId('pode-editar-clientes')).toHaveTextContent('nao');
      
      // Consultor deve poder visualizar clientes
      expect(screen.getByTestId('pode-ver-clientes')).toHaveTextContent('sim');
      
      // Consultor deve poder visualizar vagas
      expect(screen.getByTestId('pode-ver-vagas')).toHaveTextContent('sim');
      
      // Consultor deve poder visualizar candidatos
      expect(screen.getByTestId('pode-ver-candidatos')).toHaveTextContent('sim');
      
      // Consultor deve poder visualizar posições fechadas
      expect(screen.getByTestId('pode-ver-posicoes-fechadas')).toHaveTextContent('sim');
      
      // Consultor NÃO deve ter acesso a relatórios financeiros
      expect(screen.getByTestId('pode-ver-relatorios-financeiros')).toHaveTextContent('nao');
      
      // Deve ser identificado como consultor
      expect(screen.getByTestId('is-consultor')).toHaveTextContent('sim');
      expect(screen.getByTestId('is-coordenador')).toHaveTextContent('nao');
    });
  });

  describe('Coordenador', () => {
    beforeEach(() => {
      // Mock das permissões do coordenador
      const mockPermissoesCoordenador = [
        { permissao_nome: 'candidatos_criar', modulo: 'candidatos', acao: 'criar' },
        { permissao_nome: 'candidatos_editar', modulo: 'candidatos', acao: 'editar' },
        { permissao_nome: 'candidatos_gerenciar_todos', modulo: 'candidatos', acao: 'gerenciar_todos' },
        { permissao_nome: 'candidatos_visualizar', modulo: 'candidatos', acao: 'visualizar' },
        { permissao_nome: 'clientes_criar', modulo: 'clientes', acao: 'criar' },
        { permissao_nome: 'clientes_editar', modulo: 'clientes', acao: 'editar' },
        { permissao_nome: 'clientes_visualizar', modulo: 'clientes', acao: 'visualizar' },
        { permissao_nome: 'posicoes_fechadas_contratar', modulo: 'posicoes_fechadas', acao: 'contratar' },
        { permissao_nome: 'posicoes_fechadas_gerenciar', modulo: 'posicoes_fechadas', acao: 'gerenciar' },
        { permissao_nome: 'posicoes_fechadas_todas', modulo: 'posicoes_fechadas', acao: 'todas' },
        { permissao_nome: 'posicoes_fechadas_visualizar', modulo: 'posicoes_fechadas', acao: 'visualizar' },
        { permissao_nome: 'relatorios_financeiro', modulo: 'relatorios', acao: 'financeiro' },
        { permissao_nome: 'relatorios_visualizar', modulo: 'relatorios', acao: 'visualizar' },
        { permissao_nome: 'usuarios_criar', modulo: 'usuarios', acao: 'criar' },
        { permissao_nome: 'usuarios_editar', modulo: 'usuarios', acao: 'editar' },
        { permissao_nome: 'usuarios_visualizar', modulo: 'usuarios', acao: 'visualizar' },
        { permissao_nome: 'vagas_criar', modulo: 'vagas', acao: 'criar' },
        { permissao_nome: 'vagas_editar', modulo: 'vagas', acao: 'editar' },
        { permissao_nome: 'vagas_gerenciar_todas', modulo: 'vagas', acao: 'gerenciar_todas' },
        { permissao_nome: 'vagas_visualizar', modulo: 'vagas', acao: 'visualizar' },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockPermissoesCoordenador,
        error: null,
      });
    });

    it('deve ter permissões corretas para coordenador', () => {
      render(
        <TestWrapper>
          <TestPermissions />
        </TestWrapper>
      );

      // Coordenador deve ter acesso a usuários
      expect(screen.getByTestId('pode-ver-usuarios')).toHaveTextContent('sim');
      
      // Coordenador deve poder editar clientes
      expect(screen.getByTestId('pode-editar-clientes')).toHaveTextContent('sim');
      
      // Coordenador deve poder visualizar clientes
      expect(screen.getByTestId('pode-ver-clientes')).toHaveTextContent('sim');
      
      // Coordenador deve poder visualizar vagas
      expect(screen.getByTestId('pode-ver-vagas')).toHaveTextContent('sim');
      
      // Coordenador deve poder visualizar candidatos
      expect(screen.getByTestId('pode-ver-candidatos')).toHaveTextContent('sim');
      
      // Coordenador deve poder visualizar posições fechadas
      expect(screen.getByTestId('pode-ver-posicoes-fechadas')).toHaveTextContent('sim');
      
      // Coordenador deve ter acesso a relatórios financeiros
      expect(screen.getByTestId('pode-ver-relatorios-financeiros')).toHaveTextContent('sim');
      
      // Deve ser identificado como coordenador
      expect(screen.getByTestId('is-consultor')).toHaveTextContent('nao');
      expect(screen.getByTestId('is-coordenador')).toHaveTextContent('sim');
    });
  });
}); 