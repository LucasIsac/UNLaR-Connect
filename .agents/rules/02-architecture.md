# Rule 02: Architecture & Coding Standards

This rule specifies the architectural pattern and standards for the UNLaR-Connect monolithic codebase.

## 1. Directory Structure Constraints
All code must follow the structure defined in `README.md`. No ad-hoc directories are permitted in the root folder.
- **`src/actions/`**: Backend-invisible server actions (API logic, Supabase updates, embeddings generation).
- **`src/app/`**: Next.js 14 App Router pages, layouts, and styles.
- **`src/components/`**: Reusable modular UI components (mobile-first layout).
- **`src/lib/`**: Singletons and core configurations (Supabase connection, FreeLLMAPI endpoints).
- **`src/types/`**: Strict TypeScript interfaces.

## 2. Server Actions (The "Invisible Backend")
UNLaR-Connect uses a monolithic structure where API routes are replaced by **Next.js Server Actions**:
- Keep actions clean and transaction-focused.
- Always include `"use server"` at the very top of files inside `src/actions/`.
- Validate user session status inside the Server Action before performing operations.
- Handle database operations within `try-catch` blocks and return typed custom responses rather than throwing raw database errors.
  ```typescript
  export async function myAction(data: MyData): Promise<ActionResponse> {
    "use server";
    try {
      // 1. Authenticate user
      // 2. Perform DB operations via Supabase
      return { success: true, data: results };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Hubo un problema al procesar tu solicitud." };
    }
  }
  ```

## 3. Strict TypeScript & Database Schema
- Avoid the usage of `any` types. Everything must be explicitly typed.
- Match all database calls with generated types in `src/types/database.ts`.
- Separate domain types (e.g. `Usuario`, `Documento`) from raw database entities, mapping them cleanly.

---

> [!IMPORTANT]
> Never mix server-only packages inside components marked with `"use client"`. Always delegate data-mutation to Server Actions.

