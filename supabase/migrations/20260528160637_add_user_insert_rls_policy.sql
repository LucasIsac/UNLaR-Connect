DROP POLICY IF EXISTS "Permitir inserción de perfil propio" ON public.users;
CREATE POLICY "Permitir inserción de perfil propio"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);;
