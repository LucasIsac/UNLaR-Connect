-- Migration: Supabase User Soft Delete Column & Cascading preservation
-- Created: 2026-05-28

-- 1. Add deleted_at column to support soft deletes on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- 2. Enable SET NULL on documents when an author is deleted to anonymize uploads (failsafe permanent delete rule)
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_user_id_fkey,
ADD CONSTRAINT documents_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users (id)
  ON DELETE SET NULL;
