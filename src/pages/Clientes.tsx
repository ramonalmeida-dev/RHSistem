import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Building2, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddClienteModal } from "@/components/clientes/AddClienteModal";
import { EditClienteModal } from "@/components/clientes/EditClienteModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Interface baseada no backend
interface Cliente {
  id: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  endereco_completo?: string;
  prazo_pagamento?: string;
  contato?: string;
  celular?: string;
  email?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  // Carregar clientes
  const loadClientes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('razao_social');

      if (error) {
        throw error;
      }

      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar novo cliente
  const handleAddCliente = async (clienteData: any) => {
    try {
      setIsLoading(true);
      
      // Mapear dados do formulário para a estrutura do banco
      const mappedData = {
        razao_social: clienteData.razaoSocial,
        cnpj: clienteData.cnpj,
        inscricao_estadual: clienteData.inscricaoEstadual,
        endereco_completo: clienteData.endereco,
        prazo_pagamento: clienteData.prazoPagamento,
        contato: clienteData.contato,
        celular: clienteData.celular,
        email: clienteData.email,
        ativo: true
      };

      const { data, error } = await supabase
        .from('clientes')
        .insert(mappedData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!",
      });

      setIsAddModalOpen(false);
      loadClientes();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Editar cliente
  const handleEditCliente = async (clienteData: any) => {
    if (!selectedCliente) return;
    
    try {
      // Mapear dados do modal para o formato esperado pelo backend
      const mappedData = {
        id: selectedCliente.id,
        razao_social: clienteData.razaoSocial,
        cnpj: clienteData.cnpj,
        inscricao_estadual: clienteData.inscricaoEstadual,
        endereco_completo: clienteData.endereco,
        prazo_pagamento: clienteData.prazoPagamento,
        contato: clienteData.contato,
        celular: clienteData.celular,
        email: clienteData.email,
        ativo: selectedCliente.ativo
      };

      const { data, error } = await supabase
        .from('clientes')
        .update(mappedData)
        .eq('id', selectedCliente.id)
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Erro ao atualizar cliente",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cliente atualizado com sucesso",
          description: `${clienteData.razaoSocial} foi atualizado`,
        });
        setIsEditModalOpen(false);
        setSelectedCliente(null);
        loadClientes(); // Recarregar lista
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar cliente",
        description: "Erro interno do servidor",
        variant: "destructive",
      });
    }
  };

  // Excluir cliente
  const handleDeleteCliente = async (cliente: Cliente) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.razao_social}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id);
      
      if (error) {
        toast({
          title: "Erro ao excluir cliente",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cliente excluído com sucesso",
          description: `${cliente.razao_social} foi removido da carteira`,
        });
        loadClientes(); // Recarregar lista
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir cliente",
        description: "Erro interno do servidor",
        variant: "destructive",
      });
    }
  };

  // Abrir modal de edição
  const openEditModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditModalOpen(true);
  };

  // Função para remover máscaras
  const removeMasks = (text: string) => {
    return text.replace(/[^\w\s]/g, '').toLowerCase();
  };

  // Filtrar clientes
  const filteredClientes = clientes.filter(cliente => {
    const searchTermClean = removeMasks(searchTerm);
    
    // Buscar na razão social
    const razaoSocialClean = removeMasks(cliente.razao_social);
    if (razaoSocialClean.includes(searchTermClean)) return true;
    
    // Buscar no CNPJ (com e sem máscara)
    const cnpjClean = removeMasks(cliente.cnpj);
    if (cnpjClean.includes(searchTermClean)) return true;
    
    // Buscar no email
    if (cliente.email && removeMasks(cliente.email).includes(searchTermClean)) return true;
    
    // Buscar no contato
    if (cliente.contato && removeMasks(cliente.contato).includes(searchTermClean)) return true;
    
    // Buscar no celular
    if (cliente.celular && removeMasks(cliente.celular).includes(searchTermClean)) return true;
    
    return false;
  });

  // Paginação
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClientes = filteredClientes.slice(startIndex, endIndex);

  // Resetar página quando mudar a busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    loadClientes();
  }, []);

  const getStatusBadge = (ativo: boolean) => {
    return ativo 
      ? <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      : <Badge variant="secondary">Inativo</Badge>;
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando clientes...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie sua carteira de clientes ({filteredClientes.length} clientes)
              {searchTerm && ` - ${paginatedClientes.length} resultados na página atual`}
            </p>
          </div>
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por razão social, CNPJ, email, contato ou celular..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        <Card>
          <CardContent className="p-0">
            {filteredClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? "Nenhum cliente corresponde aos critérios de busca."
                    : "Comece adicionando seu primeiro cliente."
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Razão Social</th>
                        <th className="text-left p-3 font-medium">CNPJ</th>
                        <th className="text-left p-3 font-medium">Contato</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium w-20">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClientes.map((cliente, index) => (
                        <tr 
                          key={cliente.id} 
                          className={`border-b hover:bg-muted/30 transition-colors ${
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                          }`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-medium">{cliente.razao_social}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {formatCNPJ(cliente.cnpj)}
                          </td>
                          <td className="p-3 text-sm">
                            <div>
                              <div className="font-medium">{cliente.contato}</div>
                              {cliente.celular && (
                                <div className="text-muted-foreground text-xs">{cliente.celular}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {cliente.email || '-'}
                          </td>
                          <td className="p-3">
                            {getStatusBadge(cliente.ativo)}
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditModal(cliente)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteCliente(cliente)}
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredClientes.length)} de {filteredClientes.length} clientes
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Cliente Modal */}
        <AddClienteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddCliente}
        />

        {/* Edit Cliente Modal */}
        <EditClienteModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCliente(null);
          }}
          onSubmit={handleEditCliente}
          cliente={selectedCliente}
        />
      </div>
    </MainLayout>
  );
};

export default Clientes;