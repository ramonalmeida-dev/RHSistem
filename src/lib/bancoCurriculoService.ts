import { supabase } from './supabase';
import { sanitizeFilename } from './utils';

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

/**
 * Faz upload de um currículo para o banco de currículos
 */
export async function uploadCurriculoToBanco(
  file: File,
  candidatoId: string,
  areaAtuacao?: string,
  experienciaAnos?: number,
  formacao?: string,
  localizacao?: string,
  observacoes?: string,
  linkedinUrl?: string,
  portfolioUrl?: string
): Promise<{ success: boolean; data?: BancoCurriculoWithCandidato; error?: string }> {
  try {
    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de arquivo não suportado. Use PDF, DOC ou DOCX.'
      };
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'Arquivo muito grande. Máximo 5MB permitido.'
      };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.name);
    const fileName = `${candidatoId}_${timestamp}_${sanitizedName}`;
    const filePath = `banco_curriculos/${fileName}`;

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('curriculos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        success: false,
        error: 'Erro ao fazer upload do arquivo.'
      };
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('curriculos')
      .getPublicUrl(filePath);

    // Salvar no banco de currículos
    const { data: curriculoData, error: dbError } = await supabase
      .from('banco_curriculos')
      .insert({
        candidato_id: candidatoId,
        nome_arquivo: file.name,
        url_storage: filePath,
        tamanho_bytes: file.size,
        tipo_arquivo: file.type,
        area_atuacao: areaAtuacao,
        experiencia_anos: experienciaAnos,
        formacao: formacao,
        localizacao: localizacao,
        observacoes: observacoes,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        disponibilidade: 'disponivel',
        status: 'ativo',
        favorito: false
      })
      .select(`
        *,
        candidato:candidatos(id, nome, email, telefone)
      `)
      .single();

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      return {
        success: false,
        error: 'Erro ao salvar currículo no banco.'
      };
    }

    return {
      success: true,
      data: curriculoData
    };

  } catch (error) {
    console.error('Erro no upload de currículo:', error);
    return {
      success: false,
      error: 'Erro interno no upload.'
    };
  }
}

/**
 * Busca currículos do banco com filtros
 */
export async function getBancoCurriculos(
  filters: BancoCurriculoFilters = {}
): Promise<{ 
  data: BancoCurriculoWithCandidato[]; 
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: string 
}> {
  try {
    const { 
      candidato_id, 
      area_atuacao, 
      disponibilidade, 
      status, 
      favorito, 
      search, 
      page = 1, 
      limit = 20 
    } = filters;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('banco_curriculos')
      .select(`
        *,
        candidato:candidatos(id, nome, email, telefone)
      `, { count: 'exact' });

    if (candidato_id) query = query.eq('candidato_id', candidato_id);
    if (area_atuacao) query = query.eq('area_atuacao', area_atuacao);
    if (disponibilidade) query = query.eq('disponibilidade', disponibilidade);
    if (status) query = query.eq('status', status);
    if (favorito !== undefined) query = query.eq('favorito', favorito);
    
    if (search) {
      query = query.or(`area_atuacao.ilike.%${search}%,formacao.ilike.%${search}%,candidato.nome.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar currículos:', error);
      return {
        data: [],
        error: 'Erro ao buscar currículos.'
      };
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    console.error('Erro ao buscar currículos:', error);
    return {
      data: [],
      error: 'Erro interno ao buscar currículos.'
    };
  }
}

/**
 * Busca um currículo específico do banco
 */
export async function getBancoCurriculo(
  id: string
): Promise<{ data?: BancoCurriculoWithCandidato; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('banco_curriculos')
      .select(`
        *,
        candidato:candidatos(id, nome, email, telefone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar currículo:', error);
      return {
        error: 'Erro ao buscar currículo.'
      };
    }

    return { data };

  } catch (error) {
    console.error('Erro ao buscar currículo:', error);
    return {
      error: 'Erro interno ao buscar currículo.'
    };
  }
}

/**
 * Atualiza um currículo do banco
 */
export async function updateBancoCurriculo(
  id: string,
  updates: UpdateBancoCurriculo
): Promise<{ data?: BancoCurriculoWithCandidato; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('banco_curriculos')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        candidato:candidatos(id, nome, email, telefone)
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar currículo:', error);
      return {
        error: 'Erro ao atualizar currículo.'
      };
    }

    return { data };

  } catch (error) {
    console.error('Erro ao atualizar currículo:', error);
    return {
      error: 'Erro interno ao atualizar currículo.'
    };
  }
}

/**
 * Remove um currículo do banco
 */
export async function deleteBancoCurriculo(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Primeiro buscar o currículo para obter o caminho do arquivo
    const { data: curriculo, error: fetchError } = await supabase
      .from('banco_curriculos')
      .select('url_storage')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar currículo:', fetchError);
      return {
        success: false,
        error: 'Erro ao buscar currículo.'
      };
    }

    // Remover do storage
    if (curriculo?.url_storage) {
      const { error: storageError } = await supabase.storage
        .from('curriculos')
        .remove([curriculo.url_storage]);

      if (storageError) {
        console.error('Erro ao remover do storage:', storageError);
        // Continua mesmo se falhar no storage
      }
    }

    // Remover do banco
    const { error: dbError } = await supabase
      .from('banco_curriculos')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Erro ao remover do banco:', dbError);
      return {
        success: false,
        error: 'Erro ao remover currículo do banco.'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Erro ao deletar currículo:', error);
    return {
      success: false,
      error: 'Erro interno ao deletar currículo.'
    };
  }
}

/**
 * Obtém estatísticas do banco de currículos
 */
export async function getBancoCurriculoStats(): Promise<{ 
  data?: BancoCurriculoStats; 
  error?: string 
}> {
  try {
    // Total geral
    const { count: total } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true });

    // Por disponibilidade
    const { count: disponiveis } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true })
      .eq('disponibilidade', 'disponivel');

    const { count: empregados } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true })
      .eq('disponibilidade', 'empregado');

    const { count: indisponiveis } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true })
      .eq('disponibilidade', 'indisponivel');

    // Por status
    const { count: ativos } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo');

    const { count: inativos } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inativo');

    // Favoritos
    const { count: favoritos } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true })
      .eq('favorito', true);

    // Adicionados este mês
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: adicionados_mes } = await supabase
      .from('banco_curriculos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes.toISOString());

    return {
      data: {
        total: total || 0,
        disponiveis: disponiveis || 0,
        empregados: empregados || 0,
        indisponiveis: indisponiveis || 0,
        ativos: ativos || 0,
        inativos: inativos || 0,
        favoritos: favoritos || 0,
        adicionados_mes: adicionados_mes || 0
      }
    };

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      error: 'Erro interno ao buscar estatísticas.'
    };
  }
}

/**
 * Obtém a URL de download de um currículo
 */
export function getBancoCurriculoDownloadUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('curriculos')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Formata o tamanho do arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtém o ícone baseado no tipo de arquivo
 */
export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '��';
  return '📎';
} 