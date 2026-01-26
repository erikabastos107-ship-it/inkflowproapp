import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Appointment } from '@/types/database';
import { useFilter } from '@/contexts/FilterContext';

interface TimeWorkedChartProps {
  appointments: Appointment[];
}

export function TimeWorkedChart({ appointments }: TimeWorkedChartProps) {
  const { dateRange } = useFilter();

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayAppointments = appointments.filter(a => {
        const appointmentDate = startOfDay(new Date(a.start_at));
        return appointmentDate.getTime() === dayStart.getTime() && a.status === 'completed';
      });

      const hours = dayAppointments.reduce((sum, a) => sum + (a.duration_min || 60), 0) / 60;

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        fullDate: format(day, "d 'de' MMM", { locale: ptBR }),
        hours: Math.round(hours * 10) / 10
      };
    });
  }, [appointments, dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-border/50">
          <p className="text-sm text-muted-foreground">{payload[0]?.payload?.fullDate}</p>
          <p className="text-lg font-semibold text-foreground">
            {payload[0].value}h trabalhadas
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Tempo Atendido</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="hours"
              fill="hsl(68, 100%, 50%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
