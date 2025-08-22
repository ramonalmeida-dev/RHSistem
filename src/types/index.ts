// Tipos globais do projeto Lotus Recruit Hub

// Tipos de usuário
export type UserType = 'admin' | 'consultor';

// Status de vagas
export type VagaStatus = 'rascunho' | 'publicada' | 'em_analise' | 'pausada' | 'encerrada';

// Substatus de vagas
export type VagaSubstatus = 'hired' | 'not_filled' | null;

// Status de candidatos
export type CandidatoStatus = 
  | 'selecionando'
  | 'curriculo_enviado'
  | 'entrevista_agendada'
  | 'entrevista_realizada'
  | 'aprovado'
  | 'reprovado'
  | 'desistiu';

// Constantes para o ciclo de vida da vaga
export const VAGA_STATUS_CONFIG = {
  rascunho: {
    title: 'Rascunho',
    description: 'Criada, mas ainda não publicada',
    color: 'bg-gray-100 text-gray-800',
    icon: 'FileText',
    actions: ['editar', 'excluir', 'publicar'],
    canReceiveCandidates: false
  },
  publicada: {
    title: 'Publicada',
    description: 'Visível e recebendo candidaturas',
    color: 'bg-green-100 text-green-800',
    icon: 'CheckCircle',
    actions: ['pausar', 'encerrar', 'editar', 'iniciar_analise'],
    canReceiveCandidates: true
  },
  em_analise: {
    title: 'Em Análise',
    description: 'Candidaturas sendo avaliadas',
    color: 'bg-blue-100 text-blue-800',
    icon: 'Search',
    actions: ['pausar', 'encerrar', 'editar', 'voltar_publicada'],
    canReceiveCandidates: true
  },
  pausada: {
    title: 'Pausada',
    description: 'Não recebe novas candidaturas',
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'Pause',
    actions: ['reabrir', 'encerrar', 'editar'],
    canReceiveCandidates: false
  },
  encerrada: {
    title: 'Encerrada',
    description: 'Encerrada definitivamente',
    color: 'bg-red-100 text-red-800',
    icon: 'XCircle',
    actions: ['editar', 'reabrir'],
    canReceiveCandidates: false
  }
} as const;

export const VAGA_SUBSTATUS_CONFIG = {
  hired: {
    title: 'Contratado',
    description: 'Vaga preenchida com sucesso',
    color: 'bg-emerald-100 text-emerald-800'
  },
  not_filled: {
    title: 'Não Preenchida',
    description: 'Vaga encerrada sem contratação',
    color: 'bg-slate-100 text-slate-800'
  }
} as const;

// Interfaces principais
export interface User {
  id: string;
  email: string;
  nome: string;
  tipo: UserType;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  // Novos campos de endereço
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vaga {
  id: string;
  numero_vaga: string;
  empresa_id: string;
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
  substatus?: VagaSubstatus;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  empresa?: Cliente;
  consultor?: User;
  questionario?: QuestionarioVaga;
}

export interface Candidato {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidatoVaga {
  id: string;
  candidato_id: string;
  vaga_id: string;
  status_atual: CandidatoStatus;
  data_candidatura?: string;
  observacoes?: string;
  avaliacao?: number;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  candidato?: Candidato;
  vaga?: Vaga;
}

export interface HistoricoStatus {
  id: string;
  candidato_vaga_id: string;
  status_anterior?: CandidatoStatus;
  status_novo: CandidatoStatus;
  usuario_id: string;
  comentario?: string;
  created_at: string;
  // Relacionamentos
  usuario?: User;
}

export interface Curriculo {
  id: string;
  candidato_id: string;
  vaga_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  created_at: string;
  // Relacionamentos
  candidato?: Candidato;
  vaga?: Vaga;
}

// Tipos para criação/atualização
export type CreateUser = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  password: string;
};

export type UpdateUser = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> & {
  password?: string;
};

export type CreateCliente = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;

export type UpdateCliente = Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>;

export type CreateVaga = Omit<Vaga, 'id' | 'created_at' | 'updated_at' | 'empresa' | 'consultor'>;

export type UpdateVaga = Partial<Omit<Vaga, 'id' | 'created_at' | 'updated_at' | 'empresa' | 'consultor'>>;

export type CreateCandidato = Omit<Candidato, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export type UpdateCandidato = Partial<Omit<Candidato, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;

export type CreateCandidatoVaga = Omit<CandidatoVaga, 'id' | 'created_at' | 'updated_at' | 'candidato' | 'vaga'>;

export type UpdateCandidatoVaga = Partial<Omit<CandidatoVaga, 'id' | 'created_at' | 'updated_at' | 'candidato' | 'vaga'>>;

export type CreateHistoricoStatus = Omit<HistoricoStatus, 'id' | 'created_at' | 'usuario'>;

export type CreateCurriculo = Omit<Curriculo, 'id' | 'created_at' | 'candidato' | 'vaga'>;

// Tipos para APIs
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

// Tipos para filtros
export interface VagaFilters {
  consultor_id?: string;
  empresa_id?: string;
  status?: VagaStatus;
  search?: string;
}

export interface CandidatoFilters {
  search?: string;
  vaga_id?: string;
}

export interface ClienteFilters {
  search?: string;
  ativo?: boolean;
}

// Tipos para relatórios

export interface RelatorioPosicoesFechadas {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  resumo: {
    total_vagas: number;
    total_candidatos: number;
    total_aprovados: number;
    total_reprovados: number;
    total_desistiram: number;
    taxa_aprovacao_geral: number;
  };
  vagas_por_empresa: Array<{
    empresa: string;
    cnpj: string;
    vagas: Vaga[];
    total_candidatos: number;
    total_aprovados: number;
    taxa_aprovacao: number;
  }>;
  vagas_por_consultor: Array<{
    consultor: string;
    email: string;
    vagas: Vaga[];
    total_candidatos: number;
    total_aprovados: number;
    taxa_aprovacao: number;
  }>;
  vagas_detalhadas: Array<{
    id: string;
    numero_vaga: string;
    cargo: string;
    empresa: string;
    consultor: string;
    data_recebimento?: string;
    data_encerramento?: string;
    total_candidatos: number;
    aprovados: number;
    reprovados: number;
    desistiram: number;
    taxa_aprovacao: number;
  }>;
}

export interface RelatorioFinanceiro {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  resumo: {
    total_vagas: number;
    total_aprovados: number;
    total_faturamento: number;
    total_comissoes: number;
    total_empresa: number;
    media_por_vaga: number;
  };
  faturamento_por_empresa: Array<{
    empresa: string;
    cnpj: string;
    vagas: Vaga[];
    total_aprovados: number;
    total_faturamento: number;
    total_comissoes: number;
    total_empresa: number;
  }>;
  faturamento_por_consultor: Array<{
    consultor: string;
    email: string;
    vagas: Vaga[];
    total_aprovados: number;
    total_faturamento: number;
    total_comissoes: number;
  }>;
  vagas_detalhadas: Array<{
    id: string;
    numero_vaga: string;
    cargo: string;
    empresa: string;
    consultor: string;
    data_encerramento?: string;
    aprovados: number;
    valor_vaga: number;
    valor_total: number;
    comissao_consultor: number;
    valor_empresa: number;
    status_pagamento: string;
  }>;
}

// Tipos para estatísticas
export interface StatsVagas {
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

export interface StatsCandidatos {
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

// Tipos do Banco de Currículos
export type DisponibilidadeCandidato = 'disponivel' | 'empregado' | 'indisponivel';
export type CandidatoBancoStatus = 'ativo' | 'inativo';

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

export interface CreateBancoCurriculo {
  candidato_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  area_atuacao?: string;
  experiencia_anos?: number;
  formacao?: string;
  localizacao?: string;
  disponibilidade?: DisponibilidadeCandidato;
  avaliacao?: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status?: CandidatoBancoStatus;
  favorito?: boolean;
}

export interface UpdateBancoCurriculo {
  nome_arquivo?: string;
  url_storage?: string;
  tamanho_bytes?: number;
  tipo_arquivo?: string;
  area_atuacao?: string;
  experiencia_anos?: number;
  formacao?: string;
  localizacao?: string;
  disponibilidade?: DisponibilidadeCandidato;
  avaliacao?: number;
  observacoes?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  status?: CandidatoBancoStatus;
  favorito?: boolean;
}

export interface BancoCurriculoFilters {
  candidato_id?: string;
  area_atuacao?: string;
  disponibilidade?: DisponibilidadeCandidato;
  status?: CandidatoBancoStatus;
  favorito?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BancoCurriculoStats {
  total: number;
  disponiveis: number;
  empregados: number;
  indisponiveis: number;
  ativos: number;
  inativos: number;
  favoritos: number;
  adicionados_mes: number;
} 

// Tipos para questionário dinâmico de vagas
export type TipoPergunta = 'texto' | 'multipla_escolha' | 'escolha_unica' | 'numero' | 'data' | 'texto_longo';

export interface PerguntaQuestionario {
  id: string;
  pergunta: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  opcoes?: string[]; // Para perguntas de múltipla escolha ou escolha única
  ordem: number;
}

export interface QuestionarioVaga {
  id: string;
  vaga_id: string;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  perguntas: PerguntaQuestionario[];
  created_at: string;
  updated_at: string;
}

export type CreateQuestionarioVaga = Omit<QuestionarioVaga, 'id' | 'created_at' | 'updated_at'>;
export type UpdateQuestionarioVaga = Partial<Omit<QuestionarioVaga, 'id' | 'created_at' | 'updated_at'>>; 