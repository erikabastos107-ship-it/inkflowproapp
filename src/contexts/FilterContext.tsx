import React, { createContext, useContext, useState, useMemo } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { PeriodFilter, DateRange } from '@/types/database';

interface FilterContextType {
  periodFilter: PeriodFilter;
  setPeriodFilter: (period: PeriodFilter) => void;
  customRange: DateRange | null;
  setCustomRange: (range: DateRange | null) => void;
  dateRange: DateRange;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('weekly');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const dateRange = useMemo((): DateRange => {
    const now = new Date();

    if (periodFilter === 'custom' && customRange) {
      return customRange;
    }

    switch (periodFilter) {
      case 'daily':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'weekly':
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'monthly':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'yearly':
        return { from: startOfYear(now), to: endOfYear(now) };
      default:
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    }
  }, [periodFilter, customRange]);

  return (
    <FilterContext.Provider value={{
      periodFilter,
      setPeriodFilter,
      customRange,
      setCustomRange,
      dateRange
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
}
