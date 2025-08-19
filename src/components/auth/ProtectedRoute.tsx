import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, refreshSession } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Timeout para loading - se ficar mais de 15 segundos carregando, mostrar opção de refresh
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000);

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoadingTimeout(false);
    try {
      await refreshSession();
    } catch (error) {
      console.error('Erro ao fazer refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleForceReload = () => {
    window.location.reload();
  };

  // Mostrar loading com timeout
  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar opções quando há timeout no loading
  if (isLoading && loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A sessão está demorando para carregar. Isso pode indicar um problema de conectividade ou sessão expirada.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="w-full"
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renovando sessão...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renovar Sessão
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleForceReload} 
              variant="outline"
              className="w-full"
            >
              Recarregar Página
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  // Se requer admin mas o usuário não é admin
  if (requireAdmin && user?.tipo !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 