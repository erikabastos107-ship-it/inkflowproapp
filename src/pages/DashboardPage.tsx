import { useMemo } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonCard, SkeletonChart, SkeletonList } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useFilter } from '@/contexts/FilterContext';
import { useAppointments, useTodayAppointments } from '@/hooks/useAppointments';
import { useLowStockMaterials } from '@/hooks/useMaterials';
import { TodayAppointments } from '@/components/dashboard/TodayAppointments';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TimeWorkedChart } from '@/components/dashboard/TimeWorkedChart';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { useState } from 'react';

export default function DashboardPage() {
  const { dateRange, periodFilter } = useFilter();
  const { data: appointments, isLoading: loadingAppointments } = useAppointments(dateRange.from, dateRange.to);
  const { data: todayAppointments, isLoading: loadingToday } = useTodayAppointments();
  const { data: lowStockMaterials, isLoading: loadingStock } = useLowStockMaterials();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const stats = useMemo(() => {
    if (!appointments) return { revenue: 0, hoursWorked: 0, completedCount: 0 };

    const completed = appointments.filter(a => a.status === 'completed');
    const revenue = completed.reduce((sum, a) => sum + (a.price_final || a.price_expected || 0), 0);
    const totalMinutes = completed.reduce((sum, a) => sum + (a.duration_min || 60), 0);

    return {
      revenue,
      hoursWorked: Math.round(totalMinutes / 60 * 10) / 10,
      completedCount: completed.length
    };
  }, [appointments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'daily': return 'hoje';
      case 'weekly': return 'esta semana';
      case 'monthly': return 'este mês';
      case 'yearly': return 'este ano';
      default: return 'período';
    }
  };

  return (
    <div className="space-y-6">
      <Header showFilter showSearch />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingAppointments ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Agendamentos hoje"
              value={todayAppointments?.length || 0}
              subtitle={`${todayAppointments?.filter(a => a.status === 'completed').length || 0} concluídos`}
              icon={<Calendar className="h-5 w-5 text-primary" />}
              variant="primary"
            />
            <StatCard
              title={`Faturamento ${getPeriodLabel()}`}
              value={formatCurrency(stats.revenue)}
              icon={<DollarSign className="h-5 w-5 text-success" />}
              trend={stats.revenue > 0 ? { value: 12, isPositive: true } : undefined}
              variant="success"
            />
            <StatCard
              title="Tempo atendido"
              value={`${stats.hoursWorked}h`}
              subtitle={`${stats.completedCount} sessões`}
              icon={<Clock className="h-5 w-5 text-primary" />}
            />
            <StatCard
              title="Materiais baixos"
              value={lowStockMaterials?.length || 0}
              subtitle={lowStockMaterials?.length ? 'Itens precisam reposição' : 'Estoque OK'}
              icon={<AlertTriangle className={`h-5 w-5 ${lowStockMaterials?.length ? 'text-warning' : 'text-success'}`} />}
              variant={lowStockMaterials?.length ? 'warning' : 'default'}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loadingAppointments ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <RevenueChart appointments={appointments || []} />
            <TimeWorkedChart appointments={appointments || []} />
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's appointments */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Agenda de Hoje</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <Button onClick={() => setShowAppointmentModal(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Agendar</span>
              </Button>
            </div>

            {loadingToday ? (
              <SkeletonList count={3} />
            ) : todayAppointments && todayAppointments.length > 0 ? (
              <TodayAppointments appointments={todayAppointments} />
            ) : (
              <EmptyState
                icon={Calendar}
                title="Sem agendamentos hoje"
                description="Aproveite para organizar seu estúdio ou agendar novos clientes"
                action={
                  <Button onClick={() => setShowAppointmentModal(true)} size="sm" variant="outline">
                    Agendar cliente
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Low stock alert */}
        <div>
          {loadingStock ? (
            <SkeletonCard className="h-full" />
          ) : (
            <LowStockAlert materials={lowStockMaterials || []} />
          )}
        </div>
      </div>

      <AppointmentModal 
        open={showAppointmentModal} 
        onOpenChange={setShowAppointmentModal}
      />
    </div>
  );
}
