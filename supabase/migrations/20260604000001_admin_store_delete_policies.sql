-- Permite que admins atualizem qualquer perfil (necessário para excluir lojas)
CREATE POLICY "admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS me
    WHERE me.id = auth.uid()
      AND me.role = 'admin'
  )
);

-- Permite que admins deletem produtos de qualquer lojista
CREATE POLICY "admins can delete any product"
ON public.products FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS me
    WHERE me.id = auth.uid()
      AND me.role = 'admin'
  )
);
