-- Create vendedores table
CREATE TABLE public.vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  loja TEXT NOT NULL,
  meta NUMERIC NOT NULL DEFAULT 0,
  realizado NUMERIC NOT NULL DEFAULT 0,
  percentual NUMERIC NOT NULL DEFAULT 0,
  venda_dia NUMERIC NOT NULL DEFAULT 0,
  posicao INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- Allow public read access (dashboard is public)
CREATE POLICY "Anyone can view vendedores" 
ON public.vendedores 
FOR SELECT 
USING (true);

-- Only service role can insert/update (for sync function)
CREATE POLICY "Service role can manage vendedores" 
ON public.vendedores 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendedores_updated_at
BEFORE UPDATE ON public.vendedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendedores;