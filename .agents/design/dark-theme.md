---
name: Lumina Amber
colors:
  surface: '#151312'
  surface-dim: '#151312'
  surface-bright: '#3c3837'
  surface-container-lowest: '#100e0d'
  surface-container-low: '#1d1b1a'
  surface-container: '#221f1e'
  surface-container-high: '#2c2928'
  surface-container-highest: '#373433'
  on-surface: '#e8e1df'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e8e1df'
  inverse-on-surface: '#33302e'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#ffb77d'
  on-secondary: '#4d2600'
  secondary-container: '#d97707'
  on-secondary-container: '#432100'
  tertiary: '#ffbdaa'
  on-tertiary: '#5e1700'
  tertiary-container: '#ff9573'
  on-tertiary-container: '#782a0f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#3a0b00'
  on-tertiary-fixed-variant: '#7c2d12'
  background: '#151312'
  on-background: '#e8e1df'
  surface-variant: '#373433'
  cream-bone: '#F5F5F4'
  terracotta-soft: '#E2775F'
  obsidian: '#0C0A09'
  charcoal-glass: rgba(28, 25, 23, 0.7)
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  code-sm:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  node-gap: 2rem
---

## Brand & Style

The brand personality is academic yet tech-forward, balancing the reliability of a university institution with the cutting-edge intelligence of AI collaboration. It evokes feelings of warmth, clarity, and focused productivity.

The design style is **Modern Minimalist with Glassmorphic accents**. It utilizes a sophisticated "Premium Dark" default aesthetic inspired by node-based developer tools, characterized by:
- High-contrast call-to-actions that stand out against deep, obsidian backgrounds.
- Translucent, frosted glass layers that establish a clear visual hierarchy.
- A "Node-Link" aesthetic for data visualization, using thin, elegant lines to connect collaborative concepts.
- Spacious layouts that favor legibility and focus, essential for an educational environment.

## Colors

The palette is built on a "Warm Obsidian" foundation. 

### Color Modes
- **Dark Mode (Default):** Uses a deep Obsidian background (`#0C0A09`) to create a high-end, focused environment. Warm Amber accents (`#F59E0B`) serve as primary interaction points.
- **Light Mode:** Transitions to a Soft Bone background (`#F5F5F4`) while maintaining deep Terracotta and Amber for typography and primary actions to preserve the warm, scholarly feel.

### Functional Usage
- **Primary (Amber):** Reserved for high-priority actions, notifications, and AI-related highlights.
- **Secondary (Burnt Orange):** Used for hover states and secondary interactive elements like tags.
- **Tertiary (Terracotta):** Applied to structural lines, node connections, and subtle borders.
- **Neutral:** A range of warm grays and deep charcols used for surfaces and containers to avoid the harshness of pure black.

## Typography

The typography strategy emphasizes clarity and hierarchy. 
- **Montserrat** provides a geometric, confident presence for headlines and branding, reflecting the "Tech-forward" aspect.
- **Inter** handles all body copy and UI labels, chosen for its exceptional legibility at small sizes and neutral, professional tone.

**Scale and Rhythm:**
- Use **Display-lg** sparingly for hero sections and major dashboard headings.
- **Label-md** should be used in uppercase for section headers and button text to provide a clear "UI" feel.
- **Code-sm** is used for metadata, node IDs, and technical details within the resource bank.

## Layout & Spacing

This design system employs a **fluid grid** with strict container limits to ensure a premium, centered experience on ultra-wide monitors.

### Grid System
- **Desktop:** 12-column grid with 24px gutters. Content is housed in a max-width container of 1280px.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.

### Node-Link Aesthetic
For the data visualization and navigation (as seen in the reference), elements should follow a non-linear "Canvas" approach. Use a background dot-grid pattern (spaced at 24px) to help align nodes. Connections between nodes should be 1px solid lines with a `tertiary` color, utilizing subtle curves rather than harsh angles.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and tonal layering rather than traditional heavy shadows.

- **Level 0 (Base):** Deep Obsidian (`#0C0A09`). No elevation.
- **Level 1 (Cards/Nodes):** Charcoal-glass (`rgba(28, 25, 23, 0.7)`) with a 1px border of `rgba(245, 158, 11, 0.1)`. Backdrop-blur: 12px.
- **Level 2 (Modals/Dropdowns):** Solid charcoal with a subtle `primary` glow (0px 4px 20px rgba(245, 158, 11, 0.15)).
- **Overlays:** Semi-transparent dark washes with high backdrop-blur (20px+) to focus user attention on the active task.

## Shapes

The shape language is modern and approachable.
- **Nodes & Cards:** Use `rounded-lg` (1rem) to create a soft, friendly feel for academic content.
- **Buttons & Inputs:** Use `rounded-xl` (1.5rem) or full pill-shape to distinguish interactive elements from static content containers.
- **Connectors:** Lines connecting nodes should have a `border-radius` at corner junctions of 8px to maintain the "soft" aesthetic.

## Components

### Buttons
- **Primary:** Solid Amber (`#F59E0B`) with Obsidian text. High-contrast and impactful.
- **Secondary:** Ghost style with a 1px Amber border and semi-transparent background.
- **AI Action:** Gradient fill (Amber to Terracotta) with a subtle outer glow to signify intelligent processing.

### Cards & Nodes
- Cards represent "Learning Modules" or "Forum Posts." They must use the Glassmorphism style defined in the Elevation section.
- Nodes (for the map view) should include a "status" indicator (e.g., "Approved," "In Progress") using small, saturated labels.

### Input Fields
- Dark, inset backgrounds with Amber focus rings. Typography within inputs should be Inter (body-md).

### Chips & Tags
- Used for Carreras (Majors) and Materias (Subjects). These should be low-profile, using Terracotta backgrounds at 10% opacity with solid text color.

### AI Chat Interface
- Floating action button or persistent sidebar using the "Glassmorphism" effect. The AI's responses should be visually distinguished by a subtle Amber left-border or background tint.
