# Design System Strategy: Nocturnal Energy

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Electric Pulse."** 

We are moving away from the "utility-first" look of standard marketplaces and toward a high-end editorial experience that mirrors the atmosphere of a premium lounge or a headline festival set. The system focuses on high-contrast typography, immersive depth, and "glowing" interactive elements. 

To break the template look, we utilize **Intentional Asymmetry**. Hero images should bleed off the edge of the screen, and headlines should use extreme scale shifts to create a sense of rhythmic movement. The UI is not a container for content; it is the stage where the music lives.

## 2. Color & Atmospheric Depth
The color strategy is built on a "Dark-First" philosophy, optimized for low-light environments (clubs, bars, night streets).

- **Primary (`#f3ffca`) & Secondary (`#00eefc`)**: These are our "Light Sources." Use them sparingly but with high impact for CTAs and status indicators. They should feel like neon lights cutting through the dark.
- **The "No-Line" Rule**: To maintain a premium, seamless feel, **1px solid borders are prohibited for sectioning.** Boundaries are defined strictly through background shifts. For example, a `surface-container-low` section sits on a `background` floor. This creates a sophisticated, "molded" look rather than a "boxed" one.
- **Surface Hierarchy & Nesting**: Treat the UI as layers of smoke and glass. Use `surface-container-lowest` (`#000000`) for the deepest background elements and `surface-container-highest` (`#252531`) for elements that need to "pop" toward the user. 
- **The Glass & Gradient Rule**: Floating elements (like music players or navigation bars) must use **Glassmorphism**. Apply `surface-variant` at 60% opacity with a `20px` backdrop-blur. 
- **Signature Textures**: For main CTAs, use a linear gradient transitioning from `primary` (`#f3ffca`) to `primary-container` (`#cafd00`) at a 135-degree angle. This adds "soul" and dimension that flat hex codes lack.

## 3. Typography: Editorial Impact
The typography pairing balances the technical precision of `manrope` with the geometric character of `splineSans`.

- **Display & Headline (Spline Sans)**: These are the "Lead Singers." Use `display-lg` (3.5rem) for artist names or featured events. The tight tracking and bold weights convey authority and energy.
- **Title & Body (Manrope)**: The "Backing Band." `manrope` is highly legible at small sizes. Use `body-md` (0.875rem) for descriptions to ensure clarity in low-light conditions.
- **Hierarchy as Brand**: Create "Typographic Tension" by pairing a `display-sm` headline directly with a `label-sm` metadata tag. This extreme contrast is a hallmark of high-end design.

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to simulate height; we use light and opacity.

- **The Layering Principle**: Instead of a drop shadow, place a `surface-container-highest` card on top of a `surface-container-low` background. The subtle shift from `#13131c` to `#252531` creates a sophisticated, natural lift.
- **Ambient Glows**: When a floating effect is required (e.g., a "Buy Ticket" button), use a diffused shadow colored with `primary-dim` at 8% opacity. This mimics the way a neon sign casts light on its surroundings.
- **The "Ghost Border"**: If a divider is mandatory for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
- **Glassmorphism**: Essential for the "Nightlife" aesthetic. Use semi-transparent `surface` tokens on top of live music photography to ensure text remains legible while keeping the energy of the image visible.

## 5. Components & Interface Elements

### Buttons
- **Primary**: Gradient (`primary` to `primary-container`), black text (`on_primary_fixed`), `xl` (1.5rem) rounded corners.
- **Secondary**: Ghost style. Transparent background with a `secondary` (`#00eefc`) ghost border (20% opacity) and `secondary` text.
- **Action Chips**: Use `surface-container-high` for the background with `primary` text. No borders.

### Cards (The Marketplace Core)
- **Rule**: Forbid divider lines within cards.
- **Layout**: Use `xl` (1.5rem) corner radius. Use a `surface-variant` at 40% opacity with a heavy backdrop-blur. Content should be separated by `24px` of vertical whitespace (consistent with the Spacing Scale).

### Inputs & Search
- **Style**: "Inner-glow" inputs. Use `surface-container-lowest` as the field background to create a "recessed" look. When focused, the `outline` should pulse with a `secondary` (`#00eefc`) glow.

### Specialized Music Components
- **The Pulse Progress Bar**: For audio previews, use a `primary` color bar that features a subtle glow effect, reflecting the energy of a live stage.
- **Live Badge**: A small `error_container` chip with `error` text, utilizing a soft pulse animation to indicate a real-time event.

## 6. Do’s and Don’ts

### Do:
- **Use High-Quality Imagery**: The system relies on the "vibe" of the photos. Use images with deep blacks and high-saturation highlights.
- **Embrace Negative Space**: Let the `background` (`#0d0d16`) breathe. Sophistication is found in what you *don't* put on the screen.
- **Optimize for Thumb-Reach**: Keep primary marketplace actions (Buy, Play, Filter) in the bottom 40% of the screen.

### Don’t:
- **No Pure White**: Never use `#ffffff` for text. Use `on_surface` (`#f2effb`) to prevent eye strain in dark environments.
- **No Sharp Corners**: Avoid `none` or `sm` roundedness unless it's for a very specific technical chart. Everything should feel smooth and premium.
- **No Flat Grids**: Avoid rigid, spreadsheet-like lists. Vary the card sizes and imagery placements to keep the user engaged.