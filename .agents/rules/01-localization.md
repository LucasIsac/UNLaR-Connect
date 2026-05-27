# Rule 01: Localization and Language Policy

This rule establishes the exact guidelines for communication, documentation, and user-facing copy within the UNLaR-Connect workspace.

## 1. Documentation & AI Internal Files (Strictly English)
All files intended for the development, reasoning, or configuration of the AI models MUST be written in **English**. This includes:
- Markdown files describing architectural decisions (`.md` files in the repository).
- All files under `.agents/` (`rules/`, `skills/`, `workflows/`).
- Code comments and TypeScript docstrings.
- Implementation plans, tasks, and walkthroughs.
- Git commit messages.

## 2. Frontend User Interface Copy (Strictly Argentine Spanish)
Every string, label, modal, alert, button, or email template visible to the user MUST be written in **Argentine Spanish**.
- The tone must be **warm, close, professional, and natural**.
- Use the **voseo** (conjugating verbs with "vos" instead of "tú").
- Avoid overly exaggerated slang (do NOT over-use terms like "che", "boludo" or "buenísimo" in formal settings), but keep it friendly and typical of an Argentine university student context.

### Conversational Examples:

| standard Spanish | Argentine Spanish (Correct) | UI Location |
| :--- | :--- | :--- |
| Inicia sesión | **Iniciá sesión** / **Ingresá** | Login button |
| Crea tu cuenta | **Creá tu cuenta** / **Registrate** | Registration button |
| ¿Buscas apuntes? | **¿Buscás apuntes?** | Search input placeholder |
| Sube tu archivo PDF | **Subí tu archivo PDF** / **Arrastrá tu PDF acá** | Drag & drop area |
| No tienes materias | **No tenés materias registradas** | Empty states |
| Olvidé mi contraseña | **Me olvidé la contraseña** | Forgot password link |
| Cerrar sesión | **Cerrar sesión** / **Salir** | Profile menu |

### Rules for AI Assistant Responses in Spanish
When the integrated AI Chatbot speaks to the user in Argentine Spanish:
- It should use terms like **"Che, mirá,..."**, **"Te comento..."**, **"Tenés que..."**.
- It should be friendly and polite, like a fellow student helping them out:
  - *Correct*: "Che, encontré este apunte de Análisis I que te puede servir. ¿Querés que te resuma la primera parte?"
  - *Incorrect*: "He encontrado este documento de Análisis I. ¿Deseas que lo resuma?"

---

> [!IMPORTANT]
> Keep code strings localized! Ensure your localization parameters are consistent with this policy when creating labels.
