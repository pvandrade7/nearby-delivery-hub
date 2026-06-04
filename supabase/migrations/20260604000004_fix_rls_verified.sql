-- Impede que usuários não-admin setem verified=true no próprio perfil.
-- A Edge Function validate-cnpj já usa service_role (bypassa RLS),
-- e AdminVerification.tsx usa a policy de admin abaixo.
--
-- Estratégia: recriar a policy de UPDATE do usuário com WITH CHECK
-- que proíbe alterar `verified` para true a menos que seja admin.
-- A comparação usa subquery para ler o valor atual (antes do UPDATE).

DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;

CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- O novo valor de verified não pode virar true por não-admin:
      -- ou verified continua igual ao valor atual (subquery = old row),
      -- ou o usuário é admin.
      verified IS NOT DISTINCT FROM (
        SELECT p.verified FROM public.profiles p WHERE p.id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles me
        WHERE me.id = auth.uid() AND me.role = 'admin'
      )
    )
  );
