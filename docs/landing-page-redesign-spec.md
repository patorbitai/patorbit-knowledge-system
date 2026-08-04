# Patorbit Landing Page — Design Specification

## 1. UX Critique of Current Landing Page

| Issue | Severity | Impact |
|---|---|---|
| Value prop is abstract — "career told the truth" requires too much cognitive load to decode | High | Visitors bounce without understanding Patorbit |
| Static claims card looks like a mockup, not a live product | High | Reduces credibility; feels like a screenshot |
| No visual pipeline showing the AI workflow | High | Users don't grasp the product flow |
| CTA "Build Your Resume" undersells the platform — Patorbit is a Career Passport, not a resume builder | Medium | Lowers perceived value |
| Trust indicators feel generic (avatars, numbers) | Medium | Doesn't differentiate from any SaaS site |
| Section hierarchy is flat — Hero, WhyPatorbit, CoreModel, Products, CTA all feel equally weighted | Medium | No narrative arc guiding the user down |
| Micro-animations are present but not purposeful | Low | Missed opportunity for delight |
| No live data or real-time elements | Low | Feels static compared to Linear/Vercel caliber |

## 2. Visual Improvements

- **Typography:** Swap to tighter font stack (Inter at `font-weight: 400/500/600/700`). Use `tracking-tight` for headings, `leading-relaxed` for body. Headline should be one unified phrase, not split across lines.
- **Color:** Keep the dark `#070B14` base. Use cyan/blue gradient for primary actions. Introduce emerald for "verified" states, amber for "in progress", and subtle indigo/purple accents for the AI/graph stages.
- **Spacing:** 8px grid. Hero padding: `py-32`. Section gaps: `gap-24` between major sections. Card padding: `p-6` consistently.
- **Depth:** Layered glassmorphism — `backdrop-blur-xl`, `bg-slate-900/60`, `border border-slate-800/50`. Use two stacked card layers for depth (current + ghost cards behind).
- **Motion:** 150ms–200ms for micro-interactions (hover, tap). 400ms–600ms for staged entrances. 800ms–1.4s for pipeline progression.

## 3. Component Hierarchy (Top → Bottom)

```
Hero
├── Badge ("Live on Mainnet" with ping dot)
├── Headline (single unified phrase)
├── Subtitle (benefit-oriented, not feature-oriented)
├── CTA Group (Primary + Secondary)
├── Trust Bar (avatars + live count)
└── AI Pipeline Demo (right panel, animated)
    ├── Stage 1: Resume Imported
    ├── Stage 2: AI Extraction
    ├── Stage 3: Knowledge Graph
    ├── Stage 4: Evidence Verification
    ├── Stage 5: Trust Score
    └── [Final] Verified Claims Feed + Score

WhyPatorbit → three-column card grid (Identity, Evidence, Trust)

CoreModel → visual pipeline showing the architecture (Claims → Evidence → Graph → Verification → Score)

Products → product cards for each module (Resume Builder, Career Passport, Claims, etc.)

CTA → final conversion section with live social proof counter
```

## 4. Motion Design

- **Pipeline Stages:** Each stage animates in sequence. Completed stages show a checkmark. The active stage pulses with a spinning indicator. Detail text appears on activation.
- **Hover States:** Cards lift 2px (`-translate-y-0.5`) with a glow effect on the accent border. Transitions: 150ms ease-out.
- **Staggered Entrances:** Content fades in from `y: 12` with `delay: i * 0.08`. The right panel slides in from `x: 24`.
- **Score Animation:** Trust Score counts up from 0 to 84 over 1.5s with an ease-out curve.
- **Claim Validation:** Each claim in the final feed fades in sequentially (stagger: 80ms between items).

## 5. Technical Implementation

- **Framework:** Next.js 16.2 + React 19.2
- **Animation:** Framer Motion
- **Styling:** Tailwind CSS v4 with `clsx` for conditionals
- **State:** `useState` for pipeline stage + `useEffect` with timers for auto-advance. `useCallback` for the advance function.
- **Responsive:** Stack to single column at `lg` breakpoint. Pipeline moves below copy.
- **Accessibility:** `aria-live="polite"` on the pipeline for screen readers. Focus management on CTAs. Sufficient color contrast on all text.