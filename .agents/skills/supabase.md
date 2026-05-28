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

## 3. Database Schema Changes & Migrations Workflow
- **Rule of Thumb**: Schema and critical data changes MUST have a history log.
- **Creating Migrations**:
  - Add SQL scripts to the `supabase/migrations/` directory.
  - Name files using the standard format: `YYYYMMDDHHMMSS_description_in_english.sql`.
- **Executing Mutations**:
  - **Do NOT** execute `CREATE`, `ALTER`, `DROP`, `INSERT`, `UPDATE`, or `DELETE` statements directly on the database via raw queries or Supabase MCP `execute_sql`.
  - Always package database mutations inside a migration file.
- **Executing Reads**:
  - You **can** use the Supabase MCP server tools (like `execute_sql`) to inspect current table structures, schema information, run read-only `SELECT` queries, or view logs for debugging purposes.
- **Applying Migrations**:
  - Apply the migrations using Supabase CLI or matching MCP migration tools (`apply_migration`) to keep the remote and local environments perfectly synchronized.

---

> [!CAUTION]
> Never expose the Supabase `SERVICE_ROLE_KEY` inside client-side bundles or repository commits.
