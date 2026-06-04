-- ─────────────────────────────────────────────────────────────
-- Tabela de pagamentos — rastreia cada cobrança gerada
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  gateway      TEXT        NOT NULL DEFAULT 'simulation'
               CHECK (gateway IN ('mercadopago', 'asaas', 'simulation')),
  external_id  TEXT,                    -- ID do pagamento no gateway
  method       TEXT        NOT NULL DEFAULT 'pix'
               CHECK (method IN ('pix', 'credit', 'debit', 'cash')),
  amount       NUMERIC(10,2) NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  pix_code     TEXT,                    -- código copia-e-cola
  pix_qr_url   TEXT,                    -- URL do QR code (base64 ou link)
  expires_at   TIMESTAMPTZ,
  paid_at      TIMESTAMPTZ,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx    ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx     ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_external_id_idx ON public.payments(external_id);
CREATE INDEX IF NOT EXISTS payments_status_idx      ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Usuário vê seus próprios pagamentos
CREATE POLICY "users view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins veem todos
CREATE POLICY "admins view all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Inserção e atualização apenas via service_role (Edge Functions)
-- Clientes não manipulam registros de pagamento diretamente.

-- Realtime para auto-confirmar no Checkout quando webhook chegar
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
