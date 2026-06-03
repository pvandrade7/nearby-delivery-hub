
-- Tabela de endereços salvos por usuário
CREATE TABLE public.addresses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label        text        NOT NULL DEFAULT 'Casa',
  street       text        NOT NULL DEFAULT '',
  number       text        NOT NULL DEFAULT '',
  neighborhood text        NOT NULL DEFAULT '',
  city         text        NOT NULL DEFAULT '',
  state        text        NOT NULL DEFAULT '',
  zip_code     text        NOT NULL DEFAULT '',
  complement   text        NOT NULL DEFAULT '',
  is_default   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own addresses"
ON public.addresses FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users can insert own addresses"
ON public.addresses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own addresses"
ON public.addresses FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own addresses"
ON public.addresses FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX addresses_user_id_idx ON public.addresses (user_id);
