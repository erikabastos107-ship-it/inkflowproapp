import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, MoreVertical, Check, X, Play } from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/types/database';
import { useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CompleteAppointmentModal } from '@/components/appointments/CompleteAppointmentModal';

interface TodayAppointmentsProps {
  appointments: Appointment[];
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-muted text-muted-foreground',
  confirmed: 'bg-primary/20 text-primary',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export function TodayAppointments({ appointments }: TodayAppointmentsProps) {
  const updateStatus = useUpdateAppointmentStatus();
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    if (status === 'completed') {
      const appointment = appointments.find(a => a.id === id);
      if (appointment) {
        setCompletingAppointment(appointment);
      }
    } else {
      updateStatus.mutate({ id, status });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <>
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl bg-muted/30 transition-all hover:bg-muted/50',
              appointment.status === 'completed' && 'opacity-60'
            )}
          >
            {/* Time */}
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-lg font-semibold text-foreground">
                {format(new Date(appointment.start_at), 'HH:mm')}
              </span>
              <span className="text-xs text-muted-foreground">
                {appointment.duration_min}min
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-border" />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {appointment.client?.name || 'Cliente não definido'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{appointment.service}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-sm font-medium text-primary">
                  {formatCurrency(appointment.price_expected)}
                </span>
              </div>
            </div>

            {/* Status badge */}
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium hidden sm:inline-flex',
              statusColors[appointment.status]
            )}>
              {statusLabels[appointment.status]}
            </span>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {appointment.status === 'scheduled' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'confirmed')}>
                    <Check className="h-4 w-4 mr-2" /> Confirmar
                  </DropdownMenuItem>
                )}
                {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'in_progress')}>
                    <Play className="h-4 w-4 mr-2" /> Iniciar atendimento
                  </DropdownMenuItem>
                )}
                {appointment.status === 'in_progress' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'completed')}>
                    <Check className="h-4 w-4 mr-2" /> Concluir
                  </DropdownMenuItem>
                )}
                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {completingAppointment && (
        <CompleteAppointmentModal
          open={!!completingAppointment}
          onOpenChange={(open) => !open && setCompletingAppointment(null)}
          appointment={completingAppointment}
        />
      )}
    </>
  );
}
