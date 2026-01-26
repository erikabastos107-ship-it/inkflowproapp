import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Instagram } from 'lucide-react';
import { useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { Client } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  skin_tone: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
}

const skinTones = [
  { value: 'clara', label: 'Clara' },
  { value: 'media', label: 'Média' },
  { value: 'morena', label: 'Morena' },
  { value: 'negra', label: 'Negra' },
];

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isEditing = !!client;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      instagram: '',
      skin_tone: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        instagram: client.instagram || '',
        skin_tone: client.skin_tone || '',
        notes: client.notes || '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        instagram: '',
        skin_tone: '',
        notes: '',
      });
    }
  }, [client, form]);

  const handleSubmit = async (data: FormData) => {
    const clientData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      instagram: data.instagram || null,
      skin_tone: data.skin_tone || null,
      notes: data.notes || null,
    };

    if (isEditing && client) {
      await updateClient.mutateAsync({ id: client.id, ...clientData });
    } else {
      await createClient.mutateAsync(clientData);
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Nome completo"
                className="pl-10 input-glass"
                {...form.register('name')}
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                className="pl-10 input-glass"
                {...form.register('email')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className="pl-10 input-glass"
                  {...form.register('phone')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="instagram"
                  placeholder="@usuario"
                  className="pl-10 input-glass"
                  {...form.register('instagram')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor da Pele</Label>
            <Select
              value={form.watch('skin_tone')}
              onValueChange={(value) => form.setValue('skin_tone', value)}
            >
              <SelectTrigger className="input-glass">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {skinTones.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    {tone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Alergias, preferências, etc..."
              className="input-glass resize-none"
              rows={3}
              {...form.register('notes')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createClient.isPending || updateClient.isPending}>
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
