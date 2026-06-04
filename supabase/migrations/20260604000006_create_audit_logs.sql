-- ─────────────────────────────────────────────────────────────
-- Tabela de logs de auditoria
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx     ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx     ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx      ON public.audit_logs(action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin lê todos os logs
CREATE POLICY "admins can read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Usuários autenticados podem inserir os próprios logs (ações client-side)
CREATE POLICY "users can insert own audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ─────────────────────────────────────────────────────────────
-- Trigger: loga mudança de status de pedido (server-side)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    NULL, -- lojista não está no contexto do trigger; guardamos via details
    'order_status_changed',
    'order',
    NEW.id::TEXT,
    jsonb_build_object(
      'from_status', OLD.status,
      'to_status',   NEW.status,
      'store_name',  NEW.store_name,
      'buyer_id',    NEW.buyer_id,
      'total',       NEW.total
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_order_status ON public.orders;
CREATE TRIGGER trg_audit_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_order_status_change();

-- ─────────────────────────────────────────────────────────────
-- Trigger: loga decisão de verificação de lojista
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_verification_decision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected', 'in_review') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    NEW.reviewed_by,
    CASE NEW.status
      WHEN 'approved'  THEN 'verification_approved'
      WHEN 'rejected'  THEN 'verification_rejected'
      ELSE 'verification_in_review'
    END,
    'seller_verification',
    NEW.id::TEXT,
    jsonb_build_object(
      'seller_id',        NEW.seller_id,
      'store_name',       NEW.store_name,
      'rejection_reason', NEW.rejection_reason
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_verification ON public.seller_verifications;
CREATE TRIGGER trg_audit_verification
  AFTER UPDATE OF status ON public.seller_verifications
  FOR EACH ROW EXECUTE FUNCTION public.audit_verification_decision();
