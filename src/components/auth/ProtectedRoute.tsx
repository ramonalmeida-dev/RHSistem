import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, usuario, loading } = useAuth();
  const location = useLocation();

  // Loading - aguardando verificação de autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!user || !usuario) {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  // Verificar se o usuário está ativo
  if (!usuario.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Sua conta está desativada. Entre em contato com o administrador.</p>
        </div>
      </div>
    );
  }

  // Se requer admin mas o usuário não tem nível suficiente (compatibilidade)
  if (requireAdmin && usuario.nivel_acesso < 4) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 