import { useAuth } from "@/contexts/AuthContext";

export const usePermissions = () => {
  const { temPermissao, temRole, temNivelAcesso, usuario, permissoes } = useAuth();

  return {
    // Verificações básicas
    temPermissao,
    temRole,
    temNivelAcesso,
    
    // Informações do usuário
    usuario,
    permissoes,
    
    // Verificações específicas por módulo
    podeVerVagas: () => temPermissao('vagas_visualizar'),
    podeCriarVagas: () => temPermissao('vagas_criar'),
    podeEditarVagas: () => temPermissao('vagas_editar'),
    podeExcluirVagas: () => temPermissao('vagas_excluir'),
    podeGerenciarTodasVagas: () => temPermissao('vagas_gerenciar_todas'),
    
    podeVerCandidatos: () => temPermissao('candidatos_visualizar'),
    podeCriarCandidatos: () => temPermissao('candidatos_criar'),
    podeEditarCandidatos: () => temPermissao('candidatos_editar'),
    podeExcluirCandidatos: () => temPermissao('candidatos_excluir'),
    podeGerenciarTodosCandidatos: () => temPermissao('candidatos_gerenciar_todos'),
    
    podeVerClientes: () => temPermissao('clientes_visualizar'),
    podeCriarClientes: () => temPermissao('clientes_criar'),
    podeEditarClientes: () => temPermissao('clientes_editar'),
    podeExcluirClientes: () => temPermissao('clientes_excluir'),
    
    podeVerPosicoesFechadas: () => temPermissao('posicoes_fechadas_visualizar'),
    podeGerenciarPosicoesFechadas: () => temPermissao('posicoes_fechadas_gerenciar'),
    podeContratar: () => temPermissao('posicoes_fechadas_contratar'),
    podeVerTodasPosicoesFechadas: () => temPermissao('posicoes_fechadas_todas'),
    
    podeVerRelatorios: () => temPermissao('relatorios_visualizar'),
    podeVerRelatoriosFinanceiros: () => temPermissao('relatorios_financeiro'),
    podeVerRelatoriosExecutivos: () => temPermissao('relatorios_executivo'),
    
    podeVerUsuarios: () => temPermissao('usuarios_visualizar'),
    podeCriarUsuarios: () => temPermissao('usuarios_criar'),
    podeEditarUsuarios: () => temPermissao('usuarios_editar'),
    podeExcluirUsuarios: () => temPermissao('usuarios_excluir'),
    podeGerenciarRoles: () => temPermissao('usuarios_gerenciar_roles'),
    
    podeAcessarConfiguracoes: () => temPermissao('sistema_configuracoes'),
    podeAcessarBackup: () => temPermissao('sistema_backup'),
    podeVerLogs: () => temPermissao('sistema_logs'),
    
    // Verificações de role
    isConsultor: () => temRole('consultor'),
    isCoordenador: () => temRole('coordenador'),
    isDiretoria: () => temRole('diretoria'),
    isAdminNivel1: () => temRole('admin_nivel1'),
    isAdminMaster: () => temRole('admin_master'),
    
    // Verificações de nível
    temNivelConsultor: () => temNivelAcesso(1),
    temNivelCoordenador: () => temNivelAcesso(2),
    temNivelDiretoria: () => temNivelAcesso(3),
    temNivelAdmin1: () => temNivelAcesso(4),
    temNivelAdminMaster: () => temNivelAcesso(5),
  };
}; 