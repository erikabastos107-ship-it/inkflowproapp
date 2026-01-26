import { format } from 'date-fns';
import { Clock, User, MoreVertical, Edit, Check, X, Play, Trash } from 'lucide-react';
import { Appointment } from '@/types/database';
import { useUpdateAppointmentStatus, useDeleteAppointment } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import { toast } from 'sonner';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onEdit: () => void;
}

const statusColors = {
  scheduled: 'border-l-muted-foreground',
  confirmed: 'border-l-primary',
  in_progress: 'border-l-warning',
  completed: 'border-l-success',
  cancelled: 'border-l-destructive',
};

const statusLabels = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export function AppointmentDetails({ appointment, onEdit }: AppointmentDetailsProps) {
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const [showComplete, setShowComplete] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteAppointment.mutate(appointment.id);
    }
  };

  return (
    <>
      <div className={cn(
        'p-4 rounded-xl bg-muted/30 border-l-4 transition-all hover:bg-muted/50',
        statusColors[appointment.status]
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Time and duration */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {format(new Date(appointment.start_at), 'HH:mm')}
              </span>
              <span>• {appointment.duration_min}min</span>
            </div>

            {/* Client */}
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground truncate">
                {appointment.client?.name || 'Cliente não definido'}
              </span>
            </div>

            {/* Service and price */}
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                {appointment.service}
              </span>
              <span className="font-medium text-primary">
                {formatCurrency(appointment.price_expected)}
              </span>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {appointment.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {appointment.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => updateStatus.mutate({ id: appointment.id, status: 'confirmed' })}>
                  <Check className="h-4 w-4 mr-2" /> Confirmar
                </DropdownMenuItem>
              )}
              {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                <DropdownMenuItem onClick={() => updateStatus.mutate({ id: appointment.id, status: 'in_progress' })}>
                  <Play className="h-4 w-4 mr-2" /> Iniciar
                </DropdownMenuItem>
              )}
              {appointment.status === 'in_progress' && (
                <DropdownMenuItem onClick={() => setShowComplete(true)}>
                  <Check className="h-4 w-4 mr-2" /> Concluir
                </DropdownMenuItem>
              )}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => updateStatus.mutate({ id: appointment.id, status: 'cancelled' })}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showComplete && (
        <CompleteAppointmentModal
          open={showComplete}
          onOpenChange={setShowComplete}
          appointment={appointment}
        />
      )}
    </>
  );
}
