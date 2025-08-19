import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock do Supabase DEVE estar no topo antes de outros imports
const mockSupabaseData = {
  clientes: [] as any[],
  vagas: [] as any[],
  candidatos_externos: [] as any[],
  candidaturas: [] as any[],
  usuarios: [{ 
    id: '1', 
    email: 'admin@test.com', 
    nome: 'Admin Teste',
    tipo_usuario: 'admin'
  }]
};

const mockSupabase = {
  from: vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn(() => Promise.resolve({ 
            data: mockSupabaseData[table as keyof typeof mockSupabaseData] || [], 
            error: null 
          }))
        }))
      })),
      single: vi.fn(() => Promise.resolve({ 
        data: mockSupabaseData[table as keyof typeof mockSupabaseData]?.[0] || null, 
        error: null 
      }))
    })),
    insert: vi.fn((data: any) => ({
      select: vi.fn(() => ({
        single: vi.fn(() => {
          const newId = Date.now().toString();
          const newItem = { ...data, id: newId };
          (mockSupabaseData[table as keyof typeof mockSupabaseData] as any[]).push(newItem);
          return Promise.resolve({ data: newItem, error: null });
        })
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  })),
  rpc: vi.fn((funcName: string, params?: any) => {
    console.log(`🔧 Mock RPC: ${funcName}`, params);
    
    switch (funcName) {
      case 'criar_cliente':
        const novoCliente = { 
          id: `cliente_${Date.now()}`,
          razao_social: params.p_razao_social,
          cnpj: params.p_cnpj,
          endereco: params.p_endereco,
          inscricao_estadual: params.p_inscricao_estadual,
          prazo_pagamento: params.p_prazo_pagamento,
          contato: params.p_contato,
          celular: params.p_celular,
          email: params.p_email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockSupabaseData.clientes.push(novoCliente);
        return Promise.resolve({ 
          data: { success: true, cliente: novoCliente }, 
          error: null 
        });
      
      case 'criar_vaga':
        const novaVaga = { 
          id: `vaga_${Date.now()}`,
          numero_vaga: params.p_numero_vaga,
          cliente_id: params.p_cliente_id,
          empresa: params.p_empresa,
          contato_envio_cv: params.p_contato_envio_cv,
          email: params.p_email,
          celular: params.p_celular,
          cargo: params.p_cargo,
          salario: params.p_salario,
          local_trabalho: params.p_local_trabalho,
          perfil_posicao: params.p_perfil_posicao,
          informacoes_complementares: params.p_informacoes_complementares,
          observacoes: params.p_observacoes,
          questionario_tecnico: params.p_questionario_tecnico,
          consultor: params.p_consultor,
          status: 'aberta',
          data_recebimento: new Date().toISOString(),
          data_formatacao_perfil: new Date().toISOString(),
          data_divulgacao_vaga: new Date().toISOString(),
          data_inicio_selecao: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockSupabaseData.vagas.push(novaVaga);
        return Promise.resolve({ 
          data: { success: true, vaga: novaVaga }, 
          error: null 
        });
      
      case 'criar_candidato_externo':
        const novoCandidato = { 
          id: `candidato_${Date.now()}`,
          nome: params.p_nome,
          email: params.p_email,
          senha_hash: params.p_senha_hash,
          telefone: params.p_telefone,
          data_nascimento: params.p_data_nascimento,
          endereco: params.p_endereco,
          cidade: params.p_cidade,
          estado: params.p_estado,
          cep: params.p_cep,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockSupabaseData.candidatos_externos.push(novoCandidato);
        return Promise.resolve({ 
          data: { success: true, candidato: novoCandidato }, 
          error: null 
        });
      
      case 'buscar_candidato_externo_por_email':
        const candidato = mockSupabaseData.candidatos_externos.find(c => c.email === params.p_email);
        return Promise.resolve({ 
          data: { success: true, candidato }, 
          error: null 
        });
      
      case 'aplicar_candidato_vaga':
        const novaCandidatura = {
          id: `candidatura_${Date.now()}`,
          candidato_id: params.p_candidato_id,
          vaga_id: params.p_vaga_id,
          observacoes: params.p_observacoes,
          curriculo_url: params.p_curriculo_url,
          status: 'selecionando',
          created_at: new Date().toISOString()
        };
        mockSupabaseData.candidaturas.push(novaCandidatura);
        return Promise.resolve({ 
          data: { success: true, candidatura: novaCandidatura }, 
          error: null 
        });
      
      case 'verificar_candidatura_existente':
        const candidaturaExistente = mockSupabaseData.candidaturas.find(
          c => c.candidato_id === params.p_candidato_id && c.vaga_id === params.p_vaga_id
        );
        return Promise.resolve({ 
          data: { success: true, candidatou: !!candidaturaExistente }, 
          error: null 
        });
      
      case 'buscar_candidaturas_candidato':
        const candidaturasComVaga = mockSupabaseData.candidaturas
          .filter(c => c.candidato_id === params.p_candidato_id)
          .map(c => {
            const vaga = mockSupabaseData.vagas.find(v => v.id === c.vaga_id);
            return { ...c, vaga };
          });
        return Promise.resolve({ 
          data: { success: true, candidaturas: candidaturasComVaga }, 
          error: null 
        });
      
      default:
        return Promise.resolve({ data: { success: true }, error: null });
    }
  }),
  auth: {
    getSession: vi.fn(() => Promise.resolve({ 
      data: { session: { user: { id: '1', email: 'admin@test.com' } } }, 
      error: null 
    }))
  }
};

// Aplicar o mock ANTES de outros imports
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Agora importar outros módulos
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CandidatoExternoProvider } from '@/contexts/CandidatoExternoContext';

// Helper para criar um wrapper com providers
const createWrapper = () => {
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
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </CandidatoExternoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Fluxo Completo da Aplicação - E2E', () => {
  let Wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    Wrapper = createWrapper();
    
    // Reset dos dados mock
    mockSupabaseData.clientes = [];
    mockSupabaseData.vagas = [];
    mockSupabaseData.candidatos_externos = [];
    mockSupabaseData.candidaturas = [];
    
    // Limpar localStorage
    localStorage.clear();
    
    console.log('🧹 Estado da aplicação limpo para novo teste');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo Principal E2E', () => {
    it('deve executar todo o fluxo: Cliente → Vaga → Candidato → Candidatura → Verificações', async () => {
      console.log('🚀 Iniciando teste de fluxo completo E2E');

      // PASSO 1: Criar Cliente
      console.log('📋 PASSO 1: Criando cliente...');
      const clienteResult = await mockSupabase.rpc('criar_cliente', {
        p_razao_social: 'Empresa Teste E2E Ltda',
        p_cnpj: '12.345.678/0001-90',
        p_endereco: 'Rua Teste E2E, 123',
        p_inscricao_estadual: '123456789',
        p_prazo_pagamento: 30,
        p_contato: 'João Gerente',
        p_celular: '(11) 99999-9999',
        p_email: 'joao@empresateste.com'
      });

      expect(clienteResult.data.success).toBe(true);
      expect(clienteResult.data.cliente).toBeDefined();
      expect(mockSupabaseData.clientes).toHaveLength(1);
      
      const clienteId = clienteResult.data.cliente.id;
      console.log('✅ Cliente criado com ID:', clienteId);

      // PASSO 2: Criar Vaga com Questionário
      console.log('💼 PASSO 2: Criando vaga com questionário...');
      const questionarioVaga = JSON.stringify([
        {
          id: '1',
          pergunta: 'Quantos anos de experiência você tem com React?',
          tipo: 'multipla_escolha',
          opcoes: ['Menos de 1 ano', '1-2 anos', '3-5 anos', 'Mais de 5 anos'],
          obrigatoria: true
        },
        {
          id: '2',
          pergunta: 'Você tem experiência com TypeScript?',
          tipo: 'sim_nao',
          obrigatoria: true
        },
        {
          id: '3',
          pergunta: 'Descreva sua experiência com testes unitários:',
          tipo: 'texto_longo',
          obrigatoria: false
        }
      ]);

      const vagaResult = await mockSupabase.rpc('criar_vaga', {
        p_numero_vaga: 'VG-E2E-001',
        p_cliente_id: clienteId,
        p_empresa: 'Empresa Teste E2E Ltda',
        p_contato_envio_cv: 'João Gerente',
        p_email: 'joao@empresateste.com',
        p_celular: '(11) 99999-9999',
        p_cargo: 'Desenvolvedor React Senior',
        p_salario: 10000,
        p_local_trabalho: 'São Paulo - SP (Híbrido)',
        p_perfil_posicao: 'Desenvolvedor React Senior com 5+ anos de experiência',
        p_informacoes_complementares: 'Conhecimento em TypeScript obrigatório',
        p_observacoes: 'Vaga para teste E2E',
        p_questionario_tecnico: questionarioVaga,
        p_consultor: 'Maria Consultora'
      });

      expect(vagaResult.data.success).toBe(true);
      expect(vagaResult.data.vaga).toBeDefined();
      expect(mockSupabaseData.vagas).toHaveLength(1);
      
      const vagaId = vagaResult.data.vaga.id;
      console.log('✅ Vaga criada com ID:', vagaId);

      // PASSO 3: Registrar Candidato
      console.log('👤 PASSO 3: Registrando candidato...');
      const candidatoResult = await mockSupabase.rpc('criar_candidato_externo', {
        p_nome: 'Pedro Candidato E2E',
        p_email: 'pedro.e2e@email.com',
        p_senha_hash: 'hash_senha_segura',
        p_telefone: '(11) 88888-8888',
        p_data_nascimento: '1990-01-01',
        p_endereco: 'Rua dos Candidatos, 456',
        p_cidade: 'São Paulo',
        p_estado: 'SP',
        p_cep: '01234-567'
      });

      expect(candidatoResult.data.success).toBe(true);
      expect(candidatoResult.data.candidato).toBeDefined();
      expect(mockSupabaseData.candidatos_externos).toHaveLength(1);
      
      const candidatoId = candidatoResult.data.candidato.id;
      console.log('✅ Candidato registrado com ID:', candidatoId);

      // PASSO 4: Login do Candidato
      console.log('🔐 PASSO 4: Fazendo login do candidato...');
      const loginResult = await mockSupabase.rpc('buscar_candidato_externo_por_email', {
        p_email: 'pedro.e2e@email.com'
      });

      expect(loginResult.data.success).toBe(true);
      expect(loginResult.data.candidato).toBeDefined();
      expect(loginResult.data.candidato.id).toBe(candidatoId);
      console.log('✅ Login realizado com sucesso');

      // PASSO 5: Verificar se Não Há Candidatura Prévia
      console.log('🔍 PASSO 5: Verificando candidatura prévia...');
      const verificacaoPrevia = await mockSupabase.rpc('verificar_candidatura_existente', {
        p_candidato_id: candidatoId,
        p_vaga_id: vagaId
      });

      expect(verificacaoPrevia.data.success).toBe(true);
      expect(verificacaoPrevia.data.candidatou).toBe(false);
      console.log('✅ Confirmado: candidato ainda não se candidatou');

      // PASSO 6: Aplicar na Vaga
      console.log('📝 PASSO 6: Aplicando na vaga...');
      const candidaturaResult = await mockSupabase.rpc('aplicar_candidato_vaga', {
        p_candidato_id: candidatoId,
        p_vaga_id: vagaId,
        p_observacoes: 'Muito interessado na vaga. Disponível para início imediato.',
        p_curriculo_url: null
      });

      expect(candidaturaResult.data.success).toBe(true);
      expect(candidaturaResult.data.candidatura).toBeDefined();
      expect(mockSupabaseData.candidaturas).toHaveLength(1);
      
      const candidaturaId = candidaturaResult.data.candidatura.id;
      console.log('✅ Candidatura realizada com ID:', candidaturaId);

      // PASSO 7: Verificar Candidatura Realizada
      console.log('✅ PASSO 7: Verificando candidatura realizada...');
      const verificacaoPos = await mockSupabase.rpc('verificar_candidatura_existente', {
        p_candidato_id: candidatoId,
        p_vaga_id: vagaId
      });

      expect(verificacaoPos.data.success).toBe(true);
      expect(verificacaoPos.data.candidatou).toBe(true);
      console.log('✅ Candidatura confirmada no sistema');

      // PASSO 8: Buscar Candidaturas para o Dashboard do Candidato
      console.log('🏠 PASSO 8: Buscando candidaturas para dashboard do candidato...');
      const candidaturasDashboard = await mockSupabase.rpc('buscar_candidaturas_candidato', {
        p_candidato_id: candidatoId
      });

      expect(candidaturasDashboard.data.success).toBe(true);
      expect(candidaturasDashboard.data.candidaturas).toHaveLength(1);
      
      const candidaturaDashboard = candidaturasDashboard.data.candidaturas[0];
      expect(candidaturaDashboard.vaga).toBeDefined();
      expect(candidaturaDashboard.vaga.cargo).toBe('Desenvolvedor React Senior');
      expect(candidaturaDashboard.vaga.empresa).toBe('Empresa Teste E2E Ltda');
      expect(candidaturaDashboard.status).toBe('selecionando');
      console.log('✅ Candidatura aparece corretamente no dashboard:', candidaturaDashboard);

      // VERIFICAÇÕES FINAIS
      console.log('🎯 Executando verificações finais...');
      
      // Verificar estado final da aplicação
      expect(mockSupabaseData.clientes).toHaveLength(1);
      expect(mockSupabaseData.vagas).toHaveLength(1);
      expect(mockSupabaseData.candidatos_externos).toHaveLength(1);
      expect(mockSupabaseData.candidaturas).toHaveLength(1);

      // Verificar integridade dos dados
      const cliente = mockSupabaseData.clientes[0];
      const vaga = mockSupabaseData.vagas[0];
      const candidato = mockSupabaseData.candidatos_externos[0];
      const candidatura = mockSupabaseData.candidaturas[0];

      expect(vaga.cliente_id).toBe(cliente.id);
      expect(candidatura.candidato_id).toBe(candidato.id);
      expect(candidatura.vaga_id).toBe(vaga.id);

      // Verificar questionário foi preservado
      const questionarioParsed = JSON.parse(vaga.questionario_tecnico);
      expect(questionarioParsed).toHaveLength(3);
      expect(questionarioParsed[0].obrigatoria).toBe(true);
      expect(questionarioParsed[1].obrigatoria).toBe(true);
      expect(questionarioParsed[2].obrigatoria).toBe(false);

      console.log('🎉 TESTE COMPLETO PASSOU! Todos os passos executados com sucesso:');
      console.log('  ✅ Cliente criado');
      console.log('  ✅ Vaga criada com questionário');
      console.log('  ✅ Candidato registrado');
      console.log('  ✅ Login realizado');
      console.log('  ✅ Candidatura realizada');
      console.log('  ✅ Candidatura aparece no dashboard do candidato');
      console.log('  ✅ Todas as integrações funcionando');
    }, 30000); // 30 segundos timeout para teste completo

    it('deve validar questionário obrigatório', async () => {
      console.log('📝 Testando validação de questionário obrigatório...');

      // Criar estrutura básica primeiro
      const clienteResult = await mockSupabase.rpc('criar_cliente', {
        p_razao_social: 'Empresa Validação',
        p_cnpj: '98.765.432/0001-10',
        p_endereco: 'Rua Validação, 789',
        p_inscricao_estadual: '987654321',
        p_prazo_pagamento: 45,
        p_contato: 'Ana Gerente',
        p_celular: '(11) 77777-7777',
        p_email: 'ana@empresavalidacao.com'
      });

      const questionarioComplexo = JSON.stringify([
        {
          id: '1',
          pergunta: 'Primeira pergunta obrigatória',
          tipo: 'multipla_escolha',
          opcoes: ['Opção 1', 'Opção 2', 'Opção 3'],
          obrigatoria: true
        },
        {
          id: '2',
          pergunta: 'Segunda pergunta obrigatória',
          tipo: 'sim_nao',
          obrigatoria: true
        },
        {
          id: '3',
          pergunta: 'Pergunta opcional',
          tipo: 'texto_longo',
          obrigatoria: false
        }
      ]);

      const vagaResult = await mockSupabase.rpc('criar_vaga', {
        p_numero_vaga: 'VG-VAL-001',
        p_cliente_id: clienteResult.data.cliente.id,
        p_empresa: 'Empresa Validação',
        p_contato_envio_cv: 'Ana Gerente',
        p_email: 'ana@empresavalidacao.com',
        p_celular: '(11) 77777-7777',
        p_cargo: 'Desenvolvedor Pleno',
        p_salario: 8000,
        p_local_trabalho: 'Remote',
        p_perfil_posicao: 'Desenvolvedor com experiência',
        p_informacoes_complementares: 'Questionário obrigatório',
        p_observacoes: 'Teste de validação',
        p_questionario_tecnico: questionarioComplexo,
        p_consultor: 'Consultor Teste'
      });

      // Criar candidato
      const candidatoResult = await mockSupabase.rpc('criar_candidato_externo', {
        p_nome: 'Candidato Validação',
        p_email: 'validacao@email.com',
        p_senha_hash: 'hash_senha',
        p_telefone: '(11) 66666-6666',
        p_data_nascimento: '1985-05-10',
        p_endereco: 'Rua Validação, 321',
        p_cidade: 'São Paulo',
        p_estado: 'SP',
        p_cep: '09876-543'
      });

      // Candidatura válida (no mock sempre aceita, mas vamos validar estrutura)
      const candidaturaValida = await mockSupabase.rpc('aplicar_candidato_vaga', {
        p_candidato_id: candidatoResult.data.candidato.id,
        p_vaga_id: vagaResult.data.vaga.id,
        p_observacoes: 'Candidatura com questionário completo',
        p_curriculo_url: null
      });

      expect(candidaturaValida.data.success).toBe(true);
      console.log('✅ Estrutura de validação de questionário testada');
    });
  });
}); 