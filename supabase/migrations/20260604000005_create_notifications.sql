-- ─────────────────────────────────────────────────────────────
-- Tabela de notificações do sistema
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  type        TEXT        NOT NULL
              CHECK (type IN ('order_status', 'verification', 'message', 'admin')),
  read        BOOLEAN     NOT NULL DEFAULT false,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, read)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuário vê as próprias notificações
CREATE POLICY "users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Usuário pode marcar como lida (UPDATE read)
CREATE POLICY "users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin vê todas as notificações
CREATE POLICY "admins view all notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Inserção apenas via SECURITY DEFINER (triggers e service_role).
-- Usuários não criam notificações diretamente.

-- Realtime para push instantâneo
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─────────────────────────────────────────────────────────────
-- Trigger: cria notificação quando status de pedido muda
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
BEGIN
  -- Só age quando o status realmente mudou
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'preparando' THEN
      v_title := 'Pedido sendo preparado 📦';
      v_body  := 'Sua compra em ' || COALESCE(NEW.store_name, 'sua loja') || ' está sendo separada.';
    WHEN 'saiu' THEN
      v_title := 'Pedido saiu para entrega 🛵';
      v_body  := 'Seu pedido da ' || COALESCE(NEW.store_name, 'loja') || ' está a caminho!';
    WHEN 'entregue' THEN
      v_title := 'Pedido entregue! ✅';
      v_body  := 'Sua compra em ' || COALESCE(NEW.store_name, 'sua loja') || ' foi entregue com sucesso.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, title, body, type, payload)
  VALUES (
    NEW.buyer_id,
    v_title,
    v_body,
    'order_status',
    jsonb_build_object(
      'order_id',   NEW.id,
      'store_name', NEW.store_name,
      'status',     NEW.status
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_notification ON public.orders;
CREATE TRIGGER trg_order_status_notification
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- ─────────────────────────────────────────────────────────────
-- Trigger: notifica lojista quando verificação é aprovada/rejeitada
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_verification_result()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'approved' THEN
      v_title := 'Loja verificada! 🎉';
      v_body  := 'Sua loja ' || COALESCE(NEW.store_name, '') ||
                 ' recebeu o selo de verificação. Acesso ao painel liberado.';
    WHEN 'rejected' THEN
      v_title := 'Verificação não aprovada';
      v_body  := 'Sua solicitação de verificação foi analisada. Acesse o painel para ver o motivo e reenviar.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, title, body, type, payload)
  VALUES (
    NEW.seller_id,
    v_title,
    v_body,
    'verification',
    jsonb_build_object(
      'verification_id', NEW.id,
      'store_name',      NEW.store_name,
      'status',          NEW.status,
      'rejection_reason', NEW.rejection_reason
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verification_notification ON public.seller_verifications;
CREATE TRIGGER trg_verification_notification
  AFTER UPDATE OF status ON public.seller_verifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_verification_result();
