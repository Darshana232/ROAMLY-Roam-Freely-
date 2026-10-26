# Roamly design language

Status: v0.2, 2026-10-26. Established without a prior design system. v0.1 (cream paper, serif display, terracotta accent, mono data labels) was dropped because those are generic defaults, not choices made for this product. `client/src/index.css` implements these tokens; change both together.

## Concept: the kilometre stone

Roamly is about one question asked on a Thursday night in Bengaluru: *how far can I get this weekend?* The identity comes from the road itself.

**The memorable element is the milestone.** Indian highway kilometre stones have a coloured cap carrying the place name and a white body carrying the distance. Every destination in Roamly is introduced on one, with real data: the name on a yellow cap and the approximate road distance in large condensed numerals. It appears on the home page "road" (every place ordered by distance), on finder results and on the place page. Boldness is spent here; everything around it stays quiet.

**The search is a sentence.** "I have 2 days and ₹4,000, going solo by bus." Each underlined part is a real control. The product's input is its headline.

## Colour

| Token | Hex | Role |
|---|---|---|
| `ghat-900` | `#0F2E24` | Western Ghats forest. Hero band, header, primary buttons |
| `ghat-700` | `#1E4D3C` | Hover on dark, selected chips |
| `ghat-100` | `#E2ECE6` | Tinted panels, selected-state backgrounds |
| `stone-50` | `#F5F6F3` | Page background (cool, not cream) |
| `white` | `#FFFFFF` | Raised surfaces: results, forms, milestone bodies |
| `asphalt` | `#1B1F1D` | Primary text |
| `slate` | `#55605A` | Secondary text (≥ 6:1 on stone-50) |
| `line` | `#1B1F1D` @ 12% | Borders and dividers |
| `milestone` | `#F5C518` | Milestone caps and the single main action per screen. Always with asphalt text, never as text colour. |
| `leaf` | `#2E7D4F` | Success, fits, approved |
| `amber` | `#9A5200` | Caution text: rushed, over budget, few seats, unverified |
| `signal` | `#B3261E` | Errors, destructive actions |

No decorative gradients. The one scrim is a functional bottom darkening behind text on photos.

## Typography

One family: **Archivo** (variable, width 62–125, weight 100–900). Personality comes from the width axis, not from mixing faces.

| Role | Setting |
|---|---|
| Headlines | width 112–118, weight 750–800, tracking −0.015em, line height 1.02–1.1 |
| Milestone numerals | width 62 (condensed), weight 800, tabular figures |
| Body and UI | width 100, weight 400/500/600, 16px, line height 1.55 |
| Numbers in text | tabular figures |

Scale (px): 13 · 14 · 16 · 18 · 22 · 28 · 36 · 48 · 64 (clamped on mobile). Sentence case everywhere. No all-caps labels, no eyebrow labels above headings, no "·"-joined meta strings, no arrows appended to buttons.

## Shape and space

- 4px spacing base. Content max width 1200px; reading width ≤ 72ch.
- Radius by role: controls 8px; result and form surfaces 12px; photos 6px; milestone caps are a full semicircle (the stone shape); chips 999px (they are toggles).
- Borders over shadows. One shadow (`raise`) for things that float: menus, toasts, the mobile action bar.

## Components and states

- **Buttons:** `primary` = ghat-900 fill, white text. `go` = milestone yellow, asphalt text, used once per screen for the main action (Find trips, Save plan, Request to join). `quiet` = text with underline on hover. No pill buttons.
- **Focus:** 3px milestone-yellow ring with a 1px ghat-900 inner edge, visible on both light and dark.
- **Loading:** content-shaped skeletons while a real request is in flight; spinners only inside a submitting button.
- **Empty:** says why it is empty and offers the one action that changes that.
- **Error:** plain language plus retry where it helps. No raw server text.
- **Success:** confirm in place. A toast only when the result is off-screen.

## Motion

- 120ms press, 180ms colour, 300ms layout. Easing `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- Used for state change only: finder results re-ranking (layout animation), itinerary stops dragged and reordered, day switching, join-request status changes.
- One orchestrated moment: the home page road of milestones scrolls horizontally under your control, with no auto-scrolling.
- No scroll-triggered fade-ins, no hover scaling, no parallax, no auto-advancing carousels. `prefers-reduced-motion` disables layout animation.

## Voice

Plain, specific, honest. Lead with the numbers a traveller cares about. Every cost is an **estimate** with its working shown. Safety information is a set of checkable factors (arrival time, bus access, remoteness, declared stay features), never a "safe" badge. Sample data is labelled as sample. No invented reviews, testimonials or statistics.

## Responsive

Mobile-first; Tailwind breakpoints `sm 640 · md 768 · lg 1024`. The finder's controls collapse into a sheet on small screens with a sticky "Show N trips" bar; result rows stack with the photo on top; the itinerary switches days with a horizontal day strip. Touch targets are at least 44px.
