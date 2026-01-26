import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, User, Clock, DollarSign, Plus } from 'lucide-react';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useAppointments';
import { Appointment, AppointmentStatus } from '@/types/database';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const schema = z.object({
  client_id: z.string().optional(),
  new_client_name: z.string().optional(),
  date: z.date(),
  time: z.string().min(1, 'Horário obrigatório'),
  duration_min: z.number().min(15, 'Mínimo 15 minutos'),
  service: z.string().min(1, 'Serviço obrigatório'),
  price_expected: z.number().min(0),
  deposit: z.number().min(0),
  notes: z.string().optional(),
  reminder: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
}

const services = [
  'Tattoo',
  'Retoque',
  'Cover-up',
  'Orçamento',
  'Outro',
];

export function AppointmentModal({ open, onOpenChange, appointment }: AppointmentModalProps) {
  const { data: clients } = useClients();
  const createClient = useCreateClient();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const [showNewClient, setShowNewClient] = useState(false);

  const isEditing = !!appointment;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: '',
      new_client_name: '',
      date: new Date(),
      time: '10:00',
      duration_min: 120,
      service: 'Tattoo',
      price_expected: 0,
      deposit: 0,
      notes: '',
      reminder: false,
    },
  });

  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.start_at);
      form.reset({
        client_id: appointment.client_id || '',
        date: startDate,
        time: format(startDate, 'HH:mm'),
        duration_min: appointment.duration_min,
        service: appointment.service,
        price_expected: appointment.price_expected,
        deposit: appointment.deposit,
        notes: appointment.notes || '',
        reminder: appointment.reminder,
      });
    }
  }, [appointment, form]);

  const handleSubmit = async (data: FormData) => {
    let clientId = data.client_id;

    // Create new client if needed
    if (showNewClient && data.new_client_name) {
      const newClient = await createClient.mutateAsync({
        name: data.new_client_name,
        email: null,
        phone: null,
        instagram: null,
        skin_tone: null,
        notes: null,
      });
      clientId = newClient.id;
    }

    const [hours, minutes] = data.time.split(':').map(Number);
    const startAt = new Date(data.date);
    startAt.setHours(hours, minutes, 0, 0);

    const appointmentData = {
      client_id: clientId || null,
      start_at: startAt.toISOString(),
      duration_min: data.duration_min,
      service: data.service,
      price_expected: data.price_expected,
      price_final: 0,
      deposit: data.deposit,
      notes: data.notes || null,
      reminder: data.reminder,
      status: 'scheduled' as AppointmentStatus,
    };

    if (isEditing && appointment) {
      await updateAppointment.mutateAsync({ id: appointment.id, ...appointmentData });
    } else {
      await createAppointment.mutateAsync(appointmentData);
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Client selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cliente</Label>
              <button
                type="button"
                onClick={() => setShowNewClient(!showNewClient)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {showNewClient ? 'Selecionar existente' : 'Novo cliente'}
              </button>
            </div>

            {showNewClient ? (
              <Input
                placeholder="Nome do novo cliente"
                className="input-glass"
                {...form.register('new_client_name')}
              />
            ) : (
              <Select
                value={form.watch('client_id')}
                onValueChange={(value) => form.setValue('client_id', value)}
              >
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date and Time */}
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
                      'Selecionar data'
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
              <Label>Horário</Label>
              <Input
                type="time"
                className="input-glass"
                {...form.register('time')}
              />
            </div>
          </div>

          {/* Duration and Service */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração (min)</Label>
              <Input
                type="number"
                className="input-glass"
                {...form.register('duration_min', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select
                value={form.watch('service')}
                onValueChange={(value) => form.setValue('service', value)}
              >
                <SelectTrigger className="input-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price and Deposit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor previsto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                className="input-glass"
                {...form.register('price_expected', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Sinal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                className="input-glass"
                {...form.register('deposit', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Notas sobre o atendimento..."
              className="input-glass resize-none"
              rows={3}
              {...form.register('notes')}
            />
          </div>

          {/* Reminder */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <Label>Lembrete</Label>
              <p className="text-xs text-muted-foreground">Notificar antes do atendimento</p>
            </div>
            <Switch
              checked={form.watch('reminder')}
              onCheckedChange={(checked) => form.setValue('reminder', checked)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createAppointment.isPending || updateAppointment.isPending}>
              {isEditing ? 'Salvar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
