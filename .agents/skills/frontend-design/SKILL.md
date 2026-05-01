---
name: frontend-design
description: >
  Activate this skill when writing ANY React component, Tailwind styles,
  or frontend layout for FlowVault. Covers design tokens, animation
  patterns, component structure, and visual identity. MANDATORY before
  touching any .tsx file.
---

# Frontend Design Skill — FlowVault

## Design Philosophy

FlowVault's UI must feel **cinematic and precise** — like watching a
smart system explain itself. Not a dashboard. Not a dev tool. A product
demo that sells itself just by running.

Tone: Dark, intelligent, surgical. Like a Bloomberg terminal crossed
with a high-end product launch page.

## Typography

```css
/* Import at top of index.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

--font-display: 'DM Sans', sans-serif;
--font-mono: 'DM Mono', monospace;
```

- Headings: DM Sans 800, letter-spacing -0.02em
- Labels/tags: DM Mono 500, letter-spacing 0.08–0.12em, UPPERCASE
- Body: DM Sans 400–600
- Data values: DM Mono 400

## Color Tokens

```css
:root {
  --bg-base:       #080B10;
  --bg-surface:    rgba(255,255,255,0.03);
  --bg-surface-2:  rgba(255,255,255,0.06);
  --border:        rgba(255,255,255,0.07);
  --border-active: rgba(255,255,255,0.12);
  --text-primary:  #ffffff;
  --text-muted:    rgba(255,255,255,0.45);
  --text-faint:    rgba(255,255,255,0.25);

  /* Step type colors */
  --color-trigger:   #00FFA3;
  --color-fetch:     #00C2FF;
  --color-transform: #A78BFA;
  --color-decision:  #FBBF24;
  --color-action:    #F472B6;
  --color-output:    #34D399;

  /* Glows (35% opacity of step color) */
  --glow-trigger:   rgba(0,255,163,0.35);
  --glow-fetch:     rgba(0,194,255,0.35);
  --glow-transform: rgba(167,139,250,0.35);
  --glow-decision:  rgba(251,191,36,0.35);
  --glow-action:    rgba(244,114,182,0.35);
  --glow-output:    rgba(52,211,153,0.35);
}
```

## Animation Patterns

```css
/* Standard easing — use for all transitions */
--ease-smooth: cubic-bezier(0.23, 1, 0.32, 1);

/* Entry animation */
@keyframes fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Running step shimmer */
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Active status dot pulse */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.5); }
}
```

## Component Patterns

### Card (step card, workflow card)
```tsx
// Base card — copy this pattern
<div className={cn(
  "rounded-[14px] border p-4 transition-all",
  "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)]",
  isActive && "border-[var(--color-trigger)] shadow-[0_0_28px_var(--glow-trigger)]",
  isActive && "scale-[1.015]",
)}>
```

### Running shimmer overlay
```tsx
{isRunning && (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.2s_infinite]" />
)}
```

### Step icon bubble
```tsx
<div className={cn(
  "w-[38px] h-[38px] rounded-[10px] flex items-center justify-center",
  "border transition-all duration-300",
  isDone
    ? `bg-[${color}18] border-[${color}44]`
    : "bg-white/5 border-white/10",
)}>
  {isDone ? "✓" : icon}
</div>
```

### Progress bar
```tsx
<div className="h-[2px] bg-white/10 rounded-full mt-2">
  <div
    className="h-full rounded-full transition-[width] duration-75 linear"
    style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
  />
</div>
```

### Data chip
```tsx
<div className="bg-white/5 rounded-md px-2 py-1 font-mono text-[11px]">
  <span style={{ color }}>{key}</span>
  <span className="text-white/30"> = </span>
  <span className="text-white/60">{value}</span>
</div>
```

## Ambient Effects (apply to root layout)

```tsx
{/* Top-left mint glow */}
<div className="fixed -top-[200px] left-[30%] w-[600px] h-[600px] rounded-full pointer-events-none"
     style={{ background: 'radial-gradient(circle, rgba(0,255,163,0.06), transparent 70%)' }} />

{/* Bottom-right blue glow */}
<div className="fixed -bottom-[100px] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
     style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.05), transparent 70%)' }} />

{/* Grain overlay */}
<div className="fixed inset-0 opacity-[0.025] pointer-events-none z-[9999]"
     style={{ backgroundImage: "url(\"data:image/svg+xml,...grain svg...\")" }} />
```

## Layout Rules

- Max content width: 1100px, centered, 28px vertical padding, 20px horizontal
- Main grid: `grid-cols-[280px_1fr]` gap-5 (sidebar + main)
- Sidebar cards: gap-10 between each
- Connector beams between steps: 2px wide, 40px tall, animated fill

## Accessibility Checklist (QA will verify these)

- [ ] All buttons: `aria-label` or visible text
- [ ] All icon-only elements: `title` attribute + `aria-label`
- [ ] All interactive cards: `role="button"` + `tabIndex={0}` + `onKeyDown`
- [ ] Color alone never conveys meaning (always paired with text/icon)
- [ ] Focus rings: `focus-visible:ring-2 focus-visible:ring-[#00FFA3]`
