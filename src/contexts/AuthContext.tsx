import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  nome: string;
  tipo: "admin" | "consultor";
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    let isInitialized = false;
    
    const initializeAuth = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      try {
        // Verificar sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Criar dados do usuário a partir da sessão do Supabase
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            nome: session.user.user_metadata?.nome || 'Administrador',
            tipo: 'admin' as const,
            ativo: true
          };
          setUser(userData);
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Criar dados do usuário a partir da sessão
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            nome: session.user.user_metadata?.nome || 'Administrador',
            tipo: 'admin' as const,
            ativo: true
          };
          setUser(userData);
          setIsLoading(false); // Garantir que o loading seja finalizado
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
} 