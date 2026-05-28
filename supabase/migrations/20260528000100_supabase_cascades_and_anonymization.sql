-- Migration: Supabase User Cascades & Resource Anonymization
-- Created: 2026-05-28

-- 1. Enable secure cascades from auth.users to public.users
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey,
ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users (id) 
  ON DELETE CASCADE;

-- 2. Enable SET NULL on documents when an author is deleted to anonymize uploads
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_user_id_fkey,
ADD CONSTRAINT documents_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users (id)
  ON DELETE SET NULL;
