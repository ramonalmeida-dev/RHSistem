import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthDebug() {
  const { user, usuario, permissoes, loading } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-black/90 text-white border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Auth Debug</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>
            <strong>Loading:</strong> {loading ? 'true' : 'false'}
          </div>
          <div>
            <strong>User:</strong> {user ? user.email : 'null'}
          </div>
          <div>
            <strong>Usuario:</strong> {usuario ? `${usuario.nome} (${usuario.role_nome})` : 'null'}
          </div>
          <div>
            <strong>Permissões:</strong> {permissoes.length}
          </div>
          <div>
            <strong>Ativo:</strong> {usuario?.ativo ? 'true' : 'false'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 