-- Tabela de pedidos reais (substitui o localStorage)
CREATE TABLE IF NOT EXISTS public.orders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id     TEXT,
  store_name   TEXT        NOT NULL DEFAULT '',
  items        JSONB       NOT NULL DEFAULT '[]',
  total        NUMERIC(10,2) NOT NULL DEFAULT 0,
  address      TEXT,
  payment      TEXT        NOT NULL DEFAULT '',
  fulfillment  TEXT        NOT NULL DEFAULT '',
  status       TEXT        NOT NULL DEFAULT 'aprovado',
  estimated_min INTEGER    DEFAULT 25,
  estimated_max INTEGER    DEFAULT 40,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx   ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_store_name_idx ON public.orders(store_name);
CREATE INDEX IF NOT EXISTS orders_status_idx     ON public.orders(status);

-- Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Cliente vê seus próprios pedidos
CREATE POLICY "buyers can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

-- Cliente insere seus próprios pedidos
CREATE POLICY "buyers can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Lojista vê pedidos da sua loja (store_name bate com extras.storeName)
CREATE POLICY "sellers can view store orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.extras->>'storeName') = orders.store_name
        AND 'lojista' = ANY(profiles.roles)
    )
  );

-- Lojista atualiza status dos pedidos da sua loja
CREATE POLICY "sellers can update order status"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.extras->>'storeName') = orders.store_name
        AND 'lojista' = ANY(profiles.roles)
    )
  );

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
