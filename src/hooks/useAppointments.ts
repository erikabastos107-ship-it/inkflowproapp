import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, AppointmentStatus } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useAppointments(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments', user?.id, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*)
        `)
        .order('start_at', { ascending: true });

      if (startDate) {
        query = query.gte('start_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('start_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user
  });
}

export function useTodayAppointments() {
  const { user } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useQuery({
    queryKey: ['appointments', 'today', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*)
        `)
        .gte('start_at', today.toISOString())
        .lt('start_at', tomorrow.toISOString())
        .order('start_at', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...appointment, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar agendamento: ' + error.message);
    }
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, price_final }: { id: string; status: AppointmentStatus; price_final?: number }) => {
      const updates: Partial<Appointment> = { status };
      if (price_final !== undefined) {
        updates.price_final = price_final;
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento removido!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover: ' + error.message);
    }
  });
}
