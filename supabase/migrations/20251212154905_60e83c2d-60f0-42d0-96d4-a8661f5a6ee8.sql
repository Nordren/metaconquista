-- Add user_id column to vendedores table to link sellers to user accounts
ALTER TABLE public.vendedores 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_vendedores_user_id ON public.vendedores(user_id);

-- Update RLS policy to allow vendedores to see their own data highlighted
DROP POLICY IF EXISTS "Anyone can view vendedores" ON public.vendedores;

CREATE POLICY "Authenticated users can view vendedores"
ON public.vendedores
FOR SELECT
TO authenticated
USING (true);