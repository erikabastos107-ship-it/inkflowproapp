import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BusinessHours } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useBusinessHours() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['businessHours', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('weekday', { ascending: true });

      if (error) throw error;
      return data as BusinessHours[];
    },
    enabled: !!user
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours: Array<Partial<BusinessHours> & { id: string }>) => {
      for (const hour of hours) {
        const { id, ...updates } = hour;
        const { error } = await supabase
          .from('business_hours')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessHours'] });
      toast.success('Horários atualizados!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });
}
