import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment } from '@/types/database';
import { useFilter } from '@/contexts/FilterContext';

interface RevenueChartProps {
  appointments: Appointment[];
}

export function RevenueChart({ appointments }: RevenueChartProps) {
  const { dateRange } = useFilter();

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayAppointments = appointments.filter(a => {
        const appointmentDate = startOfDay(new Date(a.start_at));
        return appointmentDate.getTime() === dayStart.getTime() && a.status === 'completed';
      });

      const revenue = dayAppointments.reduce((sum, a) => sum + (a.price_final || a.price_expected || 0), 0);

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        fullDate: format(day, "d 'de' MMM", { locale: ptBR }),
        revenue
      };
    });
  }, [appointments, dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-border/50">
          <p className="text-sm text-muted-foreground">{payload[0]?.payload?.fullDate}</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Faturamento</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(68, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(68, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 20%)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(240, 5%, 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(240, 5%, 55%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(68, 100%, 50%)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
