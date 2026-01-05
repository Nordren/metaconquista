-- Add period (MM-YY) to vendedores so we can store history by month
ALTER TABLE public.vendedores
ADD COLUMN IF NOT EXISTS period TEXT NOT NULL DEFAULT to_char(now(), 'MM-YY');

-- Ensure one vendedor per (period, nome, loja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vendedores_period_nome_loja_key'
  ) THEN
    ALTER TABLE public.vendedores
      ADD CONSTRAINT vendedores_period_nome_loja_key UNIQUE (period, nome, loja);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendedores_period ON public.vendedores (period);

-- Table that persists user <-> vendedor linkage across months
CREATE TABLE IF NOT EXISTS public.vendedor_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  loja TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vendedor_links_user_id_key UNIQUE (user_id),
  CONSTRAINT vendedor_links_nome_loja_key UNIQUE (nome, loja)
);

ALTER TABLE public.vendedor_links ENABLE ROW LEVEL SECURITY;

-- Admins can manage all links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='vendedor_links' AND policyname='Admins can manage vendedor links'
  ) THEN
    CREATE POLICY "Admins can manage vendedor links"
    ON public.vendedor_links
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Users can view their own link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='vendedor_links' AND policyname='Users can view own vendedor link'
  ) THEN
    CREATE POLICY "Users can view own vendedor link"
    ON public.vendedor_links
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Keep updated_at in sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendedor_links_updated_at'
  ) THEN
    CREATE TRIGGER update_vendedor_links_updated_at
    BEFORE UPDATE ON public.vendedor_links
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;