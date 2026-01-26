import { Link } from 'react-router-dom';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { Material } from '@/types/database';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface LowStockAlertProps {
  materials: Material[];
}

export function LowStockAlert({ materials }: LowStockAlertProps) {
  if (!materials.length) {
    return (
      <div className="glass-card p-5 sm:p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-success" />
          <h3 className="text-lg font-semibold text-foreground">Estoque OK</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Todos os materiais estão com níveis adequados.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 sm:p-6 h-full border-warning/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">Baixo Estoque</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">
          {materials.length} {materials.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {materials.slice(0, 4).map((material) => (
          <div 
            key={material.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{material.name}</p>
              <p className="text-xs text-muted-foreground">{material.category}</p>
            </div>
            <div className="text-right">
              <span className={cn(
                'text-sm font-semibold',
                material.qty_current <= 0 ? 'text-destructive' : 'text-warning'
              )}>
                {material.qty_current} {material.unit}
              </span>
              <p className="text-xs text-muted-foreground">mín: {material.min_qty}</p>
            </div>
          </div>
        ))}
      </div>

      {materials.length > 4 && (
        <p className="text-xs text-muted-foreground text-center mb-3">
          +{materials.length - 4} outros itens
        </p>
      )}

      <Link to="/app/materiais">
        <Button variant="outline" size="sm" className="w-full gap-2">
          Ver todos <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
