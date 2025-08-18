// Tipos para o backend do Lotus Recruit Hub

export type UserType = 'admin' | 'consultor';
export type VagaStatus = 'rascunho' | 'publicada' | 'em_analise' | 'pausada' | 'encerrada';
export type CandidatoStatus = 
  | 'selecionando'
  | 'curriculo_enviado'
  | 'entrevista_agendada'
  | 'entrevista_realizada'
  | 'aprovado'
  | 'reprovado'
  | 'desistiu';
export type ContaReceberStatus = 'pendente' | 'pago' | 'atrasado' | 'parcial';
export type ContaReceberTipo = 'comissao' | 'taxa' | 'adicional';

export type DisponibilidadeCandidato = 'disponivel' | 'empregado' | 'indisponivel';
export type CandidatoBancoStatus = 'ativo' | 'inativo';

// Interface para Usuário
export interface Usuario {
  id: string;
  email: string;
  senha_hash: string;
  nome: string;
  tipo: UserType;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para Cliente
export interface Cliente {
  id: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para Vaga
export interface Vaga {
  id: string;
  numero_vaga: string;
  empresa_id: string;
  contato_envio_cv?: string;
  email?: string;
  celular?: string;
  cargo: string;
  salario?: string;
  local_trabalho?: string;
  data_recebimento?: string;
  data_formatacao_perfil?: string;
  data_divulgacao?: string;
  data_inicio_selecao?: string;
  data_envio_curriculos?: string;
  data_encerramento?: string;
  perfil_word?: string;
  informacoes_complementares?: string;
  questionario_tecnico?: string;
  observacoes?: string;
  consultor_id: string;
  status: VagaStatus;
  created_at: string;
  updated_at: string;
}

// Interface para Candidato
export interface Candidato {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

// Interface para CandidatoVaga (relacionamento N:N)
export interface CandidatoVaga {
  id: string;
  candidato_id: string;
  vaga_id: string;
  status_atual: CandidatoStatus;
  data_candidatura: string;
  observacoes?: string;
  avaliacao?: number;
  data_admissao?: string;
  salario_contratado?: number;
  nota_fiscal_numero?: string;
  parecer_consultor?: string;
  data_envio_cliente?: string;
  created_at: string;
  updated_at: string;
}

// Interface para Histórico de Status
export interface HistoricoStatus {
  id: string;
  candidato_vaga_id: string;
  status_anterior?: CandidatoStatus;
  status_novo: CandidatoStatus;
  usuario_id: string;
  comentario?: string;
  created_at: string;
}

// Interface para Currículo
export interface Curriculo {
  id: string;
  candidato_id: string;
  vaga_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  created_at: string;
}

// Interface para Banco de Currículos
export interface BancoCurriculo {
  id: string;
  candidato_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  area_atuacao?: string;
  experiencia_anos?: number;
  formacao?: string;
  localizacao?: string;
  disponibilidade: DisponibilidadeCandidato;
  avaliacao?: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status: CandidatoBancoStatus;
  favorito: boolean;
  created_at: string;
  updated_at: string;
}

export interface BancoCurriculoWithCandidato extends BancoCurriculo {
  candidato: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
}

// Interface para ContaReceber
export interface ContaReceber {
  id: string;
  vaga_id: string;
  empresa_id: string;
  numero_vaga: string;
  cargo: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: ContaReceberStatus;
  tipo: ContaReceberTipo;
  observacoes?: string;
  nota_fiscal_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ContaReceberWithDetails extends ContaReceber {
  empresa: {
    id: string;
    razao_social: string;
    cnpj: string;
  };
  vaga: {
    id: string;
    numero_vaga: string;
    cargo: string;
  };
}

// Interfaces para criação (sem campos auto-gerados)
export interface CreateUsuario {
  email: string;
  senha_hash: string;
  nome: string;
  tipo: UserType;
  ativo?: boolean;
}

export interface CreateCliente {
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  ativo?: boolean;
}

export interface CreateVaga {
  numero_vaga: string;
  empresa_id: string;
  contato_envio_cv?: string;
  email?: string;
  celular?: string;
  cargo: string;
  salario?: string;
  local_trabalho?: string;
  data_recebimento?: string;
  data_formatacao_perfil?: string;
  data_divulgacao?: string;
  data_inicio_selecao?: string;
  data_envio_curriculos?: string;
  data_encerramento?: string;
  perfil_word?: string;
  informacoes_complementares?: string;
  questionario_tecnico?: string;
  observacoes?: string;
  consultor_id: string;
  status?: VagaStatus;
}

export interface CreateCandidato {
  nome: string;
  email?: string;
  telefone?: string;
}

export interface CreateCandidatoVaga {
  candidato_id: string;
  vaga_id: string;
  status_atual?: CandidatoStatus;
  observacoes?: string;
  avaliacao?: number;
  data_admissao?: string;
  salario_contratado?: number;
  nota_fiscal_numero?: string;
  parecer_consultor?: string;
  data_envio_cliente?: string;
}

export interface CreateHistoricoStatus {
  candidato_vaga_id: string;
  status_anterior?: CandidatoStatus;
  status_novo: CandidatoStatus;
  usuario_id: string;
  comentario?: string;
}

export interface CreateCurriculo {
  candidato_id: string;
  vaga_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
}

// Interfaces para atualização (campos opcionais)
export interface UpdateUsuario {
  email?: string;
  senha_hash?: string;
  nome?: string;
  tipo?: UserType;
  ativo?: boolean;
}

export interface UpdateCliente {
  razao_social?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  ativo?: boolean;
}

export interface UpdateVaga {
  numero_vaga?: string;
  empresa_id?: string;
  contato_envio_cv?: string;
  email?: string;
  celular?: string;
  cargo?: string;
  salario?: string;
  local_trabalho?: string;
  data_recebimento?: string;
  data_formatacao_perfil?: string;
  data_divulgacao?: string;
  data_inicio_selecao?: string;
  data_envio_curriculos?: string;
  data_encerramento?: string;
  perfil_word?: string;
  informacoes_complementares?: string;
  questionario_tecnico?: string;
  observacoes?: string;
  consultor_id?: string;
  status?: VagaStatus;
}

export interface UpdateCandidato {
  nome?: string;
  email?: string;
  telefone?: string;
}

export interface UpdateCandidatoVaga {
  status_atual?: CandidatoStatus;
  observacoes?: string;
  avaliacao?: number;
  data_admissao?: string;
  salario_contratado?: number;
  nota_fiscal_numero?: string;
  parecer_consultor?: string;
  data_envio_cliente?: string;
}

// Interfaces para respostas da API
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Interfaces para queries e filtros
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SearchParams {
  search?: string;
  status?: string;
  consultor_id?: string;
  empresa_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface VagaFilters extends SearchParams {
  status?: VagaStatus;
  consultor_id?: string;
  empresa_id?: string;
}

export interface CandidatoFilters extends SearchParams {
  status?: CandidatoStatus;
  vaga_id?: string;
  consultor_id?: string;
}

// Interfaces para estatísticas e relatórios
export interface VagaStats {
  total: number;
  ativas: number;
  pausadas: number;
  fechadas: number;
  por_consultor: Array<{
    consultor_id: string;
    consultor_nome: string;
    total: number;
    ativas: number;
  }>;
}

export interface CandidatoStats {
  total: number;
  por_status: Array<{
    status: CandidatoStatus;
    count: number;
  }>;
  por_vaga: Array<{
    vaga_id: string;
    vaga_numero: string;
    total: number;
  }>;
}

// Interfaces para autenticação
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Usuario;
  token: string;
  refresh_token: string;
}

export interface JwtPayload {
  sub: string; // user_id
  email: string;
  tipo: UserType;
  iat: number;
  exp: number;
}

export interface CreateContaReceber {
  vaga_id: string;
  empresa_id: string;
  numero_vaga: string;
  cargo: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status?: ContaReceberStatus;
  tipo?: ContaReceberTipo;
  observacoes?: string;
  nota_fiscal_url?: string;
}

export interface UpdateContaReceber {
  valor?: number;
  data_vencimento?: string;
  data_pagamento?: string;
  status?: ContaReceberStatus;
  tipo?: ContaReceberTipo;
  observacoes?: string;
  nota_fiscal_url?: string;
}

export interface ContaReceberFilters extends SearchParams {
  status?: ContaReceberStatus;
  tipo?: ContaReceberTipo;
  empresa_id?: string;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
}

export interface ContaReceberStats {
  total: number;
  pendente: number;
  pago: number;
  atrasado: number;
  parcial: number;
  valor_total: number;
  valor_recebido: number;
  valor_pendente: number;
  valor_atrasado: number;
} 

// Tipos para Candidatos Externos
export interface CandidatoExterno {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  curriculo_url?: string;
  curriculo_nome?: string;
  curriculo_tamanho?: number;
  curriculo_tipo?: string;
  data_cadastro: string;
  ultimo_login?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCandidatoExterno {
  nome: string;
  email: string;
  senha_hash: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface UpdateCandidatoExterno {
  nome?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  curriculo_url?: string;
  curriculo_nome?: string;
  curriculo_tamanho?: number;
  curriculo_tipo?: string;
}

export interface CandidaturaExterna {
  id: string;
  candidato_externo_id: string;
  vaga_id: string;
  data_candidatura: string;
  status: string;
  observacoes?: string;
  curriculo_anexado: boolean;
  curriculo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidaturaExternaWithVaga extends CandidaturaExterna {
  vaga: {
    numero_vaga: string;
    cargo: string;
    empresa_nome?: string;
  };
}

export interface CreateCandidaturaExterna {
  candidato_externo_id: string;
  vaga_id: string;
  observacoes?: string;
  curriculo_url?: string;
}

// Respostas das RPC Functions
export interface CandidatoExternoResponse {
  success: boolean;
  id?: string;
  candidato?: Omit<CandidatoExterno, 'senha_hash'>;
  message?: string;
  error?: string;
}

export interface CandidaturasResponse {
  success: boolean;
  candidaturas: CandidaturaExternaWithVaga[];
  error?: string;
}

export interface CandidaturaResponse {
  success: boolean;
  message?: string;
  vaga?: {
    id: string;
    cargo: string;
    empresa: string;
  };
  error?: string;
}

export interface VerificarCandidaturaResponse {
  success: boolean;
  candidatou: boolean;
  data_candidatura?: string;
  status?: string;
  error?: string;
} 