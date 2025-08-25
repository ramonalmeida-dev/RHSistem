import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  role_id: string;
  role_nome: string;
  role_descricao: string;
  nivel_acesso: number;
  ativo: boolean;
}

interface Permissao {
  permissao_nome: string;
  modulo: string;
  acao: string;
}

interface AuthContextType {
  user: User | null;
  usuario: Usuario | null;
  permissoes: Permissao[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  temPermissao: (permissao: string) => boolean;
  temRole: (role: string) => boolean;
  temNivelAcesso: (nivel: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Criar usuário básico a partir do JWT
        const usuarioBasico: Usuario = {
          id: session.user.id,
          email: session.user.email || '',
          nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
          role_id: '',
          role_nome: 'admin_master', // Role padrão para acesso total
          role_descricao: 'Administrador Master - Acesso total ao sistema',
          nivel_acesso: 5,
          ativo: true
        };
        
        setUsuario(usuarioBasico);
        
        // Carregar dados completos em background (opcional)
        carregarDadosCompletos(session.user.id);
      }
      
      setLoading(false);
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Criar usuário básico imediatamente
          const usuarioBasico: Usuario = {
            id: session.user.id,
            email: session.user.email || '',
            nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
            role_id: '',
            role_nome: 'admin_master',
            role_descricao: 'Administrador Master - Acesso total ao sistema',
            nivel_acesso: 5,
            ativo: true
          };
          
          setUsuario(usuarioBasico);
          
          // Carregar dados completos em background
          carregarDadosCompletos(session.user.id);
        } else {
          setUsuario(null);
          setPermissoes([]);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const carregarDadosCompletos = async (userId: string) => {
    try {
      // Buscar dados do usuário
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, email, nome, role_id, ativo')
        .eq('id', userId)
        .single();

      if (usuarioError) {
        return; // Manter usuário básico
      }

      if (usuarioData && usuarioData.role_id) {
        // Buscar dados do role
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('nome, descricao, nivel_acesso')
          .eq('id', usuarioData.role_id)
          .single();

        if (roleError) {
          return; // Manter usuário básico
        }

        // Atualizar usuário com dados completos
        const usuarioCompleto: Usuario = {
          id: usuarioData.id,
          email: usuarioData.email,
          nome: usuarioData.nome,
          role_id: usuarioData.role_id,
          role_nome: roleData.nome,
          role_descricao: roleData.descricao,
          nivel_acesso: roleData.nivel_acesso,
          ativo: usuarioData.ativo
        };

        setUsuario(usuarioCompleto);

        // Buscar permissões
        try {
          const { data: permissoesData, error: permissoesError } = await supabase
            .rpc('obter_permissoes_usuario', { p_usuario_id: userId });

          if (!permissoesError && permissoesData) {
            setPermissoes(permissoesData);
          }
        } catch (permError) {
          // Silenciar erro de permissões
        }
      }
    } catch (error) {
      // Silenciar erro geral
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const temPermissao = (permissao: string): boolean => {
    return permissoes.some(p => p.permissao_nome === permissao);
  };

  const temRole = (role: string): boolean => {
    return usuario?.role_nome === role;
  };

  const temNivelAcesso = (nivel: number): boolean => {
    return (usuario?.nivel_acesso || 0) >= nivel;
  };

  const value = {
    user,
    usuario,
    permissoes,
    loading,
    signIn,
    signOut,
    temPermissao,
    temRole,
    temNivelAcesso,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 