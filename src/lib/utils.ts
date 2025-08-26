import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
