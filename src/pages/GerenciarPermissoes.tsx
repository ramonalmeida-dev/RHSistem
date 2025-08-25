import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { Shield, Save, RotateCcw, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  nome: string;
  descricao: string;
  nivel_acesso: number;
}

interface Permissao {
  id: string;
  nome: string;
  descricao: string;
  modulo: string;
  acao: string;
}

interface RolePermissao {
  role_id: string;
  permissao_id: string;
}

export default function GerenciarPermissoes() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [rolePermissoes, setRolePermissoes] = useState<RolePermissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  
  const { podeGerenciarRoles } = usePermissions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('nivel_acesso');

      if (rolesError) throw rolesError;

      // Carregar permissões
      const { data: permissoesData, error: permissoesError } = await supabase
        .from('permissoes')
        .select('*')
        .order('modulo', { ascending: true });

      if (permissoesError) throw permissoesError;

      // Carregar associações role-permissões
      const { data: rolePermissoesData, error: rolePermissoesError } = await supabase
        .from('roles_permissoes')
        .select('role_id, permissao_id');

      if (rolePermissoesError) throw rolePermissoesError;

      setRoles(rolesData || []);
      setPermissoes(permissoesData || []);
      setRolePermissoes(rolePermissoesData || []);
      
      if (rolesData && rolesData.length > 0) {
        setSelectedRole(rolesData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId: string, permissaoId: string): boolean => {
    return rolePermissoes.some(rp => rp.role_id === roleId && rp.permissao_id === permissaoId);
  };

  const togglePermission = (roleId: string, permissaoId: string) => {
    const exists = hasPermission(roleId, permissaoId);
    
    if (exists) {
      // Remover permissão
      setRolePermissoes(prev => 
        prev.filter(rp => !(rp.role_id === roleId && rp.permissao_id === permissaoId))
      );
    } else {
      // Adicionar permissão
      setRolePermissoes(prev => [...prev, { role_id: roleId, permissao_id: permissaoId }]);
    }
  };

  const savePermissions = async () => {
    try {
      setSaving(true);

      // Deletar todas as permissões existentes para o role selecionado
      const { error: deleteError } = await supabase
        .from('roles_permissoes')
        .delete()
        .eq('role_id', selectedRole);

      if (deleteError) throw deleteError;

      // Inserir as novas permissões
      const permissoesToInsert = rolePermissoes
        .filter(rp => rp.role_id === selectedRole)
        .map(rp => ({
          role_id: rp.role_id,
          permissao_id: rp.permissao_id
        }));

      if (permissoesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('roles_permissoes')
          .insert(permissoesToInsert);

        if (insertError) throw insertError;
      }

      toast.success('Permissões salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const resetPermissions = () => {
    loadData();
    toast.success('Permissões resetadas');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin_master': return 'bg-red-100 text-red-800';
      case 'admin_nivel1': return 'bg-orange-100 text-orange-800';
      case 'diretoria': return 'bg-purple-100 text-purple-800';
      case 'coordenador': return 'bg-blue-100 text-blue-800';
      case 'consultor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'consultor': 'CONSULTOR',
      'coordenador': 'COORDENADOR', 
      'diretoria': 'DIRETORIA',
      'admin_nivel1': 'ADMIN NIVEL1',
      'admin_master': 'ADMIN MASTER'
    };
    return labels[role] || role.replace('_', ' ').toUpperCase();
  };

  const getModuloIcon = (modulo: string) => {
    switch (modulo) {
      case 'usuarios': return <Users className="h-4 w-4" />;
      case 'sistema': return <Settings className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  // Agrupar permissões por módulo
  const permissoesPorModulo = permissoes.reduce((acc, permissao) => {
    if (!acc[permissao.modulo]) {
      acc[permissao.modulo] = [];
    }
    acc[permissao.modulo].push(permissao);
    return acc;
  }, {} as Record<string, Permissao[]>);

  // Verificar permissão antes de renderizar
  if (!podeGerenciarRoles()) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Acesso Negado
            </h3>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para gerenciar permissões.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Permissões</h1>
            <p className="text-muted-foreground">
              Configure as permissões para cada nível de acesso do sistema
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={resetPermissions} disabled={loading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Resetar
            </Button>
            <Button onClick={savePermissions} disabled={saving || !selectedRole}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando permissões...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
            {/* Sidebar com Roles */}
            <Card className="xl:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Níveis de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roles.map((role) => (
                  <Button
                    key={role.id}
                    variant={selectedRole === role.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3 text-left transition-colors",
                      selectedRole === role.id 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <Badge className={cn(
                        getRoleColor(role.nome),
                        selectedRole === role.id && "bg-primary-foreground/20 text-primary-foreground"
                      )}>
                        {role.nivel_acesso}
                      </Badge>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm leading-tight">
                          {getRoleLabel(role.nome)}
                        </div>
                        <div className={cn(
                          "text-xs leading-tight mt-1",
                          selectedRole === role.id 
                            ? "text-primary-foreground/80" 
                            : "text-muted-foreground"
                        )}>
                          {role.descricao}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Área de Permissões */}
            <div className="xl:col-span-3">
              <Tabs defaultValue={Object.keys(permissoesPorModulo)[0]} className="space-y-4">
                <TabsList>
                  {Object.keys(permissoesPorModulo).map((modulo) => (
                    <TabsTrigger key={modulo} value={modulo} className="flex items-center gap-2">
                      {getModuloIcon(modulo)}
                      {modulo.charAt(0).toUpperCase() + modulo.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(permissoesPorModulo).map(([modulo, permissoesModulo]) => (
                  <TabsContent key={modulo} value={modulo}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {getModuloIcon(modulo)}
                          Permissões - {modulo.charAt(0).toUpperCase() + modulo.slice(1)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Ativo</TableHead>
                              <TableHead>Permissão</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissoesModulo.map((permissao) => (
                              <TableRow key={permissao.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={hasPermission(selectedRole, permissao.id)}
                                    onCheckedChange={() => togglePermission(selectedRole, permissao.id)}
                                    disabled={!selectedRole}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {permissao.nome}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {permissao.descricao}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {permissao.acao}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 