-- Migration: Supabase Security Advisor Fixes
-- Created: 2026-05-28

-- ==========================================
-- 1. Fix Function Search Path Mutable (handle_new_user)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, last_name, role_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'name', 'Estudiante'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    2 -- Default to Estudiante (ID: 2)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- 2. Revoke Public Execution on SECURITY DEFINER Function
-- ==========================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ==========================================
-- 3. Move vector Extension to extensions Schema
-- ==========================================
ALTER EXTENSION vector SET SCHEMA extensions;

-- ==========================================
-- 4. RLS Policies for public.roles
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de roles a autenticados" ON public.roles;
CREATE POLICY "Permitir lectura de roles a autenticados"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- 5. RLS Policies for public.career_subjects
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de materias por carrera" ON public.career_subjects;
CREATE POLICY "Permitir lectura de materias por carrera"
ON public.career_subjects FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- 6. RLS Policies for public.topics
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de temas" ON public.topics;
CREATE POLICY "Permitir lectura de temas"
ON public.topics FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- 7. RLS Policies for public.tags
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de etiquetas" ON public.tags;
CREATE POLICY "Permitir lectura de etiquetas"
ON public.tags FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- 8. RLS Policies for public.post_tags
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de etiquetas de publicaciones" ON public.post_tags;
CREATE POLICY "Permitir lectura de etiquetas de publicaciones"
ON public.post_tags FOR SELECT
TO authenticated
USING (true);

-- ==========================================
-- 9. RLS Policies for public.reviews
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de reseñas" ON public.reviews;
CREATE POLICY "Permitir lectura de reseñas"
ON public.reviews FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir creación de reseñas propias" ON public.reviews;
CREATE POLICY "Permitir creación de reseñas propias"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tutoring_sessions s 
    WHERE s.id = session_id AND (s.student_id = auth.uid() OR s.tutor_id = auth.uid())
  )
);

-- ==========================================
-- 10. RLS Policies for public.chat_sessions
-- ==========================================
DROP POLICY IF EXISTS "Permitir administración de sesiones de chat propias" ON public.chat_sessions;
CREATE POLICY "Permitir administración de sesiones de chat propias"
ON public.chat_sessions FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- 11. RLS Policies for public.chat_messages
-- ==========================================
DROP POLICY IF EXISTS "Permitir administración de mensajes de chat propios" ON public.chat_messages;
CREATE POLICY "Permitir administración de mensajes de chat propios"
ON public.chat_messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()
  )
);

-- ==========================================
-- 12. RLS Policies for public.document_embeddings
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de embeddings a autenticados" ON public.document_embeddings;
CREATE POLICY "Permitir lectura de embeddings a autenticados"
ON public.document_embeddings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir administración de embeddings propios" ON public.document_embeddings;
CREATE POLICY "Permitir administración de embeddings propios"
ON public.document_embeddings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()
  )
);
