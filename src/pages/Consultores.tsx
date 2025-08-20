import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Shield,
  User,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Briefcase
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConsultoresService } from "@/lib/consultoresService";
import { supabase } from "@/lib/supabase";
import { AddConsultorModal } from "@/components/consultores/AddConsultorModal";
import { EditConsultorModal } from "@/components/consultores/EditConsultorModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Consultor {
  id: string;
  email: string;
  nome: string;
  tipo: 'admin' | 'consultor';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  vagas_count?: number;
}

export default function Consultores() {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingConsultor, setEditingConsultor] = useState<Consultor | null>(null);
  const [deletingConsultor, setDeletingConsultor] = useState<Consultor | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.tipo === 'admin';

  useEffect(() => {
    fetchConsultores();
  }, []);

  const fetchConsultores = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os usuários com contagem de vagas
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          vagas_count:vagas(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar para incluir contagem
      const consultoresWithCount = data.map((consultor: any) => ({
        ...consultor,
        vagas_count: consultor.vagas_count?.[0]?.count || 0
      }));

      setConsultores(consultoresWithCount);
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os consultores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (consultor: Consultor) => {
    try {
      console.log('Iniciando exclusão de usuário:', consultor.id);
      
      // Usar função SQL RPC para excluir usuário
      const { data: result, error } = await supabase
        .rpc('excluir_usuario_admin', {
          p_id: consultor.id
        });

      if (error) {
        console.error('Erro do RPC:', error);
        throw new Error(error.message || 'Erro ao excluir usuário');
      }

      console.log('Usuário excluído com sucesso:', result);

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso.",
      });

      fetchConsultores();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      
      if (error.message?.includes('vagas associadas')) {
        toast({
          title: "Erro",
          description: "Não é possível excluir usuário com vagas associadas.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível remover o usuário.",
          variant: "destructive",
        });
      }
    } finally {
      setDeletingConsultor(null);
    }
  };

  const toggleStatus = async (consultor: Consultor) => {
    try {
      console.log('Alterando status do usuário:', consultor.id, 'para:', !consultor.ativo);
      
      // Usar função SQL RPC para atualizar status
      const { data: result, error } = await supabase
        .rpc('atualizar_usuario_admin', {
          p_id: consultor.id,
          p_email: null,
          p_nome: null,
          p_tipo: null,
          p_ativo: !consultor.ativo
        });

      if (error) {
        console.error('Erro do RPC:', error);
        throw new Error(error.message || 'Erro ao alterar status');
      }

      console.log('Status alterado com sucesso:', result);

      toast({
        title: "Sucesso",
        description: `Usuário ${!consultor.ativo ? 'ativado' : 'desativado'} com sucesso.`,
      });

      fetchConsultores();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  const filteredConsultores = consultores.filter(consultor =>
    consultor.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (nome: string, email: string) => {
    if (nome) {
      return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === 'admin' ? 'Administrador' : 'Consultor';
  };

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'admin') {
      return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800"><User className="w-3 h-3 mr-1" />Consultor</Badge>;
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-500">Apenas administradores podem gerenciar consultores.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuários do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie usuários, consultores e administradores
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultores List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuários ({filteredConsultores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando consultores...</p>
              </div>
            ) : filteredConsultores.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "Tente ajustar os filtros de busca." : "Comece adicionando o primeiro usuário."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredConsultores.map((consultor) => (
                  <div
                    key={consultor.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" alt={consultor.nome || consultor.email} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(consultor.nome, consultor.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {consultor.nome || consultor.email}
                          </h3>
                          {getTipoBadge(consultor.tipo)}
                          {!consultor.ativo && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {consultor.email}
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {consultor.vagas_count} vagas
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingConsultor(consultor)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(consultor)}>
                          {consultor.ativo ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        {consultor.vagas_count === 0 && (
                          <DropdownMenuItem 
                            onClick={() => setDeletingConsultor(consultor)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddConsultorModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          fetchConsultores();
          setIsAddModalOpen(false);
        }}
      />

      {editingConsultor && (
        <EditConsultorModal
          open={!!editingConsultor}
          onOpenChange={() => setEditingConsultor(null)}
          consultor={editingConsultor}
          onSuccess={() => {
            fetchConsultores();
            setEditingConsultor(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingConsultor} onOpenChange={() => setDeletingConsultor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{deletingConsultor?.nome || deletingConsultor?.email}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingConsultor && handleDelete(deletingConsultor)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
} 