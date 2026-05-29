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
  if (browserClient) {
    // Synchronously remove the channel from the internal client cache
    // to prevent reuse and callbacks addition crash during rapid component unmount/remount (React Strict Mode / HMR).
    const realtime = (browserClient as any).realtime;
    if (realtime && Array.isArray(realtime.channels)) {
      realtime.channels = realtime.channels.filter((c: any) => c !== channel);
    }

    // Delay the actual network unsubscription slightly to allow the connection
    // handshake to complete, avoiding "WebSocket is closed before the connection is established" warning.
    setTimeout(() => {
      void browserClient?.removeChannel(channel);
    }, 100);
    return;
  }

  try {
    void channel.unsubscribe();
  } catch {
    // Ignore teardown races during development remounts.
  }
}
