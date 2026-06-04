-- Tabela de solicitações de verificação manual de lojistas
CREATE TABLE IF NOT EXISTS public.seller_verifications (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name         TEXT,
  store_description  TEXT,
  store_category     TEXT,
  business_duration  TEXT,
  city               TEXT,
  neighborhood       TEXT,
  instagram          TEXT,
  facebook           TEXT,
  tiktok             TEXT,
  whatsapp           TEXT,
  website            TEXT,
  observations       TEXT,
  no_cnpj_reason     TEXT,
  status             TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in_review','approved','rejected')),
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at        TIMESTAMPTZ,
  reviewed_by        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason   TEXT
);

CREATE INDEX IF NOT EXISTS seller_verifications_seller_id_idx ON public.seller_verifications(seller_id);
CREATE INDEX IF NOT EXISTS seller_verifications_status_idx    ON public.seller_verifications(status);

ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

-- Lojista vê apenas as próprias solicitações
CREATE POLICY "sellers view own verifications"
  ON public.seller_verifications FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

-- Lojista cria apenas as próprias solicitações
CREATE POLICY "sellers insert own verifications"
  ON public.seller_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Admin vê todas as solicitações
CREATE POLICY "admins view all verifications"
  ON public.seller_verifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin atualiza status/revisão de qualquer solicitação
CREATE POLICY "admins update verifications"
  ON public.seller_verifications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Arquivos de evidências das solicitações de verificação
CREATE TABLE IF NOT EXISTS public.seller_verification_files (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id  UUID        NOT NULL REFERENCES public.seller_verifications(id) ON DELETE CASCADE,
  file_url         TEXT        NOT NULL,
  file_type        TEXT        NOT NULL
                   CHECK (file_type IN ('store_photo','product_photo','document')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seller_verif_files_verif_id_idx ON public.seller_verification_files(verification_id);

ALTER TABLE public.seller_verification_files ENABLE ROW LEVEL SECURITY;

-- Lojista vê arquivos das próprias solicitações
CREATE POLICY "sellers view own verif files"
  ON public.seller_verification_files FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.seller_verifications sv
      WHERE sv.id = seller_verification_files.verification_id
        AND sv.seller_id = auth.uid()
    )
  );

-- Lojista insere arquivos nas próprias solicitações
CREATE POLICY "sellers insert own verif files"
  ON public.seller_verification_files FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seller_verifications sv
      WHERE sv.id = verification_id
        AND sv.seller_id = auth.uid()
    )
  );

-- Admin vê todos os arquivos
CREATE POLICY "admins view all verif files"
  ON public.seller_verification_files FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
