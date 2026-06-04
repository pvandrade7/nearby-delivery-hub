-- Tabela de chamados de suporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email  TEXT,
  user_name   TEXT,
  subject     TEXT        NOT NULL,
  category    TEXT        NOT NULL
              CHECK (category IN ('pedidos','pagamentos','entregas','conta','denuncia','sugestao','duvida','verificacao')),
  status      TEXT        NOT NULL DEFAULT 'aberto'
              CHECK (status IN ('aberto','em_andamento','resolvido','encerrado','aguardando')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx  ON public.support_tickets(status);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado cria chamados (inclusive sem conta — user_id pode ser null)
CREATE POLICY "users can create tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (true);

-- Usuário vê apenas os próprios chamados
CREATE POLICY "users view own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin vê todos os chamados
CREATE POLICY "admins view all tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin atualiza status de qualquer chamado
CREATE POLICY "admins update tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Mensagens dos chamados
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT,
  message     TEXT        NOT NULL,
  is_admin    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx ON public.ticket_messages(ticket_id);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Usuário vê mensagens dos próprios chamados
CREATE POLICY "users view own ticket messages"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_messages.ticket_id
        AND st.user_id = auth.uid()
    )
  );

-- Usuário insere mensagens nos próprios chamados
CREATE POLICY "users insert own ticket messages"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id
        AND st.user_id = auth.uid()
    )
  );

-- Admin vê todas as mensagens
CREATE POLICY "admins view all ticket messages"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin insere mensagens em qualquer chamado
CREATE POLICY "admins insert ticket messages"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Realtime para notificar o usuário de novas respostas do admin
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
