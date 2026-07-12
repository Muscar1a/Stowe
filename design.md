# Design — Stowe

A locked design system for this app. Every view redesign reads this file before
emitting code. Do not regenerate per view — extend or amend this file when the
system needs to grow.

## Genre

modern-minimal · tone: **technical** (Linear / Zed / Raycast school).
Stowe is a desktop tool for managing AI CLI sessions — function carries every
view. No enrichment, no hero imagery, no decorative gradients.

## App shell (macrostructure)

Workbench: custom title bar → sidebar (nav + session list) → main area
(tab bar → context bar → terminal). Views inside the shell:

- **Launcher** ("Start a new session"): left-aligned column, section headings,
  card list. Typography only.
- **Terminal view**: tab strip with accent top-border on the active tab,
  thin mono metadata bar, full-bleed xterm.
- **Placeholders** (upcoming features): centered icon tile + two lines of text.

## Theme — a token contract, not a palette

Stowe ships **6 runtime themes** switched via `data-theme` on `<html>`
(`stowe-dark`, `catppuccin-mocha`, `dracula`, `tokyo-night`, `nord`,
`github-dark`). The design system therefore locks the **semantic token layer**;
each theme supplies its own values in `frontend/src/style.css`. Components must
reference tokens only — a raw hex/rgba in a component is a bug.

Per-theme tokens (overridden by each `[data-theme]` block):

| Token | Role |
| --- | --- |
| `--bg-main` | main content background |
| `--bg-sidebar` | sidebar + title bar background |
| `--bg-tabbar` | tab strip + dropdown/menu panels |
| `--bg-terminal` | xterm background |
| `--border-color` | hairline rules and borders |
| `--accent-color` | the single accent (active tab, focus ring, primary action) |
| `--accent-bg` | accent at ~10–15% alpha, for selected fills |
| `--text-main` | primary text |
| `--text-muted` | secondary text |

Universal tokens (declared once — all 6 themes are dark, so white-alpha
overlays and faint text hold everywhere):

| Token | Value | Role |
| --- | --- | --- |
| `--bg-raised` | `rgba(255,255,255,0.03)` | resting surface (cards, inputs) |
| `--bg-hover` | `rgba(255,255,255,0.06)` | hover fill |
| `--bg-active` | `rgba(255,255,255,0.09)` | pressed / selected fill |
| `--text-faint` | `rgba(255,255,255,0.35)` | tertiary text, disabled, metadata labels |
| `--win-close` | `#e81123` | Windows close-button hover (OS convention) |

Accent discipline: ≤ 5% of any screen. Accent appears only on the active-tab
indicator, focus rings, favorite stars, and at most one primary action per view.

## Typography

- **UI / body**: system sans — `"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif`.
  No bundled display face; a desktop tool has no hero. Hierarchy comes from
  weight (400/500/600) and the three text-color levels.
- **Mono**: `"Cascadia Mono", Consolas, ui-monospace, monospace` — for all
  technical metadata: timestamps, git branches, message counts, agent badges,
  session counts, section kickers. The mono discipline IS the technical voice.
- Scale: `text-[10px]` (mono metadata) · `text-xs` (12, default UI) ·
  `text-sm` (14, titles/buttons) · `text-xl` (20, view headings). Nothing larger.

## Spacing

Tailwind 4-pt scale (`p-2`, `gap-3`, …). No raw pixel values in components.

## Radius

Three steps, tight: `--radius-card: 8px` (cards, menus) ·
`--radius-control: 6px` (buttons, inputs, tabs) · `--radius-chip: 4px`
(badges, small chips). Pills (`rounded-full`) only for count bubbles.

## Motion

- `transition-colors` / `opacity` / `transform` only. Never layout properties.
- Durations 120–180ms, easing `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.
- No scroll reveals, no entrance animations. Silent success (UI updates in
  place; no toasts, no celebration).
- `prefers-reduced-motion`: nothing to collapse — spatial motion is not used.

## Microinteractions

- `:focus-visible` global ring: 2px `--accent-color`, offset 1px, never animated.
- Destructive actions: two-step confirm in place ("Click again to confirm"),
  never a native dialog.
- Hover-revealed controls (star, ⋮) fade with `opacity`, stay in layout.

## Icons

Inline SVG only, `currentColor`, 1.3px stroke, from
`frontend/src/components/icons.tsx`. **Emoji glyphs are banned in chrome**
(📁 ☰ ⚙ ★ ✏ 💬 ⎇ 🔍 — all replaced). Window controls keep their local SVGs in
`TitleBar.tsx`.

## CTA voice

- Primary: quiet — `bg-raised` fill + hairline border, text-main, hover to
  `bg-hover`. No color-filled buttons, no shadows, no gradients.
- Destructive: red text on the same quiet surface.
- Labels are verbs: "New Session", "Rename", "Delete Conversation".

## What views MUST share

- The token layer (never bypass with raw values).
- The mono-for-metadata rule.
- The radius scale and hairline-border language.
- The quiet CTA voice and accent discipline.

## What views MAY differ on

- Layout inside the main area (launcher column vs terminal fill vs placeholder).
- Density (sidebar list is tighter than launcher cards).

## Exports

Source of truth is `frontend/src/style.css` — the `:root` / `[data-theme]`
blocks plus the Tailwind v4 `@theme` mapping. No separate `tokens.css`; the
entry stylesheet already is the token file for this project.
