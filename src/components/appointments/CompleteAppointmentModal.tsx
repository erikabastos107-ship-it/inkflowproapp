import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Package, Trash2, Plus } from 'lucide-react';
import { useMaterials, useConsumeMaterials } from '@/hooks/useMaterials';
import { useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { Appointment } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CompleteAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}

interface MaterialUsed {
  id: string;
  material_id: string;
  qty_used: number;
}

export function CompleteAppointmentModal({ open, onOpenChange, appointment }: CompleteAppointmentModalProps) {
  const { data: materials } = useMaterials();
  const consumeMaterials = useConsumeMaterials();
  const updateStatus = useUpdateAppointmentStatus();
  const [materialsUsed, setMaterialsUsed] = useState<MaterialUsed[]>([]);
  const [priceFinal, setPriceFinal] = useState(appointment.price_expected);
  const [loading, setLoading] = useState(false);

  const addMaterial = () => {
    setMaterialsUsed([
      ...materialsUsed,
      { id: crypto.randomUUID(), material_id: '', qty_used: 1 }
    ]);
  };

  const updateMaterial = (id: string, field: 'material_id' | 'qty_used', value: string | number) => {
    setMaterialsUsed(materialsUsed.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const removeMaterial = (id: string) => {
    setMaterialsUsed(materialsUsed.filter(m => m.id !== id));
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Validate material quantities
      for (const used of materialsUsed) {
        if (!used.material_id) continue;
        
        const material = materials?.find(m => m.id === used.material_id);
        if (material && used.qty_used > material.qty_current) {
          toast.error(`Quantidade insuficiente de ${material.name}`);
          setLoading(false);
          return;
        }
      }

      // Update appointment status
      await updateStatus.mutateAsync({
        id: appointment.id,
        status: 'completed',
        price_final: priceFinal
      });

      // Consume materials if any
      const validMaterials = materialsUsed.filter(m => m.material_id && m.qty_used > 0);
      if (validMaterials.length > 0) {
        await consumeMaterials.mutateAsync({
          appointmentId: appointment.id,
          consumption: validMaterials.map(m => ({
            material_id: m.material_id,
            qty_used: m.qty_used
          }))
        });
      }

      toast.success('Atendimento concluído!');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao concluir atendimento');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Concluir Atendimento</DialogTitle>
          <DialogDescription>
            Registre os materiais utilizados e o valor final
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Price */}
          <div className="space-y-2">
            <Label>Valor Final (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={priceFinal}
              onChange={(e) => setPriceFinal(parseFloat(e.target.value) || 0)}
              className="input-glass text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              Valor previsto: {formatCurrency(appointment.price_expected)}
            </p>
          </div>

          {/* Materials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materiais Utilizados
              </Label>
              <Button type="button" variant="ghost" size="sm" onClick={addMaterial} className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>

            {materialsUsed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">
                Nenhum material registrado
              </p>
            ) : (
              <div className="space-y-2">
                {materialsUsed.map((used) => (
                  <div key={used.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                    <Select
                      value={used.material_id}
                      onValueChange={(value) => updateMaterial(used.id, 'material_id', value)}
                    >
                      <SelectTrigger className="flex-1 input-glass">
                        <SelectValue placeholder="Selecionar material" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {materials?.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.qty_current} {material.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={used.qty_used}
                      onChange={(e) => updateMaterial(used.id, 'qty_used', parseFloat(e.target.value) || 0)}
                      className="w-20 input-glass text-center"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMaterial(used.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleComplete} className="flex-1 gap-2" disabled={loading}>
              <Check className="h-4 w-4" />
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
