import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Building2, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessHours, useUpdateBusinessHours } from '@/hooks/useBusinessHours';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  studio_name: z.string().optional(),
  phone: z.string().optional(),
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

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { data: businessHours } = useBusinessHours();
  const updateBusinessHours = useUpdateBusinessHours();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState<Record<number, { open: string; close: string; closed: boolean }>>({
    0: { open: '09:00', close: '18:00', closed: true },
    1: { open: '09:00', close: '18:00', closed: false },
    2: { open: '09:00', close: '18:00', closed: false },
    3: { open: '09:00', close: '18:00', closed: false },
    4: { open: '09:00', close: '18:00', closed: false },
    5: { open: '09:00', close: '18:00', closed: false },
    6: { open: '09:00', close: '18:00', closed: true },
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      studio_name: profile?.studio_name || '',
      phone: profile?.phone || '',
    }
  });

  const handleProfileSubmit = async (data: ProfileForm) => {
    setLoading(true);
    const { error } = await updateProfile(data);
    setLoading(false);

    if (error) {
      toast.error('Erro ao salvar perfil');
    } else {
      setStep(2);
    }
  };

  const handleHoursSubmit = async () => {
    if (!businessHours) return;
    
    setLoading(true);
    
    const updates = businessHours.map(bh => ({
      id: bh.id,
      open_time: hours[bh.weekday]?.open || '09:00',
      close_time: hours[bh.weekday]?.close || '18:00',
      is_closed: hours[bh.weekday]?.closed || false,
    }));

    await updateBusinessHours.mutateAsync(updates);
    setStep(3);
    setLoading(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    await updateProfile({ onboarding_done: true });
    setLoading(false);
    toast.success('Configuração concluída!');
    navigate('/app/dashboard');
  };

  const updateHours = (day: number, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium transition-all ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-1 rounded-full ${
                  step > s ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8">
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Seu Perfil</h2>
                <p className="text-sm text-muted-foreground mt-1">Conte-nos sobre você</p>
              </div>

              <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Como você quer ser chamado"
                    className="input-glass"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studio_name">Nome do Estúdio</Label>
                  <Input
                    id="studio_name"
                    placeholder="Ex: Ink Art Studio"
                    className="input-glass"
                    {...form.register('studio_name')}
                  />
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

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Horários</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure seu expediente</p>
              </div>

              <div className="space-y-3 mb-6">
                {weekdays.map((day) => (
                  <div key={day.value} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-16 text-sm font-medium">{day.short}</div>
                    <Switch
                      checked={!hours[day.value]?.closed}
                      onCheckedChange={(checked) => updateHours(day.value, 'closed', !checked)}
                    />
                    {!hours[day.value]?.closed && (
                      <>
                        <Input
                          type="time"
                          value={hours[day.value]?.open || '09:00'}
                          onChange={(e) => updateHours(day.value, 'open', e.target.value)}
                          className="w-24 text-center input-glass"
                        />
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={hours[day.value]?.close || '18:00'}
                          onChange={(e) => updateHours(day.value, 'close', e.target.value)}
                          className="w-24 text-center input-glass"
                        />
                      </>
                    )}
                    {hours[day.value]?.closed && (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleHoursSubmit} className="flex-1 gap-2" disabled={loading}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-success/20 mb-4">
                  <Check className="h-7 w-7 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Tudo pronto!</h2>
                <p className="text-sm text-muted-foreground mt-1">Seu Inkflow está configurado</p>
              </div>

              <div className="glass-card p-4 mb-6 bg-muted/30">
                <h3 className="font-medium text-foreground mb-2">O que você pode fazer agora:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> Agendar seus clientes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> Cadastrar materiais
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> Controlar suas finanças
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleFinish} className="flex-1 gap-2" disabled={loading}>
                  Começar a usar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
