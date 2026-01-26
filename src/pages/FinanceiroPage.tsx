import { useState, useMemo } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useFilter } from '@/contexts/FilterContext';
import { useAppointments } from '@/hooks/useAppointments';
import { useExpenses } from '@/hooks/useExpenses';
import { Expense, ExpenseCategory } from '@/types/database';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ExpenseModal } from '@/components/finances/ExpenseModal';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

const categoryLabels: Record<ExpenseCategory, string> = {
  rent: 'Aluguel',
  materials: 'Materiais',
  marketing: 'Marketing',
  apps: 'Apps/Software',
  utilities: 'Utilidades',
  other: 'Outros',
};

const categoryColors: Record<ExpenseCategory, string> = {
  rent: 'hsl(0, 72%, 51%)',
  materials: 'hsl(68, 100%, 50%)',
  marketing: 'hsl(200, 100%, 50%)',
  apps: 'hsl(280, 100%, 60%)',
  utilities: 'hsl(38, 92%, 50%)',
  other: 'hsl(240, 5%, 55%)',
};

export default function FinanceiroPage() {
  const { dateRange } = useFilter();
  const { data: appointments, isLoading: loadingAppointments } = useAppointments(dateRange.from, dateRange.to);
  const { data: expenses, isLoading: loadingExpenses } = useExpenses(dateRange.from, dateRange.to);
  const [showModal, setShowModal] = useState(false);

  const stats = useMemo(() => {
    const revenue = appointments?.filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.price_final || a.price_expected || 0), 0) || 0;
    
    const expenseTotal = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    
    return {
      revenue,
      expenses: expenseTotal,
      profit: revenue - expenseTotal,
    };
  }, [appointments, expenses]);

  const revenueChartData = useMemo(() => {
    if (!appointments) return [];
    
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(day => {
      const dayRevenue = appointments
        .filter(a => {
          const aptDate = new Date(a.start_at);
          return aptDate.toDateString() === day.toDateString() && a.status === 'completed';
        })
        .reduce((sum, a) => sum + (a.price_final || a.price_expected || 0), 0);

      const dayExpenses = expenses
        ?.filter(e => new Date(e.date).toDateString() === day.toDateString())
        .reduce((sum, e) => sum + e.amount, 0) || 0;

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        revenue: dayRevenue,
        expenses: dayExpenses,
      };
    });
  }, [appointments, expenses, dateRange]);

  const expensesByCategoryData = useMemo(() => {
    if (!expenses) return [];
    
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byCategory)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        name: categoryLabels[category as ExpenseCategory],
        value,
        color: categoryColors[category as ExpenseCategory],
      }));
  }, [expenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isLoading = loadingAppointments || loadingExpenses;

  return (
    <div className="space-y-6">
      <Header showFilter showSearch={false} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Receita"
              value={formatCurrency(stats.revenue)}
              icon={<TrendingUp className="h-5 w-5 text-success" />}
              variant="success"
            />
            <StatCard
              title="Despesas"
              value={formatCurrency(stats.expenses)}
              icon={<TrendingDown className="h-5 w-5 text-destructive" />}
              variant="danger"
            />
            <StatCard
              title="Lucro"
              value={formatCurrency(stats.profit)}
              icon={<DollarSign className={`h-5 w-5 ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`} />}
              variant={stats.profit >= 0 ? 'success' : 'danger'}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Receita x Despesas</h3>
          {isLoading ? (
            <div className="h-64 skeleton-pulse rounded-xl" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 20%)" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(240, 5%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(240, 5%, 55%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(240, 8%, 12%)',
                      border: '1px solid hsl(240, 6%, 20%)',
                      borderRadius: '0.75rem',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fill="url(#revenueGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Despesas" stroke="hsl(0, 72%, 51%)" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expenses by category */}
        <div className="glass-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          {isLoading ? (
            <div className="h-64 skeleton-pulse rounded-xl" />
          ) : expensesByCategoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {expensesByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(240, 8%, 12%)',
                      border: '1px solid hsl(240, 6%, 20%)',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={DollarSign} title="Sem despesas" description="Nenhuma despesa registrada no período" />
          )}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Despesas Recentes</h3>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 skeleton-pulse rounded-xl" />
            ))}
          </div>
        ) : expenses && expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.slice(0, 10).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${categoryColors[expense.category]}20` }}
                  >
                    <DollarSign className="h-5 w-5" style={{ color: categoryColors[expense.category] }} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {expense.description || categoryLabels[expense.category]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-destructive">-{formatCurrency(expense.amount)}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {categoryLabels[expense.category]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={DollarSign}
            title="Sem despesas"
            description="Registre suas despesas para controlar melhor suas finanças"
            action={
              <Button onClick={() => setShowModal(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar despesa
              </Button>
            }
          />
        )}
      </div>

      <ExpenseModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
