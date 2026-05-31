-- Tabela de produtos cadastrados pelos lojistas
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT        DEFAULT '',
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  category    TEXT        DEFAULT '',
  image       TEXT        DEFAULT '',
  seller_kind TEXT        DEFAULT 'store',
  active      BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS products_seller_id_idx ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS products_category_idx  ON public.products(category);

-- Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver produtos ativos
CREATE POLICY "anyone can view active products"
  ON public.products FOR SELECT
  USING (active = true);

-- Lojista gerencia seus próprios produtos (INSERT, UPDATE, DELETE)
CREATE POLICY "sellers can manage own products"
  ON public.products FOR ALL
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);
