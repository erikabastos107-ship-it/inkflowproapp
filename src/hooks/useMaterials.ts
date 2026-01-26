import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Material, MaterialConsumption } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useMaterials() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['materials', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Material[];
    },
    enabled: !!user
  });
}

export function useLowStockMaterials() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['materials', 'low-stock', user?.id],
    queryFn: async () => {
      // Fetch all materials and filter in JavaScript since Supabase
      // doesn't support comparing two columns directly in a filter
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('qty_current', { ascending: true });

      if (error) throw error;
      
      // Filter materials where qty_current <= min_qty
      return (data as Material[]).filter(m => (m.qty_current ?? 0) <= (m.min_qty ?? 0));
    },
    enabled: !!user
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (material: Omit<Material, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materials')
        .insert({ ...material, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material adicionado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar: ' + error.message);
    }
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Material> & { id: string }) => {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material removido!');
    }
  });
}

export function useConsumeMaterials() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ appointmentId, consumption }: { 
      appointmentId: string; 
      consumption: Array<{ material_id: string; qty_used: number }> 
    }) => {
      // Insert consumption records
      const consumptionRecords = consumption.map(c => ({
        user_id: user!.id,
        appointment_id: appointmentId,
        material_id: c.material_id,
        qty_used: c.qty_used
      }));

      const { error: insertError } = await supabase
        .from('material_consumption')
        .insert(consumptionRecords);

      if (insertError) throw insertError;

      // Update material quantities
      for (const item of consumption) {
        const { data: material } = await supabase
          .from('materials')
          .select('qty_current')
          .eq('id', item.material_id)
          .single();

        if (material) {
          const newQty = Math.max(0, material.qty_current - item.qty_used);
          await supabase
            .from('materials')
            .update({ qty_current: newQty })
            .eq('id', item.material_id);
        }
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Materiais atualizados!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar consumo: ' + error.message);
    }
  });
}
