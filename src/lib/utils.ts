import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valida se o nome do arquivo é válido e seguro
 * @param filename - Nome original do arquivo
 * @returns Objeto com validação e mensagens de erro
 */
export function validateFilename(filename: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!filename || filename.trim().length === 0) {
    errors.push("Nome do arquivo não pode estar vazio");
  }
  
  if (filename.length > 255) {
    errors.push("Nome do arquivo muito longo (máximo 255 caracteres)");
  }
  
  // Verificar caracteres perigosos
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) {
    errors.push("Nome do arquivo contém caracteres inválidos");
  }
  
  // Verificar se termina com ponto ou espaço
  if (filename.endsWith('.') || filename.endsWith(' ')) {
    errors.push("Nome do arquivo não pode terminar com ponto ou espaço");
  }
  
  // Verificar se começa com ponto
  if (filename.startsWith('.')) {
    errors.push("Nome do arquivo não pode começar com ponto");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitiza o nome de um arquivo removendo caracteres especiais e espaços
 * @param filename - Nome original do arquivo
 * @returns Nome sanitizado seguro para storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove a extensão do arquivo
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  
  // Remove acentos e caracteres especiais
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove caracteres especiais exceto hífen
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, '') // Remove underscores no início e fim
    .toLowerCase(); // Converte para minúsculas
  
  // Se o nome ficou vazio, usar 'arquivo'
  const sanitizedName = normalized || 'arquivo';
  
  return sanitizedName + extension;
}

/**
 * Valida e processa um arquivo para upload
 * @param file - Arquivo a ser validado
 * @param options - Opções de validação
 * @returns Objeto com validação e arquivo processado
 */
export function validateAndProcessFile(
  file: File, 
  options: {
    maxSize?: number; // em bytes
    allowedTypes?: string[];
    requireSanitization?: boolean;
  } = {}
): { 
  isValid: boolean; 
  errors: string[]; 
  processedFile?: File;
  sanitizedName?: string;
} {
  const errors: string[] = [];
  const {
    maxSize = 5 * 1024 * 1024, // 5MB padrão
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    requireSanitization = true
  } = options;

  // Validar se o arquivo existe
  if (!file) {
    errors.push("Nenhum arquivo selecionado");
    return { isValid: false, errors };
  }

  // Validar nome do arquivo
  const filenameValidation = validateFilename(file.name);
  if (!filenameValidation.isValid) {
    errors.push(...filenameValidation.errors);
  }

  // Validar tipo de arquivo
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes.join(', ')}`);
  }

  // Validar tamanho
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    errors.push(`Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB`);
  }

  // Se há erros, retornar sem processar
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Processar nome do arquivo se necessário
  let sanitizedName: string | undefined;
  let processedFile = file;

  if (requireSanitization && filenameValidation.isValid) {
    sanitizedName = sanitizeFilename(file.name);
    
    // Criar novo arquivo com nome sanitizado se necessário
    if (sanitizedName !== file.name) {
      processedFile = new File([file], sanitizedName, {
        type: file.type,
        lastModified: file.lastModified
      });
    }
  }

  return {
    isValid: true,
    errors: [],
    processedFile,
    sanitizedName
  };
}
