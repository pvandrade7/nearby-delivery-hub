
-- 1) Conversations: remove the "seller_id IS NULL" public branch
DROP POLICY IF EXISTS "participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "participants can update conversations" ON public.conversations;

CREATE POLICY "participants can view conversations"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "participants can update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 2) Messages: tighten participant checks (no NULL seller branch) and restrict UPDATE to read_at only
DROP POLICY IF EXISTS "participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "participants can update read state" ON public.messages;

CREATE POLICY "participants can read messages"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
));

CREATE POLICY "participants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

CREATE POLICY "participants can mark read"
ON public.messages FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
));

-- Column-level: only allow updating read_at
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- 3) Profiles: restrict reads to the owner only
DROP POLICY IF EXISTS "profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);
