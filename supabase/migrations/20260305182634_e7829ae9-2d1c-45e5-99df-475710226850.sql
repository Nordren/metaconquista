-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Service role can manage vendedores" ON public.vendedores;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Authenticated users can view vendedores"
ON public.vendedores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage vendedores"
ON public.vendedores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);