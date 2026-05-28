-- Migration: Database Webhooks for Next.js Cache Invalidation
-- Created: 2026-05-28
-- Description: Establishes a configuration table and database triggers to notify the Next.js cache revalidation API on write events.

-- 1. Ensure the pg_net extension is installed (used for asynchronous HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the configuration table to store cache revalidation endpoint parameters
CREATE TABLE IF NOT EXISTS public.cache_webhook_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- 3. Populate default settings for local development
-- host.docker.internal allows Docker containers (like Supabase pg_net) to call the local host on port 3000
INSERT INTO public.cache_webhook_config (key, value) VALUES
('url', 'http://host.docker.internal:3000/api/cache/revalidate'),
('secret', 'unlar_connect_super_secret_revalidation_token_2026')
ON CONFLICT (key) DO NOTHING;

-- 4. Create the general trigger function to perform the POST call to Next.js
CREATE OR REPLACE FUNCTION public.handle_cache_webhook_invalidation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text;
  webhook_secret text;
  payload jsonb;
BEGIN
  -- Read current endpoint and secret parameters from config
  SELECT value INTO webhook_url FROM public.cache_webhook_config WHERE key = 'url';
  SELECT value INTO webhook_secret FROM public.cache_webhook_config WHERE key = 'secret';

  -- If configuration is incomplete, bypass silently to avoid throwing errors during DB operations
  IF webhook_url IS NULL OR webhook_secret IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Build the JSON payload representing the change
  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END
  );

  -- Trigger asynchronous HTTP POST via pg_net (returns immediately, transactional-safe)
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net;

-- 5. Attach triggers to monitored tables

-- Triggers for users table
DROP TRIGGER IF EXISTS trg_cache_invalidation_users ON public.users;
CREATE TRIGGER trg_cache_invalidation_users
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_cache_webhook_invalidation();

-- Triggers for tutoring_sessions table
DROP TRIGGER IF EXISTS trg_cache_invalidation_tutoring_sessions ON public.tutoring_sessions;
CREATE TRIGGER trg_cache_invalidation_tutoring_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.tutoring_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_cache_webhook_invalidation();

-- Triggers for tutor_availability table
DROP TRIGGER IF EXISTS trg_cache_invalidation_tutor_availability ON public.tutor_availability;
CREATE TRIGGER trg_cache_invalidation_tutor_availability
  AFTER INSERT OR UPDATE OR DELETE ON public.tutor_availability
  FOR EACH ROW EXECUTE FUNCTION public.handle_cache_webhook_invalidation();

-- Triggers for tutor_subjects table
DROP TRIGGER IF EXISTS trg_cache_invalidation_tutor_subjects ON public.tutor_subjects;
CREATE TRIGGER trg_cache_invalidation_tutor_subjects
  AFTER INSERT OR UPDATE OR DELETE ON public.tutor_subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_cache_webhook_invalidation();

-- Triggers for posts table
DROP TRIGGER IF EXISTS trg_cache_invalidation_posts ON public.posts;
CREATE TRIGGER trg_cache_invalidation_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_cache_webhook_invalidation();

-- Triggers for post_replies table
DROP TRIGGER IF EXISTS trg_cache_invalidation_post_replies ON public.post_replies;
CREATE TRIGGER trg_cache_invalidation_post_replies
  AFTER INSERT OR UPDATE OR DELETE ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_cache_webhook_invalidation();

-- Triggers for documents table
DROP TRIGGER IF EXISTS trg_cache_invalidation_documents ON public.documents;
CREATE TRIGGER trg_cache_invalidation_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_cache_webhook_invalidation();
