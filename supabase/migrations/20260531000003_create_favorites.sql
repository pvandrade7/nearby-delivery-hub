-- Tabela de lojas favoritas por usuário
CREATE TABLE IF NOT EXISTS public.favorites (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id     TEXT        NOT NULL,
  store_name   TEXT        NOT NULL DEFAULT '',
  store_image  TEXT        DEFAULT '',
  store_category TEXT      DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Usuário gerencia apenas seus próprios favoritos
CREATE POLICY "users can manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
