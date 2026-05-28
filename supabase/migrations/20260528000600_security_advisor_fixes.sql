-- ============================================================
-- Migration: Security advisor fixes
-- Resolves Supabase security advisor warnings:
--   1. rls_disabled_in_public (ERROR)  → Enable RLS on cache_webhook_config ✅
--   2. rls_enabled_no_policy (INFO)    → Add deny-all RESTRICTIVE policy ✅
--   3. anon can execute SECURITY DEFINER function (WARN) → REVOKE ✅
--   4. authenticated can execute SECURITY DEFINER function (WARN) → REVOKE ✅
--
-- Remaining warnings (not fixable via migration):
--   • extension_in_public (pg_net) — Supabase-managed extension, schema-pinned,
--     does not support ALTER EXTENSION ... SET SCHEMA. Platform limitation.
--   • auth_leaked_password_protection — Requires Supabase Dashboard:
--     Authentication > Password Security > enable "Leaked Password Protection".
-- ============================================================

-- ============================================================
-- Fix 1: Enable RLS on cache_webhook_config
-- This table stores internal webhook configuration and must NOT
-- be accessible by any external client via PostgREST.
-- ============================================================
ALTER TABLE public.cache_webhook_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Fix 2: Add explicit deny-all RESTRICTIVE policy
-- Satisfies the rls_enabled_no_policy advisor warning.
-- RESTRICTIVE policy = always applied AND-ed with permissive ones.
-- With USING (false), no row is ever visible — truly deny-all.
-- ============================================================
CREATE POLICY deny_all_cache_webhook_config
  ON public.cache_webhook_config
  AS RESTRICTIVE
  TO public
  USING (false);

-- ============================================================
-- Fix 3 & 4: Revoke EXECUTE on handle_cache_webhook_invalidation()
-- from anon, authenticated, and PUBLIC pseudo-roles.
-- This SECURITY DEFINER function is an internal cache helper
-- triggered only by the webhook system — never via client RPC.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_cache_webhook_invalidation()
  FROM anon, authenticated, PUBLIC;

-- Grant EXECUTE only to service_role (internal Supabase trigger runner)
GRANT EXECUTE ON FUNCTION public.handle_cache_webhook_invalidation()
  TO service_role;
