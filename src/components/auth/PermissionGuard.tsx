import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionGuardProps {
  children: ReactNode;
  permissao?: string;
  role?: string;
  nivelAcesso?: number;
  fallback?: ReactNode;
}

export const PermissionGuard = ({ 
  children, 
  permissao, 
  role, 
  nivelAcesso, 
  fallback = null 
}: PermissionGuardProps) => {
  const { temPermissao, temRole, temNivelAcesso } = useAuth();

  // Verificar permissão específica
  if (permissao && !temPermissao(permissao)) {
    return <>{fallback}</>;
  }

  // Verificar role específico
  if (role && !temRole(role)) {
    return <>{fallback}</>;
  }

  // Verificar nível de acesso mínimo
  if (nivelAcesso && !temNivelAcesso(nivelAcesso)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}; 