# UNLaR-Connect — System Architecture & Standards

This document describes the architectural patterns, directory organization, and frontend/backend integration standards used in **UNLaR-Connect**.

---

## 1. Monolithic Architecture & Directory Structure

UNLaR-Connect is built as a cohesive, single-repository, Next.js 14 application. By avoiding separate frontend and backend codebases, it reduces deployment overhead, keeps API contracts synchronized in a type-safe manner, and maximizes development speed.

Below is the directory structure highlighting the role of each directory:

```text
unlar-connect/
├── docs/                    # SYSTEM ARCHITECTURE & DOCUMENTATION
│   ├── architecture.md      # This file
│   ├── database_schema.md   # Supabase tables, relations, and RLS policies
│   ├── rag_ai_pipeline.md   # PDF parsing, embeddings generation, and RAG chat
│   └── testing_and_verification.md # Testing guides for WebRTC and RAG features
│
├── .agents/                 # AI AGENT SPECIFIC CONTEXT & BLUEPRINTS
│   ├── rules/               # Coding style, localization guardrails, and components
│   ├── skills/              # Integration skills (Supabase, PDF parsing, pgvector)
│   └── workflows/           # Walkthroughs of authentication & RAG setup
│
├── public/                  # Public static assets (logos, icons, illustrations)
│
├── src/
│   ├── actions/             # SERVER ACTIONS (The "Invisible Backend")
│   │   ├── auth.ts          # Supabase auth sync and session management
│   │   ├── chat.ts          # RAG Chat completions & custom system prompt injection
│   │   ├── consultas.ts     # Express Consultations WebRTC handshake and queues
│   │   ├── dashboard.ts     # Dashboard widgets & telemetry data
│   │   ├── events.ts        # Academic/tutorias event management & logging
│   │   ├── foro.ts          # Forum threads, comments, and rating logic
│   │   ├── ingest.ts        # PDF parsing, chunking, and embedding generation
│   │   ├── karma.ts         # User activity reputation ledger
│   │   ├── notifications.ts # Real-time alerts and user notification logs
│   │   ├── perfil.ts        # Career/subject profiling and details
│   │   ├── recursos.ts      # Shared resources and folders
│   │   ├── reputation.ts    # Gamification calculations and levels
│   │   └── tutoring-scheduled.ts # Calendar bookings & schedules
│   │
│   ├── app/                 # NEXT.JS APP ROUTER (Pages & Layouts)
│   │   ├── (auth)/          # Authentication grouping (login/register)
│   │   ├── dashboard/       # Central interactive dashboard for students
│   │   ├── chat/            # Global AI chat with documents & filters
│   │   ├── foro/            # Discussion forums partitioned by subject
│   │   ├── tutorias/        # Peer-to-Peer tutoring & WebRTC videocall room
│   │   ├── recursos/        # Academic documents library
│   │   ├── globals.css      # CSS variables, HSL color tokens, and custom styles
│   │   └── layout.tsx       # Root layout containing global theme providers & fonts
│   │
│   ├── components/          # REUSABLE UI COMPONENTS
│   │   ├── ui/              # Atom-level primitives (buttons, modals, inputs, tools)
│   │   ├── layout/          # Responsive navigation (Sidebar / Bottom Nav bar)
│   │   ├── documents/       # Upload components (Drag & Drop, progress states)
│   │   └── chat/            # Interface for the RAG assistant and streaming logs
│   │
│   ├── lib/                 # INITIALIZATION & CORE UTILITIES
│   │   ├── supabase.ts      # Supabase clients (Client-side & Server Action-side)
│   │   ├── ai.ts            # LLM API connections & wrapper configurations
│   │   └── utils.ts         # Tailwind CSS class consolidation utilities
│   │
│   └── types/               # ES-LINT / TYPE DEFINITIONS
│       ├── database.ts      # Database types generated from Supabase
│       └── index.ts         # Domain types (User, Thread, Notification, ChatMessage)
```

---

## 2. Server Actions: The "Invisible Backend"

Instead of constructing traditional REST or GraphQL APIs, UNLaR-Connect communicates mutations and data queries exclusively using **Next.js Server Actions** placed in `src/actions/`.

### Core Architectural Rules for Server Actions:
1. **Implicit Type-Safety**: Next.js Server Actions automatically serialize data boundaries. TypeScript types are enforced natively from the UI directly down to the database client.
2. **Session Verification**: Every Server Action must verify the session using the Supabase Server Client before executing business logic.
3. **Graceful Error Handling**: Database errors are caught inside the actions, logged to the server stdout, and converted into friendly user messages.
4. **Caching & Revalidation**: Use `revalidatePath` or `revalidateTag` inside actions to clear cache and refresh UI states automatically without manual client-side fetching.

```typescript
// Sample Server Action standard
"use server";

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function submitAction(payload: PayloadType): Promise<ResponseStatus> {
  const supabase = createServerClient();
  
  try {
    // 1. Session verification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Sesión expirada. Por favor ingresá de nuevo." };
    }
    
    // 2. Transaction execute
    const { data, error } = await supabase
      .from("my_table")
      .insert({ ...payload, user_id: user.id });
      
    if (error) throw error;
    
    // 3. Revalidate path
    revalidatePath("/dashboard");
    return { success: true, message: "¡Operación completada con éxito!" };
  } catch (err: any) {
    console.error("Action error:", err);
    return { success: false, error: "Hubo un error. Volvé a intentar." };
  }
}
```

---

## 3. Premium Styling System & Design Tokens

UNLaR-Connect does not use absolute color values (`bg-red-500` or `#ff0000`). It adheres to a strict Design System defined via Tailwind and HSL color mappings.

### Color Palettes & Custom CSS Variables:
- **Primary Glow Theme (Lumina Amber / Warm Obsidian)**:
  - `bg-primary`: Dark backdrop of Warm Obsidian (`#0F0E13` equivalent).
  - `text-primary`: Pure white or high-contrast silver.
  - `accent-amber`: Glowing Lumina Amber (`#F59E0B` / `#D97706`).
  - `bg-glass` / `bg-glass-light`: Semi-transparent card backings combined with `backdrop-blur-md` and matching borders (`border-white/10`).
- **Glow Effects**: Applied to primary UI interactions, floating panels, and chatbot answers using modern `box-shadow` or `drop-shadow` filters.

### Mobile-First Implementation Guidelines:
- **Responsive Layout Grid**:
  - Sidebar (`components/layout/Sidebar.tsx`) automatically collapses on screens narrower than `768px` (`md`).
  - Bottom Navigation Bar (`components/layout/BottomNav.tsx`) is hidden on desktop but emerges on mobile viewports.
- **Tappable Targets**: All actionable buttons and items have at least `h-11` (44px) height for comfortable thumb tapping.
- **Fluid Padding**: Margins and paddings are set with dynamic CSS classes to fit compact mobile devices without causing horizontal scrollbars.

---

> [!NOTE]
> All interface components and code modifications must verify performance indices and styling standards. Avoid any third-party UI components that do not leverage the established design system tokens.
