-- Migration: Add avatar_url to users and create notifications table
-- Created: 2026-05-28

-- 1. Add avatar_url column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

-- 2. Create public.notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- 'tutorias', 'karma', 'foros', 'sistema'
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) on public.notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for public.notifications
DROP POLICY IF EXISTS "Permitir todo sobre notificaciones propias" ON public.notifications;
CREATE POLICY "Permitir todo sobre notificaciones propias"
ON public.notifications FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 5. Seed initial notifications for Leonardo Rearte (40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469)
INSERT INTO public.notifications (user_id, title, content, type, is_read) VALUES
('40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469', '¡Te damos la bienvenida a UNLaR Connect! 🎉', 'Configurá tu carrera y empezá a interactuar con la comunidad académica.', 'sistema', false),
('40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469', '¡Sumaste 50 puntos de Karma! 🚀', 'Subiste un apunte de Sistemas Operativos que está ayudando a tus compañeros.', 'karma', false),
('40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469', 'Nueva tutoría agendada 📅', 'Carlos M. te agendó una tutoría de Análisis Matemático II para hoy a las 18:30 hs.', 'tutorias', false)
ON CONFLICT (id) DO NOTHING;
