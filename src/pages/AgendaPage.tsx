import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment } from '@/types/database';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { AppointmentDetails } from '@/components/appointments/AppointmentDetails';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'day';

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: appointments, isLoading } = useAppointments(
    startOfWeek(monthStart, { weekStartsOn: 1 }),
    endOfWeek(monthEnd, { weekStartsOn: 1 })
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate || !appointments) return [];
    return appointments.filter(a => isSameDay(new Date(a.start_at), selectedDate))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [selectedDate, appointments]);

  const getAppointmentsForDay = (day: Date) => {
    if (!appointments) return [];
    return appointments.filter(a => isSameDay(new Date(a.start_at), day));
  };

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const statusColors = {
    scheduled: 'bg-muted',
    confirmed: 'bg-primary/80',
    in_progress: 'bg-warning',
    completed: 'bg-success',
    cancelled: 'bg-destructive/50',
  };

  return (
    <div className="space-y-6">
      <Header showFilter={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-foreground">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
              >
                Hoje
              </Button>
              <Button size="sm" className="gap-2" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Agendar</span>
              </Button>
            </div>
          </div>

          {/* Weekdays header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square skeleton-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'aspect-square p-1 rounded-xl transition-all relative flex flex-col',
                      isCurrentMonth ? 'hover:bg-muted/50' : 'opacity-40',
                      isSelected && 'bg-primary/20 ring-1 ring-primary',
                      isToday && !isSelected && 'ring-1 ring-muted-foreground/50'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      isToday && 'text-primary',
                      isSelected && 'text-primary'
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Appointment dots */}
                    {dayAppointments.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-auto justify-center">
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <span
                            key={apt.id}
                            className={cn('w-1.5 h-1.5 rounded-full', statusColors[apt.status])}
                          />
                        ))}
                        {dayAppointments.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayAppointments.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Day details panel */}
        <div className="glass-card p-4 sm:p-6">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, 'EEEE', { locale: ptBR })}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {selectedDayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayAppointments.map((apt) => (
                    <AppointmentDetails
                      key={apt.id}
                      appointment={apt}
                      onEdit={() => setSelectedAppointment(apt)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarIcon}
                  title="Sem agendamentos"
                  description="Nenhum atendimento marcado para este dia"
                />
              )}
            </>
          ) : (
            <EmptyState
              icon={CalendarIcon}
              title="Selecione um dia"
              description="Clique em um dia do calendário para ver os detalhes"
            />
          )}
        </div>
      </div>

      <AppointmentModal
        open={showModal || !!selectedAppointment}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment || undefined}
      />
    </div>
  );
}
