---
name: Lumina Amber Light
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#534434'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#867461'
  outline-variant: '#d8c3ad'
  surface-tint: '#855300'
  primary: '#855300'
  on-primary: '#ffffff'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#ffb95f'
  secondary: '#944a23'
  on-secondary: '#ffffff'
  secondary-container: '#fd9e70'
  on-secondary-container: '#76340e'
  tertiary: '#665f3d'
  on-tertiary: '#ffffff'
  tertiary-container: '#bab189'
  on-tertiary-container: '#4a4424'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb693'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#76330d'
  tertiary-fixed: '#ede3b8'
  tertiary-fixed-dim: '#d1c79d'
  on-tertiary-fixed: '#201c02'
  on-tertiary-fixed-variant: '#4d4727'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  display:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system focuses on warmth, clarity, and a premium editorial feel. It is designed for high-end lifestyle, travel, or curated marketplace applications where the interface acts as a sophisticated gallery for content. 

The aesthetic is **Modern Minimalist** with a **Tactile** edge. By utilizing a warm, off-white foundation paired with vibrant amber accents, the UI evokes a sense of golden-hour sunlight—welcoming, optimistic, and high-quality. The design prioritizes generous whitespace, precise geometric typography, and soft, organic depth to create an inviting digital environment that feels breathable and human-centric.

## Colors

The palette transition to a light mode emphasizes a "paper-like" warmth rather than clinical white. 

- **Primary Amber (#f59e0b):** Used exclusively for primary calls to action, active states, and critical highlights.
- **Surface (#fdfbf7):** A soft cream base that reduces eye strain and provides a sophisticated backdrop.
- **Secondary Brown (#78350f):** Reserved for high-contrast accents or decorative typography elements.
- **Tertiary Cream (#fef3c7):** Used for subtle background fills, such as chip backgrounds or selected list items.
- **Text:** Deep charcoal (#1a1a1a) ensures maximum legibility and professional rigor.

## Typography

This design system utilizes **Montserrat** across all levels to maintain a clean, geometric, and modern personality. 

Hierarchies use a bold weight and slightly tighter letter-spacing to command attention and feel grounded. Body copy is set with generous line heights to ensure readability against the warm surface color. Labels and small metadata utilize increased letter spacing and uppercase styling to provide a clear structural hierarchy without relying on heavy color fills.

## Layout & Spacing

The layout follows a **Fluid Grid** model based on an 8px square-grid system. 

- **Desktop:** 12-column grid with 64px side margins and 24px gutters.
- **Tablet:** 8-column grid with 32px side margins.
- **Mobile:** 4-column grid with 16px side margins.

Spacing is used aggressively to create "islands" of content, ensuring the UI never feels cluttered. Component padding should prioritize the `md` (24px) unit for internal container spacing to maintain the airy, premium feel.

## Elevation & Depth

In the light mode of the design system, depth is communicated through **Ambient Shadows** and **Tonal Layering** rather than heavy borders.

- **Level 0 (Base):** The #fdfbf7 surface.
- **Level 1 (Cards/Floating Elements):** Uses a very soft, diffused shadow: `box-shadow: 0 4px 20px rgba(120, 53, 15, 0.05)`. Note the subtle amber/brown tint in the shadow to maintain color harmony.
- **Level 2 (Modals/Overlays):** A more pronounced shadow: `0 12px 40px rgba(120, 53, 15, 0.1)`.
- **Interactions:** Hover states should slightly lift elements (y-offset reduction) and increase shadow spread, creating a tactile "magnetic" effect.

## Shapes

The design system employs a **Rounded** shape language to reinforce the friendly and approachable brand personality. 

A base radius of 8px (0.5rem) is applied to standard components like input fields and small buttons. Larger containers, such as feature cards and modals, utilize `rounded-xl` (24px) to create a soft, organic frame for photography and content. This curvature balances the sharp geometric nature of the Montserrat typeface.

## Components

### Buttons
- **Primary:** Solid #f59e0b fill with white text. High-contrast, 8px corner radius.
- **Secondary:** Transparent background with a 1px border of #f59e0b and amber text.
- **Ghost:** No border or fill; amber text. Used for low-priority actions.

### Input Fields
Inputs use a subtle #e5e2da border against the cream surface. On focus, the border transitions to #f59e0b with a soft amber outer glow. Labels are positioned above the field in `label-md` style.

### Cards
Cards are the primary container. They feature the Level 1 ambient shadow and no border, or a very faint 1px border (#e5e2da) if placed on a white background. Images within cards should inherit the container's 24px corner radius.

### Chips & Tags
Small, 100% rounded (pill) elements. Use the Tertiary Cream (#fef3c7) as a background with Secondary Brown (#78350f) text for a high-end, legible look.

### Lists
List items are separated by thin horizontal rules (#e5e2da). Selected states use a subtle #fef3c7 background bleed that extends to the edge of the container.
