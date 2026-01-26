import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package } from 'lucide-react';
import { useCreateMaterial, useUpdateMaterial } from '@/hooks/useMaterials';
import { Material, MaterialCategory, UnitType } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  category: z.string() as z.ZodType<MaterialCategory>,
  unit: z.string() as z.ZodType<UnitType>,
  qty_current: z.number().min(0),
  min_qty: z.number().min(0),
  unit_cost: z.number().min(0),
  supplier: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface MaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material;
}

const categories: { value: MaterialCategory; label: string }[] = [
  { value: 'needles', label: 'Agulhas' },
  { value: 'ink', label: 'Tintas' },
  { value: 'tips', label: 'Biqueiras' },
  { value: 'gloves', label: 'Luvas' },
  { value: 'paper', label: 'Papel' },
  { value: 'film', label: 'Filme' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'other', label: 'Outros' },
];

const units: { value: UnitType; label: string }[] = [
  { value: 'un', label: 'Unidade' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'box', label: 'Caixa' },
  { value: 'pack', label: 'Pacote' },
];

export function MaterialModal({ open, onOpenChange, material }: MaterialModalProps) {
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const isEditing = !!material;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'other',
      unit: 'un',
      qty_current: 0,
      min_qty: 5,
      unit_cost: 0,
      supplier: '',
    },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        category: material.category,
        unit: material.unit,
        qty_current: material.qty_current,
        min_qty: material.min_qty,
        unit_cost: material.unit_cost,
        supplier: material.supplier || '',
      });
    } else {
      form.reset({
        name: '',
        category: 'other',
        unit: 'un',
        qty_current: 0,
        min_qty: 5,
        unit_cost: 0,
        supplier: '',
      });
    }
  }, [material, form]);

  const handleSubmit = async (data: FormData) => {
    const materialData = {
      name: data.name,
      category: data.category,
      unit: data.unit,
      qty_current: data.qty_current,
      min_qty: data.min_qty,
      unit_cost: data.unit_cost,
      supplier: data.supplier || null,
    };

    if (isEditing && material) {
      await updateMaterial.mutateAsync({ id: material.id, ...materialData });
    } else {
      await createMaterial.mutateAsync(materialData);
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Material' : 'Novo Material'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Material *</Label>
            <Input
              id="name"
              placeholder="Ex: Agulha RL 5"
              className="input-glass"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value as MaterialCategory)}
              >
                <SelectTrigger className="input-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={form.watch('unit')}
                onValueChange={(value) => form.setValue('unit', value as UnitType)}
              >
                <SelectTrigger className="input-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty_current">Quantidade Atual</Label>
              <Input
                id="qty_current"
                type="number"
                step="0.1"
                className="input-glass"
                {...form.register('qty_current', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_qty">Quantidade Mínima</Label>
              <Input
                id="min_qty"
                type="number"
                step="0.1"
                className="input-glass"
                {...form.register('min_qty', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_cost">Custo Unitário (R$)</Label>
            <Input
              id="unit_cost"
              type="number"
              step="0.01"
              className="input-glass"
              {...form.register('unit_cost', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor (opcional)</Label>
            <Input
              id="supplier"
              placeholder="Nome do fornecedor"
              className="input-glass"
              {...form.register('supplier')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createMaterial.isPending || updateMaterial.isPending}>
              {isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
