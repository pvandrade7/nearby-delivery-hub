
-- Adiciona coluna roles (array com todos os perfis do usuário)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT '{}';

-- Inicializa roles a partir do role primário existente
UPDATE public.profiles
SET roles = ARRAY[role]
WHERE role IS NOT NULL
  AND (roles = '{}' OR roles IS NULL);

-- Atualiza o trigger para também salvar roles no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
BEGIN
  v_role := nullif(new.raw_user_meta_data->>'role', '');

  INSERT INTO public.profiles (id, display_name, avatar_url, phone, role, roles, extras)
  VALUES (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    nullif(new.raw_user_meta_data->>'phone', ''),
    v_role,
    CASE WHEN v_role IS NOT NULL THEN ARRAY[v_role] ELSE '{}'::text[] END,
    coalesce((new.raw_user_meta_data->'extras')::jsonb, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        phone        = coalesce(EXCLUDED.phone, profiles.phone),
        role         = coalesce(EXCLUDED.role, profiles.role),
        -- Adiciona o novo role ao array sem duplicatas
        roles        = CASE
                         WHEN EXCLUDED.roles IS NOT NULL
                           AND EXCLUDED.roles <> '{}'::text[]
                         THEN (
                           SELECT array_agg(DISTINCT elem ORDER BY elem)
                           FROM unnest(profiles.roles || EXCLUDED.roles) AS elem
                           WHERE elem IS NOT NULL
                         )
                         ELSE profiles.roles
                       END,
        extras       = EXCLUDED.extras;

  RETURN new;
END;
$function$;
