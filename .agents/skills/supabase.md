# Skill: Supabase & Auth Integration

This skill defines the agentic capability to interface with Supabase for data queries, realtime events, and authentication.

## 1. Authentication Lifecycle
- **Session Verification**: Always check authentication middleware for protected routes under `src/app/(protected)/*`.
- **Client vs Server**:
  - Use `createClient` from `@supabase/supabase-js` or next-specific wrappers for client components.
  - Use the cookies-based server-client for server actions and layouts to prevent session hijacking.
- **Voseo in Auth Messages**: All verification, welcome emails, or error messages returned during auth MUST comply with Argentine Spanish rules.
  - *Example*: "¡Registrate para empezar!" or "El email que ingresaste ya está en uso."

## 2. Relational Schema & Tutoring Logic
- **P2P Tutoring Matching**:
  - When matching students with tutors, use transaction locks or Postgres triggers in Supabase.
  - Update user state in `tutoria_sesiones` atomic tables to prevent double booking.
- **Row Level Security (RLS)**:
  - Keep in mind that all queries must adhere to RLS. Ensure tables have active policies allowing reads to registered students and writes only to the resource creators.

---

> [!CAUTION]
> Never expose the Supabase `SERVICE_ROLE_KEY` inside client-side bundles or repository commits.
