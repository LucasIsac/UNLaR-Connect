# Rule 03: UI & Component Standards

This rule governs the design guidelines, Tailwind standards, and component structure for building a premium user interface.

## 1. Visual Aesthetics First
UNLaR-Connect is a **premium** application. Its layout must look state-of-the-art:
- **HSL Tailwind Tokens Only**: Avoid absolute tailwind color classes (e.g. `bg-red-500` or `text-blue-600`). Always use the theme tokens: `bg-primary`, `text-secondary`, `border-border`, etc.
- **Glassmorphism**: Use the custom class `bg-glass` (and `bg-glass-light` for light mode) for panels, cards, header segments, and navigation elements. Combine it with backdrop-blur.
- **Glow Effects**: Use `glow-primary` or `glow-secondary` on active cards, dashboard hover highlights, and AI chatbot responses to create depth.
- **Official Specifications**: Always refer to the Stitch design specifications in [dark-theme.md](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/.agents/design/dark-theme.md) and [light-theme.md](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/.agents/design/light-theme.md) for official brand colors (Lumina Amber / Warm Obsidian), geometric typography weights (Montserrat & Inter), custom margins, card shadows, and node-link aesthetics.

## 2. Mobile-First Approach
Since students use the platform primarily on their mobile devices, all layouts must be designed mobile-first:
- Standard desktop layout should adapt seamlessly down to phone sizes (e.g., standard side nav collapses to bottom navigation bar on screens `< md`).
- Avoid wide spacing or massive horizontal padding on small screens.
- Keep buttons large and easily tap-able on mobile screens (minimum `h-10` to `h-12`).

## 3. Micro-Animations & Transitions
Interfaces must feel dynamic and interactive:
- Apply smooth hover transitions on all links, cards, and buttons: `transition-all duration-300 hover:scale-[1.02]`.
- Use keyframe animations for elements entering the screen, like the `animate-fade-in` utility.
- Use spring or ease-in-out properties to make the interface feel organic.

---

> [!TIP]
> Keep components modular and single-responsibility. If a component grows past 200 lines, extract its logic into smaller elements.
