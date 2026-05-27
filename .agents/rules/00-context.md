# Rule 00: Hackathon Context & Priorities

This file establishes the high-level operating context for all AI agents working on the UNLaR-Connect project. Read this first to align your reasoning speed and priorities.

## 1. The Hackathon Environment
We are participating in a **high-stakes, limited-time Hackathon**. 
- **Time is extremely critical**: We must prioritize rapid, highly functional prototyping over heavy academic over-engineering.
- **Aesthetics Win**: In a hackathon, first impressions are vital. Every screen must look premium, modern, and visually stunning immediately upon loading.
- **Working Prototypes Only**: Avoid leaving unfinished placeholders, broken routes, or mock code in production folders. Every feature we submit must build and run smoothly.

## 2. Core Strategic Directives
- **Visual Impact**: Leverage the custom `bg-glass` glassmorphism card styling, primary amber glows, and dark-theme obsidian background variables strictly defined in [.agents/design/dark-theme.md](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/.agents/design/dark-theme.md).
- **Mobile-First Prototype**: Most evaluators will view the application on mobile layouts. Ensure seamless grid adjustments and large, tappable CTAs.
- **Single Source of Truth**: Task tracking is handled online via **ClickUp** (do not write redundant roadmaps locally). Local execution checklists should only exist in temporary files like `task.md`.

## 3. Immediate Developer Cheatsheet
- **Translation Guard**: All code comments and documentation are in **English**. User Interface copy and integrated AI chatbot responses MUST be in **Argentine Spanish** with friendly, natural voseo (*"Registrate"*, *"Subí tu apunte"*, *"Che, tenés dudas?"*).
- **Backend Rule**: No REST API routes! Communicate entirely using Next.js 14 App Router **Server Actions** (`src/actions/`).
- **Design System Alignment**: Never use raw Tailwind colors like `bg-red-500` or `text-blue-500`. Only reference the predefined HSL variables (`bg-primary`, `text-secondary`, `bg-card`, etc.).

---

> [!IMPORTANT]
> Focus on clean, modular, and fast-to-execute implementations. Help the team win by combining state-of-the-art AI architecture with beautiful, fluid design!
