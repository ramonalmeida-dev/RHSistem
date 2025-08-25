import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddConsultorModal } from "@/components/consultores/AddConsultorModal";
import { EditConsultorModal } from "@/components/consultores/EditConsultorModal";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Settings, UserCheck, UserX, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usuariosService } from "@/lib/usuariosService";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  role_id: string;
  role_nome: string;
  role_descricao: string;
  nivel_acesso: number;
  created_at: string;
}

export default function Consultores() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  
  const navigate = useNavigate();
  const { podeVerUsuarios, podeCriarUsuarios, podeEditarUsuarios, podeExcluirUsuarios } = usePermissions();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const usuarios = await usuariosService.listarUsuarios();
      setUsuarios(usuarios);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditModalOpen(true);
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      await usuariosService.desativarUsuario(usuario.id, !usuario.ativo);
      toast.success(`Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso`);
      loadUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleDeleteUsuario = async (usuario: Usuario) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) {
      return;
    }

    try {
      await usuariosService.deletarUsuario(usuario.id);
      toast.success('Usuário excluído com sucesso');
      loadUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.role_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    return role.replace('_', ' ').toUpperCase();
  };

  if (!podeVerUsuarios()) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Acesso Negado
            </h3>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para visualizar esta página.
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
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os usuários e permissões do sistema
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <PermissionGuard permissao="usuarios_gerenciar_roles">
              <Button variant="outline" onClick={() => navigate('/gerenciar-permissoes')}>
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Permissões
              </Button>
            </PermissionGuard>
            <PermissionGuard permissao="usuarios_criar">
              <Button onClick={() => setAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Usuário
          </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
              placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
                />
              </div>
            </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({filteredUsuarios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando usuários...</div>
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Tente ajustar os termos de busca." : "Comece adicionando um novo usuário."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{usuario.nome}</div>
                            <div className="text-sm text-muted-foreground">{usuario.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge className={getRoleColor(usuario.role_nome)}>
                            {getRoleLabel(usuario.role_nome)}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {usuario.role_descricao}
                      </div>
                    </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{usuario.nivel_acesso}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {usuario.ativo ? (
                            <>
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 text-sm">Ativo</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 text-red-600" />
                              <span className="text-red-600 text-sm">Inativo</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <PermissionGuard permissao="usuarios_editar">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUsuario(usuario)}
                              title="Editar usuário"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          
                          <PermissionGuard permissao="usuarios_editar">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(usuario)}
                              title={usuario.ativo ? "Desativar usuário" : "Ativar usuário"}
                              className={usuario.ativo ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                            >
                              {usuario.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          </PermissionGuard>
                          
                          <PermissionGuard permissao="usuarios_excluir">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUsuario(usuario)}
                              title="Excluir usuário"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                  </div>
                      </TableCell>
                    </TableRow>
                ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddConsultorModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={loadUsuarios}
      />

        <EditConsultorModal
        consultor={selectedUsuario}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={loadUsuarios}
      />
    </MainLayout>
  );
} 