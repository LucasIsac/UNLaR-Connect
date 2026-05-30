-- Migration: Upgrade posts table to support structured collaboration hub
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'question' CHECK (type IN ('question', 'resource', 'tutoring', 'borrow', 'sell_rent'));
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;;
