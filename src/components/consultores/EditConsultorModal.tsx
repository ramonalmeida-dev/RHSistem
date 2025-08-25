import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

interface Role {
  id: string;
  nome: string;
  descricao: string;
  nivel_acesso: number;
}

interface EditConsultorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultor: Usuario | null;
  onSuccess: () => void;
}

export function EditConsultorModal({ open, onOpenChange, consultor, onSuccess }: EditConsultorModalProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    role_id: "",
    ativo: true
  });

  useEffect(() => {
    if (open && consultor) {
      setFormData({
        nome: consultor.nome,
        email: consultor.email,
        role_id: consultor.role_id,
        ativo: consultor.ativo
      });
      carregarRoles();
    }
  }, [open, consultor]);

  const carregarRoles = async () => {
    try {
      setLoadingRoles(true);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nivel_acesso');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      toast.error('Erro ao carregar roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consultor) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: formData.nome,
          email: formData.email,
          role_id: formData.role_id,
          ativo: formData.ativo
        })
        .eq('id', consultor.id);

      if (error) throw error;

      toast.success("Usuário atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!consultor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário no sistema.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Nível de Acesso</Label>
            <Select 
              value={formData.role_id} 
              onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              disabled={loadingRoles}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingRoles ? "Carregando..." : "Selecione o nível de acesso"} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.nome.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{role.descricao}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label htmlFor="ativo">Usuário ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingRoles}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 