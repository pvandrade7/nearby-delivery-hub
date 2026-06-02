-- Permite que qualquer usuário autenticado leia perfis de lojistas
-- que já configuraram uma loja (extras->>'storeName' preenchido).
--
-- Contexto: a migration 20260527153652 tornou os perfis privados
-- (auth.uid() = id), o que bloqueou a exibição de lojas para clientes.
-- No Supabase, múltiplas políticas SELECT se combinam com OR, portanto
-- esta política é aditiva — não remove o acesso ao próprio perfil.

CREATE POLICY "store profiles are publicly viewable"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    extras IS NOT NULL
    AND (extras->>'storeName') IS NOT NULL
    AND trim(extras->>'storeName') <> ''
  );
