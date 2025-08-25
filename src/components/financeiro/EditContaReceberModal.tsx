import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// Interfaces temporárias
interface ContaReceber {
  id: string;
  vaga_id: string;
  empresa_id: string;
  numero_vaga: string;
  cargo: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'parcial';
  tipo: 'comissao' | 'taxa' | 'adicional';
  observacoes?: string;
  nota_fiscal_url?: string;
  empresa?: { razao_social: string; cnpj: string };
  created_at: string;
  updated_at: string;
}

interface UpdateContaReceber {
  valor?: number;
  data_vencimento?: string;
  data_pagamento?: string;
  status?: 'pendente' | 'pago' | 'atrasado' | 'parcial';
  tipo?: 'comissao' | 'taxa' | 'adicional';
  observacoes?: string;
  nota_fiscal_url?: string;
}

// Mock do serviço temporário
const ContasReceberService = {
  async update(id: string, data: UpdateContaReceber): Promise<ContaReceber> {
    return {} as ContaReceber;
  }
};
import { toast } from "sonner";

interface EditContaReceberModalProps {
  conta: ContaReceber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditContaReceberModal({ conta, open, onOpenChange, onSuccess }: EditContaReceberModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateContaReceber>({
    valor: conta?.valor || 0,
    data_vencimento: conta?.data_vencimento || '',
    data_pagamento: conta?.data_pagamento || '',
    status: conta?.status || 'pendente',
    tipo: conta?.tipo || 'comissao',
    observacoes: conta?.observacoes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conta) return;

    try {
      setLoading(true);
      await ContasReceberService.update(conta.id, formData);
      toast.success('Conta a receber atualizada com sucesso');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao atualizar conta a receber');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comissao">Comissão</SelectItem>
                  <SelectItem value="taxa">Taxa</SelectItem>
                  <SelectItem value="adicional">Adicional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_vencimento">Data de Vencimento</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="data_pagamento">Data de Pagamento</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={formData.data_pagamento || ''}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value || undefined })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 