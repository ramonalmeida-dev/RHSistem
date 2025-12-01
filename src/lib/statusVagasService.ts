import { supabase } from './supabase';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CandidatoStatusVaga {
  id: string;
  nome: string;
  codigo: string; // Código do candidato (ex: LRFR2013_08)
  data_envio: string;
  status: 'AGUARDANDO' | 'EM_ENTREVISTA' | 'FASE_FINAL' | 'APROVADO' | 'NAO_APROVADO' | 'DESISTIU' | 'ADMITIDO' | 'SUSPENSA' | 'CANCELADA';
  data_status: string; // Data específica do status atual
  dias_no_status: number; // Dias desde a mudança para este status
  data_entrevista?: string;
  hora_entrevista?: string;
}

export interface VagaStatusRelatorio {
  id: string;
  numero_vaga: string;
  empresa_nome: string;
  cargo: string;
  consultor_nome: string; // Novo campo
  salario?: string; // Novo campo
  status: 'publicada' | 'em_analise' | 'pausada' | 'encerrada'; // Status da vaga
  data_inicio: string;
  data_primeira_remessa: string;
  dias_processo: number;
  total_candidatos_enviados: number;
  candidatos: CandidatoStatusVaga[];
}

export interface StatusVagasRelatorio {
  data_relatorio: string;
  data_emissao: string; // Novo campo para cabeçalho
  empresa_nome: string;
  vagas: VagaStatusRelatorio[];
}

export interface StatusVagasFilters {
  empresa_id?: string;
  consultor_id?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: string[];
}

export class StatusVagasService {
  static async list(filters?: StatusVagasFilters): Promise<VagaStatusRelatorio[]> {
    try {
      // Query para buscar vagas com candidatos reais do kanban
      let query = supabase
        .from('vagas')
        .select(`
          id,
          numero_vaga,
          cargo,
          salario,
          status,
          data_inicio_selecao,
          data_envio_curriculos,
          empresa:clientes(id, razao_social),
          consultor:usuarios(id, nome)
        `)
        .in('status', ['publicada', 'em_analise', 'pausada', 'encerrada']);

      // Aplicar filtros apenas se não forem "todas" ou "todos"
      if (filters?.empresa_id && filters.empresa_id !== 'todas') {
        query = query.eq('empresa_id', filters.empresa_id);
      }

      if (filters?.consultor_id && filters.consultor_id !== 'todos') {
        query = query.eq('consultor_id', filters.consultor_id);
      }

      if (filters?.data_inicio) {
        query = query.gte('data_inicio_selecao', filters.data_inicio);
      }

      if (filters?.data_fim) {
        query = query.lte('data_inicio_selecao', filters.data_fim);
      }

      const { data: vagasData, error } = await query;

      if (error) {
        throw new Error(`Erro na consulta: ${error.message}`);
      }

      if (!vagasData || vagasData.length === 0) {
        return [];
      }

      // Para cada vaga, buscar candidatos reais do kanban
      const vagasComCandidatos = await Promise.all(
        vagasData.map(async (vaga) => {
          try {
            // Buscar candidatos do kanban para esta vaga com JOIN na tabela candidatos
            const { data: candidatosData, error: candidatosError } = await supabase
              .from('candidatos_vagas')
              .select(`
                id,
                candidato_id,
                status_atual,
                data_candidatura,
                observacoes,
                candidatos(nome)
              `)
              .eq('vaga_id', vaga.id);

            if (candidatosError) {
              console.error('Erro ao buscar candidatos:', candidatosError);
            }

            // Formatar candidatos com busca de histórico de status
            const candidatos: CandidatoStatusVaga[] = await Promise.all(
              (candidatosData || []).map(async (cv: any) => {
                const statusInfo = await StatusVagasService.getStatusInfo(cv.id, cv.status_atual);
                return {
                  id: cv.id,
                  nome: cv.candidatos?.nome || `Candidato ${cv.candidato_id?.slice(0, 8) || 'N/A'}`,
                  codigo: StatusVagasService.generateCandidateCode(cv.data_candidatura, cv.id),
                  data_envio: cv.data_candidatura || new Date().toISOString(),
                  status: StatusVagasService.mapStatusToRelatorio(cv.status_atual),
                  data_status: statusInfo.data_status,
                  dias_no_status: statusInfo.dias_no_status,
                  data_entrevista: StatusVagasService.extractDateFromObservacoes(cv.observacoes),
                  hora_entrevista: StatusVagasService.extractTimeFromObservacoes(cv.observacoes)
                };
              })
            );

            const dataInicio = vaga.data_inicio_selecao || vaga.data_envio_curriculos || new Date().toISOString();
            const dataPrimeiraRemessa = vaga.data_envio_curriculos || vaga.data_inicio_selecao || new Date().toISOString();
            let diasProcesso = 0;
            if (dataInicio) {
              try {
                const date = parseISO(dataInicio);
                if (!isNaN(date.getTime())) {
                  diasProcesso = differenceInDays(new Date(), date);
                }
              } catch (error) {
                console.error('Erro ao calcular dias do processo:', error);
                diasProcesso = 0;
              }
            }

            return {
              id: vaga.id,
              numero_vaga: vaga.numero_vaga,
              empresa_nome: (vaga.empresa as any)?.razao_social || 'N/A',
              cargo: vaga.cargo,
              consultor_nome: (vaga.consultor as any)?.nome || 'N/A',
              salario: (vaga as any).salario,
              status: (vaga as any).status || 'publicada',
              data_inicio: dataInicio,
              data_primeira_remessa: dataPrimeiraRemessa,
              dias_processo: diasProcesso,
              total_candidatos_enviados: candidatos.length,
              candidatos: candidatos
            };
          } catch (error) {
            console.error('Erro ao processar vaga:', error);
            // Em caso de erro, retornar vaga sem candidatos
            const dataInicio = vaga.data_inicio_selecao || vaga.data_envio_curriculos || new Date().toISOString();
            const dataPrimeiraRemessa = vaga.data_envio_curriculos || vaga.data_inicio_selecao || new Date().toISOString();
            let diasProcesso = 0;
            if (dataInicio) {
              try {
                const date = parseISO(dataInicio);
                if (!isNaN(date.getTime())) {
                  diasProcesso = differenceInDays(new Date(), date);
                }
              } catch (error) {
                console.error('Erro ao calcular dias do processo (catch):', error);
                diasProcesso = 0;
              }
            }

            return {
              id: vaga.id,
              numero_vaga: vaga.numero_vaga,
              empresa_nome: (vaga.empresa as any)?.razao_social || 'N/A',
              cargo: vaga.cargo,
              consultor_nome: (vaga.consultor as any)?.nome || 'N/A',
              salario: (vaga as any).salario,
              status: (vaga as any).status || 'publicada',
              data_inicio: dataInicio,
              data_primeira_remessa: dataPrimeiraRemessa,
              dias_processo: diasProcesso,
              total_candidatos_enviados: 0,
              candidatos: []
            };
          }
        })
      );

      return vagasComCandidatos;
      
    } catch (error) {
      throw error;
    }
  }

  private static async getStatusInfo(candidatoVagaId: string, statusAtual: string): Promise<{data_status: string, dias_no_status: number}> {
    try {
      // Buscar o último registro de mudança de status para este status atual
      const { data: historico, error } = await supabase
        .from('historico_status')
        .select('created_at')
        .eq('candidato_vaga_id', candidatoVagaId)
        .eq('status_novo', statusAtual)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar histórico de status:', error);
      }

      let dataStatus: string;
      if (historico && historico.length > 0) {
        dataStatus = historico[0].created_at;
      } else {
        // Se não há histórico, usar data de candidatura ou data atual
        const { data: candidatoVaga } = await supabase
          .from('candidatos_vagas')
          .select('data_candidatura')
          .eq('id', candidatoVagaId)
          .single();
        
        dataStatus = candidatoVaga?.data_candidatura || new Date().toISOString();
      }

      let diasNoStatus = 0;
      try {
        const date = parseISO(dataStatus);
        if (!isNaN(date.getTime())) {
          diasNoStatus = differenceInDays(new Date(), date);
        }
      } catch (error) {
        console.error('Erro ao calcular dias no status:', error);
        diasNoStatus = 0;
      }
      
      return {
        data_status: dataStatus,
        dias_no_status: Math.max(0, diasNoStatus)
      };
    } catch (error) {
      console.error('Erro ao obter informações de status:', error);
      return {
        data_status: new Date().toISOString(),
        dias_no_status: 0
      };
    }
  }

  private static mapStatusToRelatorio(status: string): CandidatoStatusVaga['status'] {
    if (!status) return 'AGUARDANDO';
    
    const statusMap: Record<string, CandidatoStatusVaga['status']> = {
      'selecionando': 'AGUARDANDO',
      'curriculo_enviado': 'AGUARDANDO', 
      'entrevista_agendada': 'EM_ENTREVISTA',
      'entrevista_realizada': 'FASE_FINAL',
      'aprovado': 'APROVADO',
      'reprovado': 'NAO_APROVADO',
      'desistiu': 'DESISTIU'
    };

    return statusMap[status] || 'AGUARDANDO';
  }

  private static extractDateFromObservacoes(observacoes?: string): string | undefined {
    if (!observacoes) return undefined;
    
    try {
      // Procura por padrões de data (dd/mm, dd/mm/yyyy, etc.)
      const dateMatch = observacoes.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        return `${day}/${month}`;
      }
    } catch (error) {
      console.error('Erro ao extrair data das observações:', error);
    }
    
    return undefined;
  }

  private static extractTimeFromObservacoes(observacoes?: string): string | undefined {
    if (!observacoes) return undefined;
    
    try {
      // Procura por padrões de hora (HH:MM, HHhMM, etc.)
      const timeMatch = observacoes.match(/(\d{1,2})[h:](\d{2})/i);
      if (timeMatch) {
        const hour = timeMatch[1].padStart(2, '0');
        const minute = timeMatch[2];
        return `${hour}:${minute}`;
      }
    } catch (error) {
      console.error('Erro ao extrair hora das observações:', error);
    }
    
    return undefined;
  }

  static async generateHTMLContent(vagasEspecificas?: VagaStatusRelatorio[]): Promise<string> {
    const vagas = vagasEspecificas || await StatusVagasService.list();
    if (!vagas || vagas.length === 0) {
      throw new Error('Nenhuma vaga encontrada para gerar relatório');
    }

    // Verificar se vagas é um array
    if (!Array.isArray(vagas)) {
      console.error('Vagas não é um array:', vagas);
      throw new Error('Formato de dados inválido');
    }

    // Agrupar vagas por empresa
    const vagasPorEmpresa = vagas.reduce((acc, vaga) => {
      const empresa = vaga.empresa_nome;
      if (!acc[empresa]) {
        acc[empresa] = [];
      }
      acc[empresa].push(vaga);
      return acc;
    }, {} as Record<string, VagaStatusRelatorio[]>);

    // Criar HTML para o relatório
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px;
            }
            .title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .date { 
              font-size: 14px; 
              margin-bottom: 20px;
            }
            .emission-date {
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
            .intro { 
              margin-bottom: 30px; 
              text-align: justify;
            }
            .company-section { 
              margin-bottom: 40px; 
              page-break-inside: avoid;
            }
            .company-title { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 10px;
              color: #2c3e50;
            }
            .vaga-info {
              background-color: #f8f9fa;
              padding: 12px;
              margin-bottom: 15px;
              border-radius: 6px;
              border-left: 4px solid #2c3e50;
            }
            .vaga-item {
              font-size: 12px;
              color: #333;
              margin-bottom: 6px;
              line-height: 1.8;
              display: flex;
              align-items: center;
            }
            .vaga-item:last-child {
              margin-bottom: 0;
            }
            .vaga-numero {
              font-weight: bold;
              color: #2c3e50;
              min-width: 70px;
              display: inline-block;
            }
            .vaga-cargo {
              color: #555;
              flex: 1;
            }
            .status-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 4px 10px 10px 10px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
              margin-left: 8px;
              text-transform: uppercase;
              line-height: 1;
              vertical-align: middle;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              font-size: 9px;
            }
            th { 
              background-color: #34495e; 
              color: white; 
              padding: 6px 4px; 
              text-align: center; 
              border: 1px solid #ddd;
              font-weight: bold;
              vertical-align: middle;
              font-size: 8px;
            }
            td { 
              padding: 6px 8px; 
              border: 1px solid #ddd; 
              vertical-align: middle;
              text-align: center;
              font-size: 9px;
              line-height: 1.2;
            }
            .status-nao-aprovado { background-color: #ffebee; color: #c62828; font-weight: bold; }
            .status-aprovado { background-color: #e8f5e8; color: #2e7d32; font-weight: bold; }
            .status-aguardando { background-color: #fff3e0; color: #f57c00; font-weight: bold; }
            .status-desistiu { background-color: #e3f2fd; color: #1565c0; font-weight: bold; }
            .status-em-entrevista { background-color: #f3e5f5; color: #7b1fa2; font-weight: bold; }
            .status-fase-final { background-color: #e8eaf6; color: #3f51b5; font-weight: bold; }
            .status-admitido { background-color: #e0f2f1; color: #00695c; font-weight: bold; }
            .status-suspensa { background-color: #fce4ec; color: #e91e63; font-weight: bold; }
            .status-cancelada { background-color: #f5f5f5; color: #424242; font-weight: bold; }
            .vaga-status-publicada { background-color: #e8f5e8; color: #2e7d32; font-weight: bold; }
            .vaga-status-em-analise { background-color: #e3f2fd; color: #1565c0; font-weight: bold; }
            .vaga-status-pausada { background-color: #fff3e0; color: #f57c00; font-weight: bold; }
            .vaga-status-encerrada { background-color: #f5f5f5; color: #424242; font-weight: bold; }
            .vaga-row { background-color: #f8f9fa; font-weight: bold; }
            .candidato-row { background-color: white; }
            .empty-cell { color: #999; font-style: italic; text-align: center; }
            .candidato-nome { text-align: center; font-weight: 500; }
            .status-cell { text-align: center; font-weight: bold; }
            .empresa-col { width: 11%; text-align: center; }
            .cargo-col { width: 13%; text-align: center; }
            .status-vaga-col { width: 8%; text-align: center; }
            .consultor-col { width: 9%; text-align: center; }
            .salario-col { width: 7%; text-align: center; }
            .vaga-col { width: 5%; text-align: center; }
            .data-col { width: 6%; text-align: center; }
            .dias-col { width: 4%; text-align: center; }
            .num-enviados-col { width: 5%; text-align: center; }
            .candidato-col { width: 11%; text-align: center; }
            .status-col { width: 7%; text-align: center; }
            .data-status-col { width: 6%; text-align: center; }
            .dias-status-col { width: 4%; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">RELATÓRIO DE STATUS DE VAGAS</div>
            <div class="date">Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
            <div class="intro">
              Relatório detalhado do status dos processos seletivos em andamento, 
              incluindo informações sobre candidatos, consultores responsáveis e tempo de permanência em cada etapa.
            </div>
          </div>
      `;

      // Para cada empresa
      Object.entries(vagasPorEmpresa).forEach(([empresa, vagasEmpresa]) => {
        htmlContent += `
          <div class="company-section">
            <div class="company-title">STATUS DE VAGAS – ${empresa}</div>
            <div class="vaga-info">
        `;
        
        // Adicionar informações de status para cada vaga
        vagasEmpresa.forEach((vaga, index) => {
          const statusLabel = StatusVagasService.getVagaStatusLabel(vaga.status);
          const statusClass = StatusVagasService.getVagaStatusClass(vaga.status);
          htmlContent += `
              <div class="vaga-item">
                <span class="vaga-numero">Vaga #${vaga.numero_vaga}</span>
                <span class="vaga-cargo">${vaga.cargo}</span>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
              </div>
          `;
        });
        
        htmlContent += `
            </div>
            <table>
              <thead>
                <tr>
                  <th rowspan="2" class="empresa-col">EMPRESA</th>
                  <th rowspan="2" class="cargo-col">CARGO</th>
                  <th rowspan="2" class="consultor-col">CONSULTOR</th>
                  <th rowspan="2" class="salario-col">SALÁRIO</th>
                  <th colspan="4">DURAÇÃO DO PROCESSO</th>
                  <th colspan="4">CANDIDATOS ENVIADOS</th>
                </tr>
                <tr>
                  <th class="vaga-col">Nº VAGA</th>
                  <th class="data-col">INÍCIO</th>
                  <th class="data-col">REMESSA</th>
                  <th class="dias-col">Nº DIAS</th>
                  <th class="num-enviados-col">Nº ENVIADOS</th>
                  <th class="candidato-col">CANDIDATO</th>
                  <th class="status-col">STATUS</th>
                  <th class="data-status-col">DATA STATUS</th>
                  <th class="dias-status-col">DIAS STATUS</th>
                </tr>
              </thead>
              <tbody>
        `;

        // Para cada vaga da empresa
        vagasEmpresa.forEach((vaga) => {
          if (vaga.candidatos && vaga.candidatos.length > 0) {
            // Para cada candidato, criar uma linha
            vaga.candidatos.forEach((candidato, index) => {
              const isFirstRow = index === 0;
              const statusClass = StatusVagasService.getStatusClass(candidato.status);
              
              htmlContent += `
                <tr class="${isFirstRow ? 'vaga-row' : 'candidato-row'}">
                  <td class="empresa-col">${isFirstRow ? empresa : ''}</td>
                  <td class="cargo-col">${isFirstRow ? vaga.cargo : ''}</td>
                  <td class="consultor-col">${isFirstRow ? vaga.consultor_nome : ''}</td>
                  <td class="salario-col">${isFirstRow ? (vaga.salario || '-') : ''}</td>
                  <td class="vaga-col">${isFirstRow ? vaga.numero_vaga : ''}</td>
                  <td class="data-col">${isFirstRow ? StatusVagasService.formatDate(vaga.data_inicio) : ''}</td>
                  <td class="data-col">${isFirstRow ? StatusVagasService.formatDate(vaga.data_primeira_remessa) : ''}</td>
                  <td class="dias-col">${isFirstRow ? vaga.dias_processo : ''}</td>
                  <td class="num-enviados-col">${isFirstRow ? vaga.total_candidatos_enviados : ''}</td>
                  <td class="candidato-col candidato-nome">${candidato.nome}</td>
                  <td class="status-col status-cell ${statusClass}">${candidato.status}</td>
                  <td class="data-status-col">${StatusVagasService.formatDate(candidato.data_status)}</td>
                  <td class="dias-status-col">${candidato.dias_no_status}</td>
                </tr>
              `;
            });
          } else {
            // Se não há candidatos, mostrar linha vazia para a vaga
            htmlContent += `
              <tr class="vaga-row">
                <td class="empresa-col">${empresa}</td>
                <td class="cargo-col">${vaga.cargo}</td>
                <td class="consultor-col">${vaga.consultor_nome}</td>
                <td class="salario-col">${vaga.salario || '-'}</td>
                <td class="vaga-col">${vaga.numero_vaga}</td>
                <td class="data-col">${StatusVagasService.formatDate(vaga.data_inicio)}</td>
                <td class="data-col">${StatusVagasService.formatDate(vaga.data_primeira_remessa)}</td>
                <td class="dias-col">${vaga.dias_processo}</td>
                <td class="num-enviados-col">${vaga.total_candidatos_enviados}</td>
                <td class="candidato-col empty-cell">Nenhum candidato</td>
                <td class="status-col"></td>
                <td class="data-status-col"></td>
                <td class="dias-status-col"></td>
              </tr>
            `;
          }
        });

        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      });

      htmlContent += `
        </body>
        </html>
      `;

    return htmlContent;
  }

  static async exportToPDF(vagasEspecificas?: VagaStatusRelatorio[]): Promise<void> {
    try {
      // Importar html2pdf dinamicamente
      const html2pdf = (await import('html2pdf.js')).default;

      // Gerar HTML
      const htmlContent = await this.generateHTMLContent(vagasEspecificas);

      // Criar elemento temporário para o HTML
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      document.body.appendChild(element);

      // Configurações do html2pdf
      const opt = {
        margin: [10, 10, 10, 10],
        filename: 'status-vagas.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      // Gerar PDF
      await html2pdf().set(opt).from(element).save();

      // Remover elemento temporário
      document.body.removeChild(element);

    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      throw error;
    }
  }

  // Funções auxiliares
  static getStatusClass(status: string): string {
    switch (status) {
      case 'NAO_APROVADO': return 'status-nao-aprovado';
      case 'APROVADO': return 'status-aprovado';
      case 'AGUARDANDO': return 'status-aguardando';
      case 'DESISTIU': return 'status-desistiu';
      case 'EM_ENTREVISTA': return 'status-em-entrevista';
      case 'FASE_FINAL': return 'status-fase-final';
      case 'ADMITIDO': return 'status-admitido';
      case 'SUSPENSA': return 'status-suspensa';
      case 'CANCELADA': return 'status-cancelada';
      default: return '';
    }
  }

  static getVagaStatusLabel(status: string): string {
    switch (status) {
      case 'publicada': return 'Publicada';
      case 'em_analise': return 'Em Análise';
      case 'pausada': return 'Pausada';
      case 'encerrada': return 'Encerrada';
      default: return status;
    }
  }

  static getVagaStatusClass(status: string): string {
    switch (status) {
      case 'publicada': return 'vaga-status-publicada';
      case 'em_analise': return 'vaga-status-em-analise';
      case 'pausada': return 'vaga-status-pausada';
      case 'encerrada': return 'vaga-status-encerrada';
      default: return '';
    }
  }

  static formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return format(date, 'dd/MM/yyyy');
    } catch {
      return 'Data inválida';
    }
  }

  static formatEntrevista(dataEntrevista?: string, horaEntrevista?: string): string {
    if (!dataEntrevista) return '';
    try {
      const date = parseISO(dataEntrevista);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      const data = format(date, 'dd/MMM');
      return horaEntrevista ? `${data} - ${horaEntrevista}` : data;
    } catch {
      return 'Data inválida';
    }
  }

  static async getEmpresas(): Promise<Array<{id: string, razao_social: string}>> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, razao_social')
        .eq('ativo', true)
        .order('razao_social');

      if (error) {
        console.error('Erro ao buscar empresas:', error);
        throw new Error(`Erro ao buscar empresas: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      throw error;
    }
  }

  static async getConsultores(): Promise<Array<{id: string, nome: string}>> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar consultores:', error);
        throw new Error(`Erro ao buscar consultores: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar consultores:', error);
      throw error;
    }
  }

  // Função para gerar código do candidato no formato LRFR2013_08
  private static generateCandidateCode(dataEnvio: string, candidatoId: string): string {
    try {
      if (!dataEnvio || !candidatoId) {
        return `CAND${candidatoId?.slice(-4) || '0000'}`;
      }
      
      const data = parseISO(dataEnvio);
      if (isNaN(data.getTime())) {
        return `CAND${candidatoId?.slice(-4) || '0000'}`;
      }
      const mes = format(data, 'MM');
      const ano = format(data, 'yy');
      const id = candidatoId.slice(-4).toUpperCase();
      return `${id}${ano}_${mes}`;
    } catch (error) {
      console.error('Erro ao gerar código do candidato:', error);
      return `CAND${candidatoId?.slice(-4) || '0000'}`;
    }
  }
}
