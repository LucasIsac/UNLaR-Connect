# Workflow: Get Session Context

This workflow is used as a command to extract the exact technical context of the current chat/session. It produces a concise, structured, and emoji-free Markdown text in English, designed to be easily copied and pasted into a new session with another AI agent or shared directly with human teammates.

---

## Instructions for the AI Agent

When the user mentions this workflow or requests to run it:
1. **Analyze** the entire chat history, including files created/modified, database actions, current branch, and status.
2. **Extract** the core technical state and progress.
3. **Format** the output using the template below.
4. **Constraints**:
   - **Language**: English only.
   - **Tone**: Concise, professional, and straight to the point.
   - **Formatting**: Completely emoji-free. Keep descriptions and bullet points short.
   - **Output Style**: Render the final summary directly inside a single Markdown code block so the user can easily click "Copy" and paste it into another chat session.

---

## Context Extraction Template

Provide the extracted context in this exact format:

```markdown
# Session State & Technical Context

### 1. Goal & Current Status
- **Objective**: [Summarize the primary goal of the current session/task]
- **Current State**: [Describe the current progress status, e.g., Plan approved, Executing, Verifying, Done]

### 2. Completed Work & File Changes
- **Modified/Created Files**:
  - `[File Path]` - [Concise description of changes]
- **Key Actions Completed**:
  - [Action 1: e.g., Created database migration, implemented server action, etc.]

### 3. Technical & Architectural Decisions
- **Branch / Environment**: [e.g., `feature/tutorias`, Supabase Dev]
- **Architecture & System State**:
  - [e.g., Using Server Actions at `src/actions/...` for DB interaction]
  - [e.g., Dynamic client-side components wrapped in Suspense]

### 4. Next Steps & Pending Checklist
- [ ] [Next immediate task]
- [ ] [Follow-up task]

### 5. Open Questions & Blockers
- **Blockers**: [Active blockers or "None"]
- **Unresolved Issues / Warnings**: [Any active errors or warnings, or "None"]
```
