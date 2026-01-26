import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Building2, Clock, Bell, Save } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessHours, useUpdateBusinessHours } from '@/hooks/useBusinessHours';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  phone: z.string().optional(),
  studio_name: z.string().optional(),
  currency: z.string(),
  stock_notifications: z.boolean(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const weekdays = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sab' },
];

export default function ConfiguracoesPage() {
  const { profile, updateProfile } = useAuth();
  const { data: businessHours, isLoading: loadingHours } = useBusinessHours();
  const updateBusinessHours = useUpdateBusinessHours();
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      phone: profile?.phone || '',
      studio_name: profile?.studio_name || '',
      currency: profile?.currency || 'BRL',
      stock_notifications: profile?.stock_notifications ?? true,
    },
  });

  const [hours, setHours] = useState<Record<number, { open: string; close: string; closed: boolean }>>(() => {
    const initial: Record<number, { open: string; close: string; closed: boolean }> = {};
    businessHours?.forEach(bh => {
      initial[bh.weekday] = {
        open: bh.open_time || '09:00',
        close: bh.close_time || '18:00',
        closed: bh.is_closed,
      };
    });
    return initial;
  });

  // Update hours when businessHours loads
  if (businessHours && Object.keys(hours).length === 0) {
    const newHours: Record<number, { open: string; close: string; closed: boolean }> = {};
    businessHours.forEach(bh => {
      newHours[bh.weekday] = {
        open: bh.open_time || '09:00',
        close: bh.close_time || '18:00',
        closed: bh.is_closed,
      };
    });
    if (Object.keys(newHours).length > 0) {
      setHours(newHours);
    }
  }

  const handleProfileSubmit = async (data: ProfileForm) => {
    setSaving(true);
    const { error } = await updateProfile(data);
    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar');
    } else {
      toast.success('Perfil atualizado!');
    }
  };

  const handleHoursSave = async () => {
    if (!businessHours) return;

    setSaving(true);
    
    const updates = businessHours.map(bh => ({
      id: bh.id,
      open_time: hours[bh.weekday]?.open || '09:00',
      close_time: hours[bh.weekday]?.close || '18:00',
      is_closed: hours[bh.weekday]?.closed ?? false,
    }));

    await updateBusinessHours.mutateAsync(updates);
    setSaving(false);
  };

  const updateHour = (day: number, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <Header showFilter={false} />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-muted/50 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="studio" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Estúdio</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Preferências</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Seu Perfil</h2>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.photo_url || undefined} />
                  <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  Alterar foto
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    className="input-glass"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    className="input-glass"
                    {...form.register('phone')}
                  />
                </div>

                <Button type="submit" className="gap-2" disabled={saving}>
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="studio">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Informações do Estúdio</h2>

            <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="studio_name">Nome do Estúdio</Label>
                <Input
                  id="studio_name"
                  placeholder="Ex: Ink Art Studio"
                  className="input-glass"
                  {...form.register('studio_name')}
                />
              </div>

              <Button type="submit" className="gap-2" disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="hours">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Horário de Funcionamento</h2>
              <Button onClick={handleHoursSave} className="gap-2" disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>

            {loadingHours ? (
              <SkeletonCard />
            ) : (
              <div className="space-y-3 max-w-xl">
                {weekdays.map((day) => (
                  <div key={day.value} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-20 text-sm font-medium">{day.label}</div>
                    <Switch
                      checked={!hours[day.value]?.closed}
                      onCheckedChange={(checked) => updateHour(day.value, 'closed', !checked)}
                    />
                    {!hours[day.value]?.closed ? (
                      <>
                        <Input
                          type="time"
                          value={hours[day.value]?.open || '09:00'}
                          onChange={(e) => updateHour(day.value, 'open', e.target.value)}
                          className="w-24 text-center input-glass"
                        />
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={hours[day.value]?.close || '18:00'}
                          onChange={(e) => updateHour(day.value, 'close', e.target.value)}
                          className="w-24 text-center input-glass"
                        />
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Preferências</h2>

            <div className="space-y-4 max-w-md">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <Label>Notificações de Estoque</Label>
                  <p className="text-xs text-muted-foreground">Receber alertas quando materiais estiverem acabando</p>
                </div>
                <Switch
                  checked={form.watch('stock_notifications')}
                  onCheckedChange={(checked) => form.setValue('stock_notifications', checked)}
                />
              </div>

              <Button onClick={form.handleSubmit(handleProfileSubmit)} className="gap-2" disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar Preferências
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
