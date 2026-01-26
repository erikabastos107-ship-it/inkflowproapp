import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Mail, Phone, Instagram, Calendar, DollarSign } from 'lucide-react';
import { useClientHistory } from '@/hooks/useClients';
import { Client } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SkeletonList } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface ClientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export function ClientDetailsModal({ open, onOpenChange, client }: ClientDetailsModalProps) {
  const { data: history, isLoading } = useClientHistory(client.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalSpent = history?.reduce((sum, apt) => sum + (apt.price_final || apt.price_expected || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Cliente</DialogTitle>
        </DialogHeader>

        {/* Client info */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {client.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground">{client.name}</h3>
            <div className="space-y-1 mt-2">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.instagram && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Instagram className="h-4 w-4" />
                  <span>@{client.instagram.replace('@', '')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 text-center">
            <Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{history?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Atendimentos</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 text-center">
            <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Total gasto</p>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="p-4 rounded-xl bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-1">Observações</p>
            <p className="text-sm text-muted-foreground">{client.notes}</p>
          </div>
        )}

        {/* History */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Histórico de Atendimentos</h4>
          {isLoading ? (
            <SkeletonList count={3} />
          ) : history && history.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(apt.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">{apt.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">
                      {formatCurrency(apt.price_final || apt.price_expected)}
                    </p>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      apt.status === 'completed' && 'bg-success/20 text-success',
                      apt.status === 'cancelled' && 'bg-destructive/20 text-destructive',
                      apt.status !== 'completed' && apt.status !== 'cancelled' && 'bg-muted text-muted-foreground'
                    )}>
                      {apt.status === 'completed' ? 'Concluído' : apt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Sem histórico"
              description="Este cliente ainda não possui atendimentos"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
