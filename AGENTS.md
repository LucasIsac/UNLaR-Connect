# AI Agent Developer Guide - UNLaR-Connect

Welcome to the **UNLaR-Connect** repository. This guide is written for AI Coding Assistants (like yourself) to maintain absolute code quality, strict structural conformity, premium visual excellence, and localization compliance.

---

## 1. Directory Structure

The `.agents/` folder contains instructions, guidelines, and cookbooks tailored for agent execution:

```text
.agents/
├── design/
│   ├── dark-theme.md            # Stitch specifications for the Warm Obsidian dark theme.
│   └── light-theme.md           # Stitch specifications for the Lumina Amber light theme.
│
├── rules/
│   ├── 00-context.md            # Hackathon context, priorities, and developer directives.
│   ├── 01-localization.md       # English-to-Spanish translation policy & tone rules.
│   ├── 02-architecture.md       # Monolithic next-actions structure & standards.
│   └── 03-components.md         # Tailwind tokens, glassmorphism, animations & mobile-first UI.
│
├── skills/
│   ├── supabase.md              # Auth lifecycle, matching, and database commands.
│   └── rag-pdf.md               # PDF chunking, local embeddings, and pgvector cosine search.
│
└── workflows/
    ├── auth-flow.md             # Blueprint for setting up and testing login/register flows.
    └── rag-feature-integration.md # Step-by-step cookbook for PDF uploading and RAG chatting.
```

---

## 2. Core Policies

### A. Dual-Language Directive (Critical!)
- **AI Internal Files / Code Comments / Commit Messages / Plans**: Always in **English**.
- **User Interface (UI) Copy / Chatbot Responses**: Always in friendly, natural **Argentine Spanish** using **voseo** (conjugating with "vos").
  - *Correct UI Labels*: "Iniciá sesión", "¿Buscás apuntes?", "Registrate gratis", "Subí tu PDF al toque".
  - *Correct AI Responses*: "Che, de acuerdo con el apunte de Análisis, tenés que calcular el límite primero..."
  - *Detail guide*: Read [.agents/rules/01-localization.md](file:///.agents/rules/01-localization.md).

### B. Monolithic & Type-Safe Architecture
- UNLaR-Connect uses Next.js 14 App Router, TypeScript, and **Server Actions** (`src/actions/`) as the invisible backend.
- Avoid building REST API routes; communicate components directly with Server Actions.
- Ensure strict TypeScript typing; avoid using the `any` keyword.
  - *Detail guide*: Read [.agents/rules/02-architecture.md](file:///.agents/rules/02-architecture.md).

### C. Design & Aesthetic Aesthetics
- Establish smooth animations, micro-interactions, shadows, and layout transitions.
- Use only the established design tokens (`bg-primary`, `text-secondary`, `bg-glass`) from `tailwind.config.ts` and `src/app/globals.css`.
  - *Detail guide*: Read [.agents/rules/03-components.md](file:///.agents/rules/03-components.md).

---

## 3. Workflows and Skills Blueprints

When assigned to a new feature:
1. Identify the corresponding **Skill** under `.agents/skills/` (e.g. Supabase, pgvector, PDF processing).
2. Follow the recipes and visual flows outlined in `.agents/workflows/` (e.g. Auth flow, RAG pipeline integration).
3. Draft your plans and task lists in English, keeping UI changes strictly Argentine Spanish.

Happy coding! Let's build a spectacular platform for the UNLaR students.
