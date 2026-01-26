import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useCreateExpense } from '@/hooks/useExpenses';
import { ExpenseCategory, PaymentMethod } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const schema = z.object({
  date: z.date(),
  amount: z.number().min(0.01, 'Valor obrigatório'),
  category: z.string() as z.ZodType<ExpenseCategory>,
  payment_method: z.string() as z.ZodType<PaymentMethod>,
  description: z.string().optional(),
  recurring: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'rent', label: 'Aluguel' },
  { value: 'materials', label: 'Materiais' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'apps', label: 'Apps/Software' },
  { value: 'utilities', label: 'Utilidades' },
  { value: 'other', label: 'Outros' },
];

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'transfer', label: 'Transferência' },
];

export function ExpenseModal({ open, onOpenChange }: ExpenseModalProps) {
  const createExpense = useCreateExpense();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      category: 'other',
      payment_method: 'pix',
      description: '',
      recurring: false,
    },
  });

  const handleSubmit = async (data: FormData) => {
    await createExpense.mutateAsync({
      date: format(data.date, 'yyyy-MM-dd'),
      amount: data.amount,
      category: data.category,
      payment_method: data.payment_method,
      description: data.description || null,
      recurring: data.recurring,
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal input-glass',
                      !form.watch('date') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('date') ? (
                      format(form.watch('date'), 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      'Selecionar'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => date && form.setValue('date', date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="input-glass"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value as ExpenseCategory)}
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
              <Label>Pagamento</Label>
              <Select
                value={form.watch('payment_method')}
                onValueChange={(value) => form.setValue('payment_method', value as PaymentMethod)}
              >
                <SelectTrigger className="input-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes da despesa..."
              className="input-glass resize-none"
              rows={2}
              {...form.register('description')}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <Label>Despesa Recorrente</Label>
              <p className="text-xs text-muted-foreground">Repete todo mês</p>
            </div>
            <Switch
              checked={form.watch('recurring')}
              onCheckedChange={(checked) => form.setValue('recurring', checked)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createExpense.isPending}>
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
