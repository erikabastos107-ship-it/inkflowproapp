import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFilter } from '@/contexts/FilterContext';
import { PeriodFilter } from '@/types/database';
import { cn } from '@/lib/utils';
const periods: {
  value: PeriodFilter;
  label: string;
}[] = [{
  value: 'daily',
  label: 'Hoje'
}, {
  value: 'weekly',
  label: 'Semana'
}, {
  value: 'monthly',
  label: 'Mês'
}, {
  value: 'yearly',
  label: 'Ano'
}];
export function PeriodFilterSelector() {
  const {
    periodFilter,
    setPeriodFilter,
    customRange,
    setCustomRange,
    dateRange
  } = useFilter();
  const [showCustom, setShowCustom] = useState(false);
  const handlePeriodChange = (period: PeriodFilter) => {
    if (period === 'custom') {
      setShowCustom(true);
    } else {
      setPeriodFilter(period);
      setShowCustom(false);
    }
  };
  return <div className="flex-wrap gap-2 flex items-center justify-end">
      <div className="flex bg-muted/50 rounded-xl p-1">
        {periods.map(period => <button key={period.value} onClick={() => handlePeriodChange(period.value)} className={cn('px-3 py-1.5 text-sm font-medium rounded-lg transition-all', periodFilter === period.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {period.label}
          </button>)}
      </div>

      <Popover open={showCustom} onOpenChange={setShowCustom}>
        <PopoverTrigger asChild>
          <Button variant={periodFilter === 'custom' ? 'default' : 'outline'} size="sm" className={cn('h-9 gap-2', periodFilter === 'custom' && 'bg-primary text-primary-foreground')}>
            <CalendarIcon className="h-4 w-4" />
            {periodFilter === 'custom' && customRange ? <span className="text-xs">
                {format(customRange.from, 'dd/MM', {
              locale: ptBR
            })} - {format(customRange.to, 'dd/MM', {
              locale: ptBR
            })}
              </span> : <span className="hidden sm:inline">Período</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover" align="end">
          <Calendar mode="range" selected={{
          from: dateRange.from,
          to: dateRange.to
        }} onSelect={range => {
          if (range?.from && range?.to) {
            setCustomRange({
              from: range.from,
              to: range.to
            });
            setPeriodFilter('custom');
            setShowCustom(false);
          }
        }} locale={ptBR} numberOfMonths={1} />
        </PopoverContent>
      </Popover>
    </div>;
}