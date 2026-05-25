-- Add phone, role and extras to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS extras jsonb DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone) WHERE phone IS NOT NULL;

-- Replace handle_new_user to also persist phone, role, extras
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, display_name, avatar_url, phone, role, extras)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'role',''),
    coalesce((new.raw_user_meta_data->'extras')::jsonb, '{}'::jsonb)
  ) on conflict (id) do update
    set display_name = excluded.display_name,
        phone = coalesce(excluded.phone, public.profiles.phone),
        role = coalesce(excluded.role, public.profiles.role),
        extras = excluded.extras;
  return new;
end; $function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lookup email by phone for login (security definer, returns only email)
CREATE OR REPLACE FUNCTION public.email_for_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.phone = _phone
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.email_for_phone(text) FROM public;
GRANT EXECUTE ON FUNCTION public.email_for_phone(text) TO anon, authenticated;