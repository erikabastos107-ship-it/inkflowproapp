import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Plus, Eye, Edit, Archive, User, Mail, Phone, Instagram } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useClients, useArchiveClient } from '@/hooks/useClients';
import { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ClientModal } from '@/components/clients/ClientModal';
import { ClientDetailsModal } from '@/components/clients/ClientDetailsModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useClients(search);
  const archiveClient = useArchiveClient();

  const handleArchive = (client: Client) => {
    if (confirm(`Arquivar cliente ${client.name}?`)) {
      archiveClient.mutate(client.id);
    }
  };

  return (
    <div className="space-y-6">
      <Header showFilter={false} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou Instagram..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-glass"
          />
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Clients table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonList count={5} />
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Email</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">Instagram</TableHead>
                  <TableHead className="text-muted-foreground hidden xl:table-cell">Cadastrado</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground sm:hidden">{client.phone || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {client.email || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {client.phone || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {client.instagram ? `@${client.instagram.replace('@', '')}` : '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingClient(client)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedClient(client)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchive(client)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={User}
              title="Nenhum cliente encontrado"
              description={search ? 'Tente buscar com outros termos' : 'Comece cadastrando seu primeiro cliente'}
              action={
                <Button onClick={() => setShowModal(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Cadastrar cliente
                </Button>
              }
            />
          </div>
        )}
      </div>

      <ClientModal
        open={showModal || !!selectedClient}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setSelectedClient(null);
        }}
        client={selectedClient || undefined}
      />

      {viewingClient && (
        <ClientDetailsModal
          open={!!viewingClient}
          onOpenChange={(open) => !open && setViewingClient(null)}
          client={viewingClient}
        />
      )}
    </div>
  );
}
