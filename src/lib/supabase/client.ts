import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Creates a Supabase client for use within client components (runs in browser).
 */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}

export function unsubscribeRealtimeChannel(channel: RealtimeChannel) {
  // Delay channel removal slightly to prevent "WebSocket is closed before the connection is established"
  // warnings that happen during rapid component unmount/remount in development (React Strict Mode / HMR).
  setTimeout(() => {
    if (browserClient) {
      void browserClient.removeChannel(channel);
      return;
    }

    try {
      void channel.unsubscribe();
    } catch {
      // Ignore teardown races during development remounts.
    }
  }, 100);
}
