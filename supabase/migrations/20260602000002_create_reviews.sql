-- Sistema de avaliações do marketplace.
-- Clientes avaliam lojas (perfis com role=lojista) após receberem pedidos.

CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id    UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_name  TEXT          NOT NULL DEFAULT '',
  rating      INTEGER       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT          NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (store_id, buyer_id)         -- um cliente avalia cada loja uma vez
);

CREATE INDEX IF NOT EXISTS reviews_store_id_idx ON public.reviews (store_id);
CREATE INDEX IF NOT EXISTS reviews_buyer_id_idx ON public.reviews (buyer_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler avaliações (necessário para clientes verem reviews)
CREATE POLICY "reviews are publicly readable"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

-- Clientes podem criar avaliações (somente como si mesmos)
CREATE POLICY "buyers can insert reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Clientes podem editar suas próprias avaliações
CREATE POLICY "buyers can update own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING  (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- Clientes podem excluir suas próprias avaliações
CREATE POLICY "buyers can delete own reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = buyer_id);
