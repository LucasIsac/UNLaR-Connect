import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use within client components (runs in browser).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
