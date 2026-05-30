-- Migration: Setup Row Level Security (RLS) Policies
-- Created: 2026-05-28

-- ==========================================
-- 1. Users Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de perfiles a usuarios autenticados" ON public.users;
CREATE POLICY "Permitir lectura de perfiles a usuarios autenticados"
ON public.users FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir actualización de perfil propio" ON public.users;
CREATE POLICY "Permitir actualización de perfil propio"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. Posts Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de publicaciones a usuarios autenticados" ON public.posts;
CREATE POLICY "Permitir lectura de publicaciones a usuarios autenticados"
ON public.posts FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir creación de publicaciones propias" ON public.posts;
CREATE POLICY "Permitir creación de publicaciones propias"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir modificación de publicaciones propias" ON public.posts;
CREATE POLICY "Permitir modificación de publicaciones propias"
ON public.posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- 3. Post Replies Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de respuestas a usuarios autenticados" ON public.post_replies;
CREATE POLICY "Permitir lectura de respuestas a usuarios autenticados"
ON public.post_replies FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir creación de respuestas propias" ON public.post_replies;
CREATE POLICY "Permitir creación de respuestas propias"
ON public.post_replies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir actualización de respuestas" ON public.post_replies;
CREATE POLICY "Permitir actualización de respuestas"
ON public.post_replies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid()
));

-- ==========================================
-- 4. Documents Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de documentos a usuarios autenticados" ON public.documents;
CREATE POLICY "Permitir lectura de documentos a usuarios autenticados"
ON public.documents FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir creación de documentos propios" ON public.documents;
CREATE POLICY "Permitir creación de documentos propios"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir actualización de documentos propios" ON public.documents;
CREATE POLICY "Permitir actualización de documentos propios"
ON public.documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- 5. Tutoring Sessions Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de tutorías propias" ON public.tutoring_sessions;
CREATE POLICY "Permitir lectura de tutorías propias"
ON public.tutoring_sessions FOR SELECT
TO authenticated
USING (auth.uid() = tutor_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Permitir creación de tutorías" ON public.tutoring_sessions;
CREATE POLICY "Permitir creación de tutorías"
ON public.tutoring_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = tutor_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Permitir actualización de tutorías por participantes" ON public.tutoring_sessions;
CREATE POLICY "Permitir actualización de tutorías por participantes"
ON public.tutoring_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- ==========================================
-- 6. Tutor Availability Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de disponibilidad de tutores" ON public.tutor_availability;
CREATE POLICY "Permitir lectura de disponibilidad de tutores"
ON public.tutor_availability FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir administración de disponibilidad propia" ON public.tutor_availability;
CREATE POLICY "Permitir administración de disponibilidad propia"
ON public.tutor_availability FOR ALL
TO authenticated
USING (auth.uid() = tutor_id);

-- ==========================================
-- 7. Tutor Subjects Table Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de materias de tutores" ON public.tutor_subjects;
CREATE POLICY "Permitir lectura de materias de tutores"
ON public.tutor_subjects FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir administración de materias propias" ON public.tutor_subjects;
CREATE POLICY "Permitir administración de materias propias"
ON public.tutor_subjects FOR ALL
TO authenticated
USING (auth.uid() = tutor_id);

-- ==========================================
-- 8. Static & Reference Tables Policies
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de carreras a autenticados" ON public.careers;
CREATE POLICY "Permitir lectura de carreras a autenticados" ON public.careers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir lectura de materias a autenticados" ON public.subjects;
CREATE POLICY "Permitir lectura de materias a autenticados" ON public.subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir lectura de tipos de post a autenticados" ON public.post_types;
CREATE POLICY "Permitir lectura de tipos de post a autenticados" ON public.post_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir lectura de insignias a autenticados" ON public.badges;
CREATE POLICY "Permitir lectura de insignias a autenticados" ON public.badges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir lectura de insignias ganadas a autenticados" ON public.user_badges;
CREATE POLICY "Permitir lectura de insignias ganadas a autenticados" ON public.user_badges FOR SELECT TO authenticated USING (true);;
