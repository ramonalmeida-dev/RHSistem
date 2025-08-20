import { useState } from "react";
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

interface AddConsultorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddConsultorModal({ open, onOpenChange, onSuccess }: AddConsultorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    password: "",
    tipo: "consultor" as "admin" | "consultor",
    ativo: true
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.nome || !formData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando criação de usuário:', formData);
      
      // Usar edge function para criar usuário sem fazer login automático
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('Chamando edge function criar-usuario...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/criar-usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          nome: formData.nome,
          tipo: formData.tipo,
          ativo: formData.ativo,
          senha: formData.password || '123456'
        }),
      });

      const result = await response.json();
      console.log('Resposta da edge function:', result);

      if (!response.ok || !result.success) {
        console.error('Erro da edge function:', result);
        throw new Error(result.error?.message || 'Erro ao criar usuário');
      }

      console.log('Usuário criado com sucesso via edge function!');
      
      toast({
        title: "Sucesso",
        description: `Usuário criado com sucesso. A senha é '${formData.password || '123456'}'. Você continua logado como admin.`,
      });

      setFormData({
        email: "",
        nome: "",
        password: "",
        tipo: "consultor",
        ativo: true
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro completo ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    } finally {
      console.log('Finalizando criação, setLoading(false)');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: "",
      nome: "",
      password: "",
      tipo: "consultor",
      ativo: true
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo usuário ao sistema. Escolha o tipo adequado para definir as permissões.
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
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Senha de acesso"
              required
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
                <SelectItem value="consultor">Consultor (acesso limitado)</SelectItem>
                <SelectItem value="admin">Administrador (acesso total)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Consultores veem apenas suas próprias vagas. Admins têm acesso total ao sistema.
            </p>
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 