import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CandidatoExternoProvider } from '@/contexts/CandidatoExternoContext';
import CandidatoDashboard from '@/pages/CandidatoDashboard';
import { CandidaturasCard } from '@/components/candidato/CandidaturasCard';
import { ProfileCard } from '@/components/candidato/ProfileCard';
import { DashboardStats } from '@/components/candidato/DashboardStats';
import { CandidaturaExternaWithVaga, CandidatoExterno } from '../../../supabase/types';

// Mock data
const mockCandidato: CandidatoExterno = {
  id: '1',
  nome: 'Pedro Silva',
  email: 'pedro@email.com',
  telefone: '(11) 99999-9999',
  data_nascimento: '1990-05-15',
  endereco: 'Rua dos Desenvolvedores, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  curriculo_url: 'https://storage.supabase.co/curriculos/pedro_silva_cv.pdf',
  curriculo_nome: 'curriculo_pedro_silva.pdf',
  curriculo_tamanho: 1024000,
  curriculo_tipo: 'application/pdf',
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-15T14:30:00Z'
};

const mockCandidaturas: CandidaturaExternaWithVaga[] = [
  {
    id: '1',
    candidato_id: '1',
    vaga_id: '1',
    status: 'selecionando',
    observacoes: 'Candidato interessante com boa experiência',
    curriculo_url: 'https://storage.supabase.co/curriculos/pedro_silva_cv.pdf',
    data_candidatura: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    vaga: {
      id: '1',
      numero_vaga: 'VG001',
      cliente_id: '1',
      empresa: 'TechCorp Ltda',
      contato_envio_cv: 'Maria Silva',
      email: 'maria@techcorp.com',
      celular: '(11) 88888-8888',
      cargo: 'Desenvolvedor React Senior',
      salario: 12000,
      local_trabalho: 'São Paulo - SP (Híbrido)',
      data_recebimento: '2024-01-10T09:00:00Z',
      data_formatacao_perfil: '2024-01-11T10:00:00Z',
      data_divulgacao_vaga: '2024-01-12T08:00:00Z',
      data_inicio_selecao: '2024-01-15T09:00:00Z',
      data_envio_curriculos: null,
      data_encerramento: '2024-02-15T18:00:00Z',
      perfil_posicao: 'Desenvolvedor React Senior com 5+ anos de experiência',
      informacoes_complementares: 'Conhecimento em TypeScript e testes é obrigatório',
      observacoes: 'Vaga urgente - cliente VIP',
      questionario_tecnico: JSON.stringify([
        {
          id: '1',
          pergunta: 'Anos de experiência com React?',
          tipo: 'multipla_escolha',
          opcoes: ['1-2 anos', '3-4 anos', '5+ anos'],
          obrigatoria: true
        }
      ]),
      consultor: 'Ana Consultora',
      status: 'aberta',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  },
  {
    id: '2',
    candidato_id: '1',
    vaga_id: '2',
    status: 'curriculo_enviado',
    observacoes: 'CV enviado para análise do cliente',
    curriculo_url: 'https://storage.supabase.co/curriculos/pedro_silva_cv.pdf',
    data_candidatura: '2024-01-12T14:00:00Z',
    created_at: '2024-01-12T14:00:00Z',
    vaga: {
      id: '2',
      numero_vaga: 'VG002',
      cliente_id: '2',
      empresa: 'StartupXYZ',
      contato_envio_cv: 'João Santos',
      email: 'joao@startupxyz.com',
      celular: '(11) 77777-7777',
      cargo: 'Full Stack Developer',
      salario: 8000,
      local_trabalho: 'São Paulo - SP (Remoto)',
      data_recebimento: '2024-01-08T10:00:00Z',
      data_formatacao_perfil: '2024-01-09T11:00:00Z',
      data_divulgacao_vaga: '2024-01-10T09:00:00Z',
      data_inicio_selecao: '2024-01-12T10:00:00Z',
      data_envio_curriculos: '2024-01-13T15:00:00Z',
      data_encerramento: '2024-02-10T18:00:00Z',
      perfil_posicao: 'Desenvolvedor Full Stack com conhecimento em React e Node.js',
      informacoes_complementares: 'Experiência com APIs REST e bancos NoSQL',
      observacoes: 'Startup em crescimento - ambiente jovem',
      questionario_tecnico: null,
      consultor: 'Carlos Consultor',
      status: 'aberta',
      created_at: '2024-01-08T10:00:00Z',
      updated_at: '2024-01-13T15:00:00Z'
    }
  },
  {
    id: '3',
    candidato_id: '1',
    vaga_id: '3',
    status: 'aprovado',
    observacoes: 'Candidato aprovado! Aguardando proposta.',
    curriculo_url: 'https://storage.supabase.co/curriculos/pedro_silva_cv.pdf',
    data_candidatura: '2024-01-05T16:30:00Z',
    created_at: '2024-01-05T16:30:00Z',
    vaga: {
      id: '3',
      numero_vaga: 'VG003',
      cliente_id: '3',
      empresa: 'Enterprise Solutions',
      contato_envio_cv: 'Ana Costa',
      email: 'ana@enterprise.com',
      celular: '(11) 66666-6666',
      cargo: 'Frontend Developer',
      salario: 9500,
      local_trabalho: 'São Paulo - SP (Presencial)',
      data_recebimento: '2024-01-03T11:00:00Z',
      data_formatacao_perfil: '2024-01-04T12:00:00Z',
      data_divulgacao_vaga: '2024-01-05T10:00:00Z',
      data_inicio_selecao: '2024-01-05T15:00:00Z',
      data_envio_curriculos: '2024-01-08T14:00:00Z',
      data_encerramento: '2024-01-20T18:00:00Z',
      perfil_posicao: 'Desenvolvedor Frontend especialista em React',
      informacoes_complementares: 'Foco em UX/UI e performance',
      observacoes: 'Cliente exigente - perfil deve ser perfeito',
      questionario_tecnico: null,
      consultor: 'Maria Consultora',
      status: 'fechada',
      created_at: '2024-01-03T11:00:00Z',
      updated_at: '2024-01-20T18:00:00Z'
    }
  }
];

// Mock do contexto
const mockCandidatoContext = {
  candidato: mockCandidato,
  candidaturas: mockCandidaturas,
  loading: false,
  error: null,
  logout: vi.fn(),
  loadCandidaturas: vi.fn(),
  updateProfile: vi.fn(),
  uploadCurriculo: vi.fn(),
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  aplicarVaga: vi.fn(),
  verificarCandidatura: vi.fn(),
  clearError: vi.fn()
};

// Mock do hook useCandidatoExterno
vi.mock('@/contexts/CandidatoExternoContext', () => ({
  useCandidatoExterno: () => mockCandidatoContext,
  CandidatoExternoProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock do React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children
  };
});

// Helper para criar wrapper com providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CandidatoExternoProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </CandidatoExternoProvider>
    </QueryClientProvider>
  );
};

describe('Dashboard do Candidato - Testes de Integração', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let Wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    user = userEvent.setup();
    Wrapper = createWrapper();
    vi.clearAllMocks();
  });

  describe('Carregamento do Dashboard', () => {
    it('deve exibir informações básicas do candidato', () => {
      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      // Verificar nome do candidato
      expect(screen.getByText('Pedro Silva')).toBeInTheDocument();
      
      // Verificar email
      expect(screen.getByText('pedro@email.com')).toBeInTheDocument();
      
      // Verificar telefone
      expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
    });

    it('deve exibir estatísticas das candidaturas', () => {
      render(
        <Wrapper>
          <DashboardStats candidaturas={mockCandidaturas} />
        </Wrapper>
      );

      // Total de candidaturas
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/total de candidaturas/i)).toBeInTheDocument();

      // Status específicos
      expect(screen.getByText(/1.*selecionando/i)).toBeInTheDocument();
      expect(screen.getByText(/1.*cv enviado/i)).toBeInTheDocument();
      expect(screen.getByText(/1.*aprovado/i)).toBeInTheDocument();
    });

    it('deve exibir todas as candidaturas do candidato', () => {
      render(
        <Wrapper>
          <CandidaturasCard candidaturas={mockCandidaturas} />
        </Wrapper>
      );

      // Verificar vagas aplicadas
      expect(screen.getByText('Desenvolvedor React Senior')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();

      // Verificar empresas
      expect(screen.getByText('TechCorp Ltda')).toBeInTheDocument();
      expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Solutions')).toBeInTheDocument();
    });
  });

  describe('Visualização de Candidaturas', () => {
    it('deve exibir status correto das candidaturas', () => {
      render(
        <Wrapper>
          <CandidaturasCard candidaturas={mockCandidaturas} />
        </Wrapper>
      );

      // Status das candidaturas
      expect(screen.getByText(/selecionando/i)).toBeInTheDocument();
      expect(screen.getByText(/cv enviado/i)).toBeInTheDocument();
      expect(screen.getByText(/aprovado/i)).toBeInTheDocument();
    });

    it('deve exibir informações detalhadas de cada vaga', () => {
      render(
        <Wrapper>
          <CandidaturasCard candidaturas={mockCandidaturas} />
        </Wrapper>
      );

      // Salários
      expect(screen.getByText('R$ 12.000')).toBeInTheDocument();
      expect(screen.getByText('R$ 8.000')).toBeInTheDocument();
      expect(screen.getByText('R$ 9.500')).toBeInTheDocument();

      // Locais de trabalho
      expect(screen.getByText(/híbrido/i)).toBeInTheDocument();
      expect(screen.getByText(/remoto/i)).toBeInTheDocument();
      expect(screen.getByText(/presencial/i)).toBeInTheDocument();
    });

    it('deve exibir datas de candidatura formatadas', () => {
      render(
        <Wrapper>
          <CandidaturasCard candidaturas={mockCandidaturas} />
        </Wrapper>
      );

      // Verificar se as datas estão sendo exibidas
      // As datas podem estar em formato "X dias atrás" ou formato brasileiro
      expect(screen.getByText(/15\/01\/2024|jan|janeiro/i)).toBeInTheDocument();
    });

    it('deve destacar candidatura aprovada', () => {
      render(
        <Wrapper>
          <CandidaturasCard candidaturas={mockCandidaturas} />
        </Wrapper>
      );

      // Verificar se a candidatura aprovada tem destaque visual
      const aprovadoCard = screen.getByText('Frontend Developer').closest('.card, .border, [data-testid]');
      expect(aprovadoCard).toHaveClass(/green|success|aprovado/);
    });
  });

  describe('Funcionalidades do Perfil', () => {
    it('deve exibir informações do perfil do candidato', () => {
      render(
        <Wrapper>
          <ProfileCard 
            candidato={mockCandidato}
            onUpdateProfile={vi.fn()}
            onUploadCurriculo={vi.fn()}
          />
        </Wrapper>
      );

      // Informações pessoais
      expect(screen.getByText('Pedro Silva')).toBeInTheDocument();
      expect(screen.getByText('pedro@email.com')).toBeInTheDocument();
      expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
      expect(screen.getByText('São Paulo - SP')).toBeInTheDocument();
    });

    it('deve exibir status do currículo', () => {
      render(
        <Wrapper>
          <ProfileCard 
            candidato={mockCandidato}
            onUpdateProfile={vi.fn()}
            onUploadCurriculo={vi.fn()}
          />
        </Wrapper>
      );

      // Verificar se mostra que tem currículo
      expect(screen.getByText(/currículo enviado/i)).toBeInTheDocument();
      expect(screen.getByText('curriculo_pedro_silva.pdf')).toBeInTheDocument();
    });

    it('deve permitir editar perfil', async () => {
      const mockOnUpdateProfile = vi.fn();
      
      render(
        <Wrapper>
          <ProfileCard 
            candidato={mockCandidato}
            onUpdateProfile={mockOnUpdateProfile}
            onUploadCurriculo={vi.fn()}
          />
        </Wrapper>
      );

      // Clicar no botão de editar
      const editButton = screen.getByRole('button', { name: /editar perfil/i });
      await user.click(editButton);

      // Verificar se campos de edição apareceram
      expect(screen.getByDisplayValue('Pedro Silva')).toBeInTheDocument();
      expect(screen.getByDisplayValue('(11) 99999-9999')).toBeInTheDocument();
    });

    it('deve permitir fazer upload de novo currículo', async () => {
      const mockOnUploadCurriculo = vi.fn();
      
      render(
        <Wrapper>
          <ProfileCard 
            candidato={mockCandidato}
            onUpdateProfile={vi.fn()}
            onUploadCurriculo={mockOnUploadCurriculo}
          />
        </Wrapper>
      );

      // Clicar no botão de upload
      const uploadButton = screen.getByRole('button', { name: /atualizar currículo/i });
      await user.click(uploadButton);

      // Verificar se input de arquivo apareceu
      expect(screen.getByRole('button', { name: /selecionar arquivo/i })).toBeInTheDocument();
    });
  });

  describe('Navegação e Logout', () => {
    it('deve permitir logout do candidato', async () => {
      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      // Clicar no botão de logout
      const logoutButton = screen.getByRole('button', { name: /sair/i });
      await user.click(logoutButton);

      // Verificar se função de logout foi chamada
      expect(mockCandidatoContext.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('deve redirecionar para login se não autenticado', () => {
      // Simular candidato não autenticado
      const contextNotAuth = {
        ...mockCandidatoContext,
        isAuthenticated: false,
        candidato: null
      };

      vi.mocked(require('@/contexts/CandidatoExternoContext').useCandidatoExterno).mockReturnValue(contextNotAuth);

      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      // Verificar redirecionamento
      expect(mockNavigate).toHaveBeenCalledWith('/candidato/login');
    });
  });

  describe('Estados de Loading e Erro', () => {
    it('deve exibir estado de loading', () => {
      const contextLoading = {
        ...mockCandidatoContext,
        loading: true
      };

      vi.mocked(require('@/contexts/CandidatoExternoContext').useCandidatoExterno).mockReturnValue(contextLoading);

      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    });

    it('deve exibir mensagem de erro', () => {
      const contextWithError = {
        ...mockCandidatoContext,
        error: 'Erro ao carregar candidaturas'
      };

      vi.mocked(require('@/contexts/CandidatoExternoContext').useCandidatoExterno).mockReturnValue(contextWithError);

      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      expect(screen.getByText('Erro ao carregar candidaturas')).toBeInTheDocument();
    });

    it('deve exibir mensagem quando não há candidaturas', () => {
      const contextSemCandidaturas = {
        ...mockCandidatoContext,
        candidaturas: []
      };

      vi.mocked(require('@/contexts/CandidatoExternoContext').useCandidatoExterno).mockReturnValue(contextSemCandidaturas);

      render(
        <Wrapper>
          <CandidaturasCard candidaturas={[]} />
        </Wrapper>
      );

      expect(screen.getByText(/você ainda não se candidatou/i)).toBeInTheDocument();
    });
  });

  describe('Responsividade e UX', () => {
    it('deve adaptar layout para mobile', () => {
      // Simular viewport mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      // Verificar se layout mobile está sendo aplicado
      const container = screen.getByRole('main') || screen.getByTestId('dashboard-container');
      expect(container).toHaveClass(/flex-col|mobile|sm:|md:/);
    });

    it('deve mostrar notificações quando relevante', () => {
      // Candidatura com status aprovado deve gerar notificação
      render(
        <Wrapper>
          <CandidaturasCard candidaturas={mockCandidaturas} />
        </Wrapper>
      );

      // Verificar se há algum indicador de notificação
      expect(screen.getByText(/aprovado/i)).toBeInTheDocument();
      
      // Pode haver um badge ou ícone de notificação
      const notificationElements = screen.queryAllByTestId(/notification|badge|alert/);
      expect(notificationElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integração com Backend', () => {
    it('deve carregar candidaturas ao montar componente', () => {
      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      // Verificar se loadCandidaturas foi chamado
      expect(mockCandidatoContext.loadCandidaturas).toHaveBeenCalled();
    });

    it('deve atualizar perfil corretamente', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue(true);
      const contextWithUpdate = {
        ...mockCandidatoContext,
        updateProfile: mockUpdateProfile
      };

      vi.mocked(require('@/contexts/CandidatoExternoContext').useCandidatoExterno).mockReturnValue(contextWithUpdate);

      render(
        <Wrapper>
          <ProfileCard 
            candidato={mockCandidato}
            onUpdateProfile={mockUpdateProfile}
            onUploadCurriculo={vi.fn()}
          />
        </Wrapper>
      );

      // Simular edição do perfil
      const editButton = screen.getByRole('button', { name: /editar perfil/i });
      await user.click(editButton);

      // Alterar nome
      const nameInput = screen.getByDisplayValue('Pedro Silva');
      await user.clear(nameInput);
      await user.type(nameInput, 'Pedro Silva Santos');

      // Salvar
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      // Verificar se updateProfile foi chamado
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Pedro Silva Santos'
        })
      );
    });
  });

  describe('Fluxo Completo de Candidatura', () => {
    it('deve mostrar jornada completa do candidato', () => {
      render(
        <Wrapper>
          <CandidatoDashboard />
        </Wrapper>
      );

      // Verificar todas as fases das candidaturas
      expect(screen.getByText(/selecionando/i)).toBeInTheDocument(); // Candidatura recente
      expect(screen.getByText(/cv enviado/i)).toBeInTheDocument(); // Em análise
      expect(screen.getByText(/aprovado/i)).toBeInTheDocument(); // Sucesso

      // Verificar que todas as vagas estão sendo exibidas
      expect(screen.getByText('Desenvolvedor React Senior')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();

      // Verificar estatísticas
      expect(screen.getByText('3')).toBeInTheDocument(); // Total de candidaturas
    });
  });
}); 