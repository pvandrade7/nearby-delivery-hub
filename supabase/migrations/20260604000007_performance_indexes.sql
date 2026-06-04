-- ─────────────────────────────────────────────────────────────
-- Índices de performance ausentes nas tabelas principais
-- ─────────────────────────────────────────────────────────────

-- products: consulta frequente "ativos por lojista"
CREATE INDEX IF NOT EXISTS products_seller_active_idx
  ON public.products(seller_id, active);

-- products: consulta por categoria filtrando ativos
CREATE INDEX IF NOT EXISTS products_category_active_idx
  ON public.products(category, active);

-- orders: consulta "meus pedidos em ordem cronológica"
CREATE INDEX IF NOT EXISTS orders_buyer_created_idx
  ON public.orders(buyer_id, created_at DESC);

-- orders: lojista busca pedidos por nome de loja + status
CREATE INDEX IF NOT EXISTS orders_store_status_idx
  ON public.orders(store_name, status);

-- conversations: lista de conversas do comprador ordenada por última mensagem
CREATE INDEX IF NOT EXISTS conversations_buyer_last_idx
  ON public.conversations(buyer_id, last_message_at DESC);

-- conversations: lista de conversas do vendedor
CREATE INDEX IF NOT EXISTS conversations_seller_last_idx
  ON public.conversations(seller_id, last_message_at DESC);

-- profiles: index no campo JSONB para buscas por storeName
-- Usado em múltiplas queries: StoreList, ClientHome, AdminStores
CREATE INDEX IF NOT EXISTS profiles_extras_storename_idx
  ON public.profiles((extras->>'storeName'))
  WHERE extras IS NOT NULL AND extras->>'storeName' IS NOT NULL;

-- seller_verifications: admin filtra por status
-- (já temos status_idx, adicionamos seller+status para o lojista ver o próprio)
CREATE INDEX IF NOT EXISTS seller_verif_seller_status_idx
  ON public.seller_verifications(seller_id, status);

-- notifications: limpeza de notificações antigas (TTL por cron)
CREATE INDEX IF NOT EXISTS notifications_created_user_idx
  ON public.notifications(created_at, user_id);
