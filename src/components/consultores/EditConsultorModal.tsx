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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Consultor {
  id: string;
  email: string;
  nome: string;
  tipo: 'admin' | 'consultor';
  ativo: boolean;
}

interface EditConsultorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultor: Consultor;
  onSuccess: () => void;
}

export function EditConsultorModal({ open, onOpenChange, consultor, onSuccess }: EditConsultorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    password: "",
    tipo: "consultor" as "admin" | "consultor",
    ativo: true
  });
  const { toast } = useToast();

  useEffect(() => {
    if (consultor) {
      setFormData({
        email: consultor.email,
        nome: consultor.nome || "",
        password: "",
        tipo: consultor.tipo,
        ativo: consultor.ativo
      });
    }
  }, [consultor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.nome) {
      toast({
        title: "Erro",
        description: "Email e nome são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando atualização de usuário:', {
        id: consultor.id,
        email: formData.email,
        nome: formData.nome,
        tipo: formData.tipo,
        ativo: formData.ativo
      });

      // Usar função SQL RPC para atualizar usuário
      const { data: updatedUser, error } = await supabase
        .rpc('atualizar_usuario_admin', {
          p_id: consultor.id,
          p_email: formData.email !== consultor.email ? formData.email : null,
          p_nome: formData.nome !== consultor.nome ? formData.nome : null,
          p_tipo: formData.tipo !== consultor.tipo ? formData.tipo : null,
          p_ativo: formData.ativo !== consultor.ativo ? formData.ativo : null
        });

      if (error) {
        console.error('Erro do RPC:', error);
        throw new Error(error.message || 'Erro ao atualizar usuário');
      }

      console.log('Usuário atualizado com sucesso:', updatedUser);

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações do usuário do sistema.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="consultor@empresa.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do consultor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha (opcional)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Deixe em branco para manter a senha atual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "admin" | "consultor") => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultor">Consultor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label htmlFor="ativo">Ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 