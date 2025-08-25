import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('PermissionGuard Component', () => {
  const mockUseAuth = vi.mocked(require('@/contexts/AuthContext').useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Verificação por Permissão', () => {
    it('deve renderizar children quando usuário tem permissão', () => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => permissao === 'usuarios_visualizar'),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard permissao="usuarios_visualizar">
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    });

    it('não deve renderizar children quando usuário não tem permissão', () => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => false),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard permissao="usuarios_visualizar">
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
    });

    it('deve renderizar fallback quando fornecido e usuário não tem permissão', () => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => false),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard 
          permissao="usuarios_visualizar"
          fallback={<div data-testid="fallback">Acesso Negado</div>}
        >
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    });
  });

  describe('Verificação por Role', () => {
    it('deve renderizar children quando usuário tem role', () => {
      mockUseAuth.mockReturnValue({
        temRole: vi.fn((role: string) => role === 'admin_master'),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard role="admin_master">
          <div data-testid="protected-content">Conteúdo Admin</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo Admin')).toBeInTheDocument();
    });

    it('não deve renderizar children quando usuário não tem role', () => {
      mockUseAuth.mockReturnValue({
        temRole: vi.fn((role: string) => false),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard role="admin_master">
          <div data-testid="protected-content">Conteúdo Admin</div>
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Verificação por Nível de Acesso', () => {
    it('deve renderizar children quando usuário tem nível suficiente', () => {
      mockUseAuth.mockReturnValue({
        temNivelAcesso: vi.fn((nivel: number) => nivel <= 3),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard nivelAcesso={2}>
          <div data-testid="protected-content">Conteúdo Nível 2</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo Nível 2')).toBeInTheDocument();
    });

    it('não deve renderizar children quando usuário não tem nível suficiente', () => {
      mockUseAuth.mockReturnValue({
        temNivelAcesso: vi.fn((nivel: number) => nivel <= 1),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard nivelAcesso={3}>
          <div data-testid="protected-content">Conteúdo Nível 3</div>
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Múltiplas Condições', () => {
    it('deve renderizar quando todas as condições são atendidas', () => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => permissao === 'usuarios_visualizar'),
        temRole: vi.fn((role: string) => role === 'admin_master'),
        temNivelAcesso: vi.fn((nivel: number) => nivel <= 5),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard 
          permissao="usuarios_visualizar"
          role="admin_master"
          nivelAcesso={3}
        >
          <div data-testid="protected-content">Conteúdo Completo</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('não deve renderizar quando uma condição não é atendida', () => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn((permissao: string) => permissao === 'usuarios_visualizar'),
        temRole: vi.fn((role: string) => false), // Role não atendida
        temNivelAcesso: vi.fn((nivel: number) => nivel <= 5),
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard 
          permissao="usuarios_visualizar"
          role="admin_master"
          nivelAcesso={3}
        >
          <div data-testid="protected-content">Conteúdo Completo</div>
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Usuário não autenticado', () => {
    it('não deve renderizar children quando usuário não está autenticado', () => {
      mockUseAuth.mockReturnValue({
        temPermissao: vi.fn(() => false),
        temRole: vi.fn(() => false),
        temNivelAcesso: vi.fn(() => false),
        usuario: null
      });

      render(
        <PermissionGuard permissao="usuarios_visualizar">
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Sem condições especificadas', () => {
    it('deve renderizar children quando nenhuma condição é especificada', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: '1', nome: 'Test User' }
      });

      render(
        <PermissionGuard>
          <div data-testid="protected-content">Conteúdo Livre</div>
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo Livre')).toBeInTheDocument();
    });
  });
}); 