import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statCardVariants = cva(
  'glass-card p-5 sm:p-6 transition-all duration-300 hover:bg-card/70',
  {
    variants: {
      variant: {
        default: '',
        success: 'border-success/20',
        warning: 'border-warning/20',
        danger: 'border-destructive/20',
        primary: 'border-primary/20',
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

interface StatCardProps extends VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  trend,
  variant,
  className 
}: StatCardProps) {
  return (
    <div className={cn(statCardVariants({ variant }), className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{title}</span>
        {icon && (
          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="stat-number text-foreground">{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.isPositive 
                ? 'bg-success/20 text-success' 
                : 'bg-destructive/20 text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
