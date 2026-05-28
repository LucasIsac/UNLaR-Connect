// Supabase Client Configuration Entrypoint
//
// IMPORTANT: In Next.js App Router, you MUST use the appropriate client:
// - For Client Components ("use client"):
//   import { createClient } from "@/lib/supabase/client";
//
// - For Server Components, Server Actions, or Route Handlers:
//   import { createClient } from "@/lib/supabase/server";

export { createClient as createBrowserClient } from "./supabase/client";
export { createClient as createServerClient, createStaticClient, getVerifiedSession } from "./supabase/server";


