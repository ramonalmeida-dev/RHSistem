import { CandidatosExternosService } from './candidatosExternosService';
import { supabase } from './supabase';

export class TestCandidatosExternos {
  static async runAllTests() {
    console.log('=== INICIANDO TESTES DE CANDIDATOS EXTERNOS ===');
    
    try {
      // Teste 1: Verificar conexão com Supabase
      await this.testConexao();
      
      // Teste 2: Testar RPC functions
      await this.testRPCFunctions();
      
      // Teste 3: Testar criação de candidato
      await this.testCriarCandidato();
      
      // Teste 4: Testar busca de candidato
      await this.testBuscarCandidato();
      
      console.log('✅ Todos os testes passaram!');
      
    } catch (error) {
      console.error('❌ Erro nos testes:', error);
    }
  }

  static async testConexao() {
    console.log('\n=== TESTE DE CONEXÃO ===');
    
    try {
      const { data, error } = await supabase.from('candidatos_externos').select('count').limit(1);
      
      if (error) {
        console.error('❌ Erro na conexão:', error);
        throw error;
      }
      
      console.log('✅ Conexão com Supabase OK');
      console.log('📊 Tabela candidatos_externos acessível');
      
    } catch (error) {
      console.error('❌ Falha no teste de conexão:', error);
      throw error;
    }
  }

  static async testRPCFunctions() {
    console.log('\n=== TESTE DE RPC FUNCTIONS ===');
    
    try {
      // Testar função criar_candidato_externo
      const { data: criarResult, error: criarError } = await supabase.rpc('criar_candidato_externo', {
        p_nome: 'Teste Candidato',
        p_email: 'teste@exemplo.com',
        p_senha_hash: 'senha123',
        p_telefone: '(11) 99999-9999'
      });

      if (criarError) {
        console.error('❌ Erro na função criar_candidato_externo:', criarError);
        throw criarError;
      }

      console.log('✅ Função criar_candidato_externo OK');
      console.log('📊 Resultado:', criarResult);

      // Testar função buscar_candidato_externo_por_email
      const { data: buscarResult, error: buscarError } = await supabase.rpc('buscar_candidato_externo_por_email', {
        p_email: 'teste@exemplo.com'
      });

      if (buscarError) {
        console.error('❌ Erro na função buscar_candidato_externo_por_email:', buscarError);
        throw buscarError;
      }

      console.log('✅ Função buscar_candidato_externo_por_email OK');
      console.log('📊 Resultado:', buscarResult);

      // Testar função verificar_candidatura_existente
      const { data: verificarResult, error: verificarError } = await supabase.rpc('verificar_candidatura_existente', {
        p_candidato_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
        p_vaga_id: '00000000-0000-0000-0000-000000000000' // UUID inválido para teste
      });

      if (verificarError) {
        console.error('❌ Erro na função verificar_candidatura_existente:', verificarError);
        throw verificarError;
      }

      console.log('✅ Função verificar_candidatura_existente OK');
      console.log('📊 Resultado:', verificarResult);

    } catch (error) {
      console.error('❌ Falha no teste de RPC functions:', error);
      throw error;
    }
  }

  static async testCriarCandidato() {
    console.log('\n=== TESTE DE CRIAÇÃO DE CANDIDATO ===');
    
    try {
      const emailTeste = `teste_${Date.now()}@exemplo.com`;
      
      const resultado = await CandidatosExternosService.criar({
        nome: 'Candidato Teste',
        email: emailTeste,
        senha_hash: 'senha123',
        telefone: '(11) 99999-9999'
      });

      if (!resultado.success) {
        console.error('❌ Erro ao criar candidato:', resultado.error);
        throw new Error(resultado.error);
      }

      console.log('✅ Candidato criado com sucesso');
      console.log('📊 ID do candidato:', resultado.id);
      console.log('📊 Email:', emailTeste);

      // Limpar candidato de teste
      await this.limparCandidatoTeste(emailTeste);

    } catch (error) {
      console.error('❌ Falha no teste de criação:', error);
      throw error;
    }
  }

  static async testBuscarCandidato() {
    console.log('\n=== TESTE DE BUSCA DE CANDIDATO ===');
    
    try {
      const emailTeste = `busca_${Date.now()}@exemplo.com`;
      
      // Primeiro criar um candidato
      await CandidatosExternosService.criar({
        nome: 'Candidato Busca',
        email: emailTeste,
        senha_hash: 'senha123',
        telefone: '(11) 88888-8888'
      });

      // Depois buscar
      const resultado = await CandidatosExternosService.buscarPorEmail(emailTeste);

      if (!resultado.success) {
        console.error('❌ Erro ao buscar candidato:', resultado.error);
        throw new Error(resultado.error);
      }

      if (!resultado.candidato) {
        console.error('❌ Candidato não encontrado');
        throw new Error('Candidato não encontrado');
      }

      console.log('✅ Candidato encontrado com sucesso');
      console.log('📊 Nome:', resultado.candidato.nome);
      console.log('📊 Email:', resultado.candidato.email);

      // Limpar candidato de teste
      await this.limparCandidatoTeste(emailTeste);

    } catch (error) {
      console.error('❌ Falha no teste de busca:', error);
      throw error;
    }
  }

  static async limparCandidatoTeste(email: string) {
    try {
      const { error } = await supabase
        .from('candidatos_externos')
        .delete()
        .eq('email', email);

      if (error) {
        console.warn('⚠️ Erro ao limpar candidato de teste:', error);
      } else {
        console.log('🧹 Candidato de teste removido');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao limpar candidato de teste:', error);
    }
  }

  static async testarIntegracaoCompleta() {
    console.log('\n=== TESTE DE INTEGRAÇÃO COMPLETA ===');
    
    try {
      // 1. Criar candidato
      const emailTeste = `integracao_${Date.now()}@exemplo.com`;
      
      const candidatoCriado = await CandidatosExternosService.criar({
        nome: 'Candidato Integração',
        email: emailTeste,
        senha_hash: 'senha123',
        telefone: '(11) 77777-7777'
      });

      if (!candidatoCriado.success || !candidatoCriado.id) {
        throw new Error('Falha ao criar candidato');
      }

      console.log('✅ Candidato criado:', candidatoCriado.id);

      // 2. Buscar candidato
      const candidatoBuscado = await CandidatosExternosService.buscarPorEmail(emailTeste);

      if (!candidatoBuscado.success || !candidatoBuscado.candidato) {
        throw new Error('Falha ao buscar candidato');
      }

      console.log('✅ Candidato encontrado:', candidatoBuscado.candidato.nome);

      // 3. Atualizar candidato
      const candidatoAtualizado = await CandidatosExternosService.atualizar(
        candidatoCriado.id,
        {
          nome: 'Candidato Integração Atualizado',
          telefone: '(11) 66666-6666'
        }
      );

      if (!candidatoAtualizado.success) {
        throw new Error('Falha ao atualizar candidato');
      }

      console.log('✅ Candidato atualizado');

      // 4. Verificar candidatura (deve retornar false para vaga inexistente)
      const candidaturaVerificada = await CandidatosExternosService.verificarCandidatura(
        candidatoCriado.id,
        '00000000-0000-0000-0000-000000000000'
      );

      console.log('✅ Verificação de candidatura:', candidaturaVerificada);

      // 5. Buscar candidaturas (deve retornar array vazio)
      const candidaturas = await CandidatosExternosService.buscarCandidaturas(candidatoCriado.id);

      if (!candidaturas.success) {
        throw new Error('Falha ao buscar candidaturas');
      }

      console.log('✅ Candidaturas buscadas:', candidaturas.candidaturas.length, 'candidaturas');

      // Limpar
      await this.limparCandidatoTeste(emailTeste);

      console.log('✅ Teste de integração completo passou!');

    } catch (error) {
      console.error('❌ Falha no teste de integração:', error);
      throw error;
    }
  }
} 