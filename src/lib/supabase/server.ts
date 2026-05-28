import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use within Server Components, Server Actions,
 * and Route Handlers. Automatically handles cookies.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a static Supabase client that does NOT read cookies.
 * Safe to use inside Next.js unstable_cache blocks.
 * Accepts an optional accessToken to run queries on behalf of the authenticated user.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createStaticClient(accessToken?: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : undefined
  );
}

/**
 * Returns the verified authenticated user ID and their access token in a single call.
 * Uses getUser() (server-verified) for identity, then reads the token from the cookie
 * session — safe since getUser() has already confirmed the token's authenticity.
 *
 * This is the correct pattern to avoid the "getSession() could be insecure" warning
 * while still obtaining the JWT needed for authenticated static client queries.
 */
export async function getVerifiedSession(): Promise<{
  userId: string;
  accessToken: string;
} | null> {
  const supabase = createClient();

  // getUser() contacts the Supabase Auth server and validates the JWT — fully secure.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // getSession() reads from cookies (fast, no network call).
  // Safe to call here because getUser() above already validated the JWT.
  // We extract ONLY the access_token — we do NOT use session.user for auth decisions.
  const { data: { session } } = await supabase.auth.getSession();

  return {
    userId: user.id,              // identity from getUser() — server-verified ✅
    accessToken: session?.access_token ?? "", // JWT for static client Authorization header
  };
}
