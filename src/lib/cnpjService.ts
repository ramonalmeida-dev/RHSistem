// Interface para os dados retornados pela BrasilAPI
interface BrasilAPICNPJResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  uf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  email?: string;
  ddd_telefone_1?: string;
  natureza_juridica: string;
  data_inicio_atividade: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
}

// Interface para o retorno formatado
export interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  uf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  email?: string;
  telefone?: string;
  natureza_juridica: string;
  data_inicio_atividade: string;
  situacao: string;
}

export class CNPJService {
  static async buscarCNPJ(cnpj: string): Promise<CNPJData> {
    // Limpar CNPJ (remover pontos, traços e barras)
    const cnpjClean = cnpj.replace(/[^\d]/g, '');

    if (cnpjClean.length !== 14) {
      throw new Error('CNPJ deve ter 14 dígitos');
    }

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CNPJ não encontrado');
        }
        throw new Error('Erro ao buscar CNPJ');
      }

      const data: BrasilAPICNPJResponse = await response.json();

      // Verificar se a empresa está ativa
      if (data.situacao_cadastral !== 2) {
        throw new Error('CNPJ não está ativo');
      }

      // Formatar dados para o formato esperado pelo frontend
      const formattedData: CNPJData = {
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        uf: data.uf,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.municipio,
        estado: data.uf,
        email: data.email,
        telefone: data.ddd_telefone_1 ? `${data.ddd_telefone_1}` : undefined,
        natureza_juridica: data.natureza_juridica,
        data_inicio_atividade: data.data_inicio_atividade,
        situacao: data.descricao_situacao_cadastral
      };

      return formattedData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro interno ao buscar CNPJ');
    }
  }
} 