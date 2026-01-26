-- Add UPDATE policy for material_consumption table
CREATE POLICY "Users can update own consumption"
ON public.material_consumption
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);