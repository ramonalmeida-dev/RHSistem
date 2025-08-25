import { supabase } from './supabase';

export interface CurriculoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  filePath?: string;
}

export interface CurriculoInfo {
  id: string;
  candidato_id: string;
  vaga_id: string;
  nome_arquivo: string;
  url_storage: string;
  tamanho_bytes: number;
  tipo_arquivo?: string;
  created_at: string;
}

/**
 * Faz upload de um currículo para o Supabase Storage
 */
export async function uploadCurriculo(
  file: File,
  candidatoId: string,
  vagaId: string
): Promise<CurriculoUploadResult> {
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
    const fileName = `${candidatoId}_${timestamp}_${file.name}`;
    const filePath = `curriculos/${vagaId}/${fileName}`;

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

    return {
      success: true,
      url: urlData.publicUrl,
      filePath: filePath
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
 * Salva a referência do currículo no banco de dados
 */
export async function saveCurriculoReference(
  candidatoId: string,
  vagaId: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  fileType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('curriculos')
      .insert({
        candidato_id: candidatoId,
        vaga_id: vagaId,
        nome_arquivo: fileName,
        url_storage: filePath,
        tamanho_bytes: fileSize,
        tipo_arquivo: fileType
      });

    if (error) {
      console.error('Erro ao salvar referência:', error);
      return {
        success: false,
        error: 'Erro ao salvar referência do currículo.'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Erro ao salvar referência do currículo:', error);
    return {
      success: false,
      error: 'Erro interno ao salvar referência.'
    };
  }
}

/**
 * Salva referência do currículo no banco de currículos (sem vaga)
 */
export async function saveCurriculoReferenceBanco(
  candidatoId: string,
  curriculoId: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  fileType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('banco_curriculos')
      .update({
        nome_arquivo: fileName,
        url_storage: filePath,
        tamanho_bytes: fileSize,
        tipo_arquivo: fileType
      })
      .eq('id', curriculoId);

    if (error) {
      console.error('Erro ao atualizar referência no banco:', error);
      return {
        success: false,
        error: 'Erro ao atualizar referência do currículo.'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Erro ao atualizar referência do currículo:', error);
    return {
      success: false,
      error: 'Erro interno ao atualizar referência.'
    };
  }
}

/**
 * Obtém todos os currículos de um candidato
 */
export async function getCurriculosByCandidato(
  candidatoId: string
): Promise<{ data: CurriculoInfo[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('curriculos')
      .select('*')
      .eq('candidato_id', candidatoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar currículos:', error);
      return {
        data: [],
        error: 'Erro ao buscar currículos.'
      };
    }

    return { data: data || [] };

  } catch (error) {
    console.error('Erro ao buscar currículos:', error);
    return {
      data: [],
      error: 'Erro interno ao buscar currículos.'
    };
  }
}

/**
 * Obtém todos os currículos de uma vaga
 */
export async function getCurriculosByVaga(
  vagaId: string
): Promise<{ data: CurriculoInfo[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('curriculos')
      .select(`
        *,
        candidato:candidatos(nome, email)
      `)
      .eq('vaga_id', vagaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar currículos da vaga:', error);
      return {
        data: [],
        error: 'Erro ao buscar currículos da vaga.'
      };
    }

    return { data: data || [] };

  } catch (error) {
    console.error('Erro ao buscar currículos da vaga:', error);
    return {
      data: [],
      error: 'Erro interno ao buscar currículos da vaga.'
    };
  }
}

/**
 * Remove um currículo do storage e do banco
 */
export async function deleteCurriculo(
  curriculoId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remover do storage
    const { error: storageError } = await supabase.storage
      .from('curriculos')
      .remove([filePath]);

    if (storageError) {
      console.error('Erro ao remover do storage:', storageError);
      return {
        success: false,
        error: 'Erro ao remover arquivo do storage.'
      };
    }

    // Remover do banco
    const { error: dbError } = await supabase
      .from('curriculos')
      .delete()
      .eq('id', curriculoId);

    if (dbError) {
      console.error('Erro ao remover do banco:', dbError);
      return {
        success: false,
        error: 'Erro ao remover referência do banco.'
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
 * Obtém a URL de download de um currículo
 */
export function getCurriculoDownloadUrl(filePath: string): string {
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