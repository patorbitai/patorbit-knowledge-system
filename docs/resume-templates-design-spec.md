# Resume Template Design Specification

> **Status:** Implemented (29 templates registered in `src/app/resume-builder/templates.ts`)
> **Note (2026-08-15):** this document originated as a design proposal for 22 templates. The library has since grown to **29 registered templates** — 8 flagship (Patorbit Modern, Minimal ATS, Executive Pro, Engineering Clean, Consulting Elite, Product Manager, Academic CV, Creative Professional) plus 21 legacy. The per-template specifications below remain the reference for the original 22 designs. All registered templates render through the `templateId → component` mapping, appear in the visual Template Gallery, and support the shared `ResumeStyleConfig` customization.
> **Design Goal:** 29 visually distinct, production-ready resume templates inspired by Novorésumé, Enhancv, Resume.io, FlowCV, Kickresume, Canva, and Reactive Resume. Each design is original.

---

## Design Philosophy

Every template must pass these tests:
1. **The Silhouette Test** — blurred to a silhouette, each template is uniquely identifiable by its layout shape alone.
2. **The Color Swap Test** — swapping one template's palette onto another still produces a different layout, not a lookalike.
3. **The Section Coverage Test** — all 10 resume sections render correctly and look intentional in every template.
4. **The Print Test** — the preview and PDF/DOCX export are pixel-identical.

---

## Template 1 — Executive

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Premium corporate, bold authority, high contrast |
| **Best Use Case** | C-suite, senior leadership, executive search |
| **Layout Type** | Single column — banner header + body |
| **Header Design** | Full-width dark navy/charcoal banner. Name in large serif (32px). Title in gold/amber below. Contact row (email, phone, location) in light grey. Social links at bottom of banner. Thin gold accent line separating banner from body. |
| **Typography** | Headers: Playfair Display (serif). Body: Inter / system sans. Title italic gold. Section titles small caps bold gold. |
| **Color Palette** | `bg: #0f172a` (banner), `text: #f59e0b` (gold accent), `body: #ffffff`, `body-text: #1f2937`, `muted: #6b7280` |
| **Section Order** | Profile → Experience → Education → Core Competencies → Projects → Certifications → Languages → Achievements |
| **Skills Visualization** | Gold-background pill chips with level badge — inline wrap, understated but visible. |
| **Experience Layout** | Bold position title (16px semibold) on one line with duration right-aligned. Company in italic gold below. Bullet description. |
| **Education Layout** | School left, degree + year right. Gold italic for degree name. |
| **Project Layout** | Project name bold, tech stack | separator, then description. |
| **Certification Layout** | Inline — name bold, issuer muted, separated by gold `—`. |
| **Language Layout** | Inline chips: `Name (Proficiency)`. |
| **Achievement Layout** | Trophy icon prefix, one per line. |
| **Interests Layout** | Dot-separated inline list in muted color. |
| **References Layout** | Name, position, company on separate lines in muted italic. |
| **Special Elements** | Gold underline accent (8px wide, 2px height) below each section title. Dark-to-light gradient transition from banner to body. |
| **ATS Compatibility** | High — clean structure, no columns, standard A sans font for body. |
| **Difficulty** | Medium |

---

## Template 2 — Modern Clean

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Minimalist, tech-forward, generous whitespace |
| **Best Use Case** | Tech, product management, design roles. General-purpose. |
| **Layout Type** | Single column — left-aligned header + flowing body |
| **Header Design** | Left-aligned layout (not centered). Name in extra-large light weight (36px, thin/light font-weight 200–300). Subtitle in grey below. Contact info in a horizontal row beneath. Thin 1px divider below header. Social links as icon-only row. |
| **Typography** | Headers: Inter (sans). Name: Extra-light weight 200, large. Section titles: 10px bold uppercase with 0.25em tracking. |
| **Color Palette** | `accent: #1e293b` (slate-800), `header-text: #0f172a`, `body: #ffffff`, `body-text: #334155`, `muted: #94a3b8`, `divider: #e2e8f0` |
| **Section Order** | Summary → Skills → Experience → Education → Projects → Certifications → Languages → Interests |
| **Skills Visualization** | Minimal dot-grid (4 dots per skill) — filled proportional to level. Clean, subtle. |
| **Experience Layout** | Timeline-style with thin vertical line on left. Position title bold at top, company in accent, duration right-aligned. Description with bullet support. |
| **Education Layout** | Institution name bold, degree/field on same line, year and GPA as secondary row. |
| **Project Layout** | Card-light: subtle border, no background color. Name, tech tags, role, description. |
| **Certification Layout** | Inline text: `Name — Issuer (date)` with muted styling. |
| **Language Layout** | Inline: `Name (Proficiency)` separated by mid-dot. |
| **Achievement Layout** | Left-rule (2px accent border on left) with description. |
| **Interests Layout** | Comma-separated inline in muted text. |
| **References Layout** | Name bold, position + company in muted text below. |
| **Special Elements** | Thin 1px dividers between each section, not full-width but running 60% of column. The gap between sections is consistently 24px. Skill dots use accent color with varying opacity. |
| **ATS Compatibility** | High — single column, clean text, no tabular data. |
| **Difficulty** | Low (baseline reference) |

---

## Template 3 — Split Vibrant

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Bold, colorful, high-energy two-column |
| **Best Use Case** | Creative professionals, marketing, brand managers |
| **Layout Type** | Two-column — dark left sidebar (30%) + white main (70%) |
| **Header Design** | No separate header block. Name/title inside the sidebar at top. Large bold name in white, title in accent color. Sidebar has a diagonal gradient or geometric pattern at bottom. |
| **Typography** | Sidebar: Inter (sans). Main: Inter / system. Name bold 18px white. Section headers: 10px bold uppercase with tracking in accent color. |
| **Color Palette** | `sidebar: linear-gradient(180deg, #0f172a, #1e293b)`, `sidebar-text: #cbd5e1`, `accent: #38bdf8` (sky-400), `body: #ffffff`, `body-text: #1e293b`, `muted: #64748b` |
| **Section Order** | *Sidebar:* Contact → Skills → Education → Languages. *Main:* About → Experience → Projects → Certifications → Interests |
| **Skills Visualization** | Progress bars in sidebar — thin 4px height, white/blue track, rounded. Level-based width. |
| **Experience Layout** | Timeline in main with sky-blue left border and dot markers. Position bold, company inline, duration right-aligned. |
| **Education Layout** | In sidebar only — school, degree, year stacked compact. |
| **Project Layout** | In main — name bold, tech tags as grey pills, description below. |
| **Certification Layout** | In sidebar — compact checkmark prefix. |
| **Language Layout** | In sidebar — name + proficiency inline. |
| **Achievement Layout** | In main — star prefix, one per line. |
| **Interests Layout** | In main — dot-separated inline. |
| **References Layout** | In main — name, position, company. |
| **Special Elements** | Sidebar has a subtle geometric accent pattern at the bottom (CSS pseudo-element with diagonal stripes at low opacity). Skill bars in sidebar animate to width. Contact uses icon prefixes (✉ 📞 📍). Two-column grid for education entries in sidebar. |
| **ATS Compatibility** | Medium — sidebar content may be missed; suitable for digital-first applications. |
| **Difficulty** | Medium |

---

## Template 4 — Classic Serif

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Traditional, formal, editorial |
| **Best Use Case** | Law, finance, academia, consulting |
| **Layout Type** | Single column — elegant centered header + serif body |
| **Header Design** | Centered, border-bottom double-line (thick + thin). Name in large serif bold (navy). Title in italic. Contact row separated by `|` pipes. |
| **Typography** | Headers: Playfair Display or EB Garamond. Section titles: 11px bold small caps with decorative underline (short rule centered or left). Body text: 12px serif with generous leading (1.6). |
| **Color Palette** | `primary: #1e3a8a` (navy), `body: #ffffff`, `body-text: #1f2937`, `muted: #4b5563`, `divider: #d1d5db`, `accent: #3b82f6` |
| **Section Order** | Summary → Experience → Education → Areas of Expertise → Projects → Certifications → Languages → Achievements → Interests |
| **Skills Visualization** | Categorized inline text: `Skill (Category) · Level` with dotted separators. No bars or chips — pure text, academic style. |
| **Experience Layout** | Two-line header: position bold left, duration italic right. Company in italic on next line. Description with left border rule (1.5px navy at 30% opacity). Classic newspaper column feel. |
| **Education Layout** | School bold, degree + field italic on same line, year in muted parentheses. |
| **Project Layout** | Title bold, tech muted. Description with left border. |
| **Certification Layout** | Name bold with comma, issuer muted, date in parentheses. |
| **Language Layout** | Name + proficiency in parentheses, semicolons between entries. |
| **Achievement Layout** | Em-dash prefix, left-bordered block. |
| **Interests Layout** | Comma-separated italic in muted color. |
| **References Layout** | Name, title, company with italic styling. |
| **Special Elements** | Decorative double-line header border (1.5px solid + 0.5px thin below). Section titles use small caps with a short 20px underline rule. Page number treatment. ATS-friendly pure text. |
| **ATS Compatibility** | Very high — pure text, no columns, no graphical elements. |
| **Difficulty** | Low |

---

## Template 5 — Tech Mono

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Developer aesthetic, terminal-inspired, hacker chic |
| **Best Use Case** | Software engineers, DevOps, engineering roles |
| **Layout Type** | Single column — terminal window frame + code-like body |
| **Header Design** | Frame starts with traffic-light dots (🔴🟡🟢) in top-left corner, resembling a code editor or terminal window. Name as a shell prompt `~/ $ name`. Title as a comment `// title`. The whole layout sits inside a subtle terminal border. |
| **Typography** | SF Mono / JetBrains Mono / monospace exclusively. 11–13px body. Bold for headings. Code comment styling (//) for section titles. |
| **Color Palette** | `bg: #0d1117` (dark), `text: #c9d1d9` (light grey), `accent: #58a6ff` (blue), `green: #3fb950`, `comment: #8b949e`, `string: #a5d6ff`, `variable: #ffa657` |
| **Section Order** | `// summary` → `// experience` → `// education` → `// skills` → `// projects` → `// certifications` → `// languages` |
| **Skills Visualization** | `key: value` pairs, brackets for level `[Expert]`, years `(5y)`. Two-col grid. Pure text. |
| **Experience Layout** | Terminal-style: each entry has a `$` prompt prefix or `>` arrow. Position as function call `position()` with company as parameter. Duration in grey comment `#duration`. |
| **Education Layout** | School as header, degree as path `~/education/degree/field`. Year as comment. |
| **Project Layout** | Directory-style: `~/projects/name/` with tech as imports. |
| **Certification Layout** | Badge-style: `[cert-name]` brackets, issuer as issuer. |
| **Language Layout** | `Name (Proficiency)` with grey comment styling. |
| **Achievement Layout** | `> git commit -m "description"` style quotes. |
| **Interests Layout** | `# interests: item, item, item` as comment line. |
| **References Layout** | `REF: Name — position at company` as structured data. |
| **Special Elements** | Window chrome (traffic-light dots, subtle border). Comment-highlighted section titles. Command prompt `$` and `>` prefixes. Code syntax coloring (blue for keywords, orange for strings, green for comments). ASCII separators like `===` or `---`. |
| **ATS Compatibility** | Medium — pure text but unusual formatting may confuse some parsers. Best for tech-forward companies. |
| **Difficulty** | Medium |

---

## Template 6 — Creative Burst

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Expressive, vibrant, artistic flair |
| **Best Use Case** | Graphic designers, UX/UI designers, art directors |
| **Layout Type** | Single column with left accent strip — magazine feel |
| **Header Design** | Gradient accent strip (2–3px) on the left side running full height. Header uses a colored background vignette/glow behind the name. Name extra-large with a period accent in pink. Subtitle "Hello, I'm" pre-header in small caps. |
| **Typography** | Headers: Plus Jakarta Sans or Poppins. Section titles: black 10px with star prefix `✦`. Body: clean sans 11px. |
| **Color Palette** | `strip: linear-gradient(#7c3aed, #c026d3)`, `bg: #ffffff`, `name: #312e81`, `body-text: #1f2937`, `accent: #7c3aed`, `highlight: #c026d3`, `muted: #6b7280` |
| **Section Order** | My Story (summary) → Experience → Education → Skills → Projects → Certifications → Achievements → Languages → Interests |
| **Skills Visualization** | Grid layout (2-col) with dot-rating (4 dots). Each dot is a rounded bar segment. Filled dot color = accent, unfilled = muted at 15%. |
| **Experience Layout** | Rotated diamond markers (CSS transform rotate 45°) on a timeline line. Position bold, company accent, duration right. Achievement entries in highlight pink. |
| **Education Layout** | Card-style (2-col grid) with subtle border, rounded corners. School, degree, year, GPA each on separate lines inside the card. |
| **Project Layout** | 2-col grid with tinted background cards. Status badge (Completed/In Progress) top-right. Role in accent, description, tech stack at bottom. |
| **Certification Layout** | Inline pill badges — rounded full, accent tinted bg, name + issuer separated by `·`. |
| **Language Layout** | 2-col grid: Name bold, proficiency muted. |
| **Achievement Layout** | Star prefix, one per line. |
| **Interests Layout** | Star-separated inline list: `item ✦ item ✦ item`. |
| **References Layout** | 2-col grid: name, position, company each on own line. |
| **Special Elements** | Full-height left gradient accent strip (3px). Subtle circular glow/decoration absolutely positioned in header. Diamond-shaped timeline markers. Star typography decoration. Grid-based layouts for education, projects, skills. |
| **ATS Compatibility** | Low — multi-column grid layouts may confuse ATSParsers. Best for design portfolio applications. |
| **Difficulty** | High |

---

## Template 7 — Compact Pro

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Dense, efficient, information-rich |
| **Best Use Case** | Experienced professionals with extensive career history, career changers |
| **Layout Type** | Single column — optimized for maximum content density |
| **Header Design** | Ultra-compact: name and title inline on one line, contact compact on the right side of same line. All in a single-row flex layout. No wasted vertical space. |
| **Typography** | System font stack (Inter/Roboto). Name: 16px bold. Body: 10.5px. Compact line-height (1.3). |
| **Color Palette** | `accent: #2563eb` (blue-600), `bg: #ffffff`, `text: #1f2937`, `muted: #6b7280`, `divider: #e5e7eb` |
| **Section Order** | Profile → Experience → [split col: Education | Skills] → [split col: Projects | Certifications] → [split col: Languages | Interests | Achievements] |
| **Skills Visualization** | Inline pill tags: very compact, blue-tinted bg, name + level `·` if not Intermediate, years as `· Ny`. |
| **Experience Layout** | Position and company inline: `position @ company · location`. Duration right-aligned. Description compact below. Tools line at bottom. |
| **Education Layout** | Left column of a 2-col split: school bold right-aligned with year. Degree + field + GPA on next line. |
| **Project Layout** | Right column of 2-col split: name bold, role/tech, description compact. |
| **Certification Layout** | Name bold, issuer muted, date inline. |
| **Language Layout** | 3-col split with Interests and misc: name (proficiency) dot-separated. |
| **Achievement Layout** | Bullet points, one per line. |
| **Interests Layout** | Dot-separated inline. |
| **References Layout** | Name bold, company after `·`. |
| **Special Elements** | Consistent 2-col and 3-col grid splits to maximize density. Minimal vertical padding (16px section gap). Thin hairline dividers. Font size 10.5px for body — smallest readable. All sections fit on one page for experienced profiles. |
| **ATS Compatibility** | High — single column with clean text, columns use CSS grid (prints as full-width in some parsers). |
| **Difficulty** | Medium |

---

## Template 8 — Corporate Blue

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Trustworthy, established, professional services |
| **Best Use Case** | Consulting, banking, law, insurance |
| **Layout Type** | Single column — colored banner header with initial avatar |
| **Header Design** | Full-width navy banner with white text and a circular initial avatar (first letter of name in a white‑bordered circle on the left). Name next to avatar, title below. Contact info as muted white row. Gives a professional-services look. |
| **Typography** | Headers: Montserrat (sans). Section titles: 10px bold uppercase with 0.16em tracking. Body: 11.5px Montserrat. |
| **Color Palette** | `banner: #1e3a8a`, `banner-text: #ffffff`, `avatar-bg: rgba(255,255,255,0.15)`, `body: #ffffff`, `body-text: #1f2937`, `accent: #1e3a8a`, `muted: #64748b`, `highlight-bg: #eff6ff` |
| **Section Order** | Executive Profile (summary) → Professional Experience → Education → Core Competencies → Selected Projects → Certifications → Achievements → Languages → Interests |
| **Skills Visualization** | 3-col grid of cards with light blue tinted background. Skill name bold, category + level in muted below. |
| **Experience Layout** | Timeline with left border (navy). Circle markers on the line. Position bold navy, company semibold below, duration right-aligned. Description and achievements separate. |
| **Education Layout** | 2-col grid of navy left-bordered boxes. School bold, degree + field, year/GPA/location on separate line. |
| **Project Layout** | 2-col grid. Name bold, status chip, role, description, tech stack. |
| **Certification Layout** | 2-col grid: name bold, issuer `—`, date muted. |
| **Language Layout** | Inline: `Name — Proficiency` separated by `·`. |
| **Achievement Layout** | Bullet list with `•` prefix. |
| **Interests Layout** | Dot-separated text in muted. |
| **References Layout** | 2-col grid: name bold, position + company. |
| **Special Elements** | Circular initial avatar in banner. Blue-tinted skill cards. Blue timeline markers. Grid-based education, projects, certifications. Light highlight background (`#eff6ff`) used consistently for card surfaces. |
| **ATS Compatibility** | Medium — grid layouts and timeline markers may confuse basic parsers. |
| **Difficulty** | High |

---

## Template 9 — Minimal Edge

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Ultra-minimal, Swiss-inspired, obsessive whitespace |
| **Best Use Case** | Architects, minimalists, design leaders |
| **Layout Type** | Single column — extreme whitespace with thin lines |
| **Header Design** | Massive name (36px, font-weight 200), small uppercase subtitle below (9px, 0.3em tracking). Contact row in light grey beneath. The name is the dominant visual element. |
| **Typography** | Headers: Work Sans (sans). Name: 36px extra-light 200. Section titles: 9px bold uppercase 0.3em tracking. Body: 11px. |
| **Color Palette** | `text: #0f172a`, `accent: #475569`, `body: #ffffff`, `body-text: #334155`, `muted: #94a3b8`, `border: #e2e8f0`, `lines: #cbd5e1` |
| **Section Order** | Summary → Experience → Education → Capabilities (skills) → Selected Work (projects) → Credentials (certs) → Recognition (achievements) → Languages → Interests → References |
| **Skills Visualization** | 3-col grid of border-bottom entries. Skill name as label, category/level as uppercase muted secondary line. No bars, no chips — pure typography. |
| **Experience Layout** | Position and company on one line, duration as uppercase right-aligned. Description below. Extremely clean, minimal separators. |
| **Education Layout** | 2-col grid. School bold, year right. Degree/field on second line. Honors on third in muted. |
| **Project Layout** | 2-col grid. Name bold, date range right. Role as uppercase subtitle. Description. Tech stack. |
| **Certification Layout** | 2-col grid: name/issuer separated by `/`, date after `/`. |
| **Language Layout** | 3-col grid: name / proficiency. |
| **Achievement Layout** | Plain text lines, no prefix. |
| **Interests Layout** | Slash-separated inline. |
| **References Layout** | 3-col grid: name / company. |
| **Special Elements** | Everything is thin lines and whitespace. Border-bottom only (no background fills, no cards, no bars). Section gaps are 28px — generous. The design is almost entirely type-driven. No visual noise. |
| **ATS Compatibility** | Very high — pure single-column text, no graphical elements. |
| **Difficulty** | Low |

---

## Template 10 — Banner Bold

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Bold, commanding, high-impact |
| **Best Use Case** | Sales leaders, politicians, public speakers, executives |
| **Layout Type** | Single column — large color banner + body |
| **Header Design** | Massive full-width red/crimson banner taking ~25% of the page. Name in white 28px font-black, uppercase. Title in lighter shade. Contact in very light red. Banner has a subtle pattern overlay (diagonal stripes at 5% opacity). |
| **Typography** | Headers: Montserrat (sans). Name: 28px black weight, uppercase, tracking-tight. Section titles: 10px bold uppercase. Body: 11.5px. |
| **Color Palette** | `banner: #b91c1c`, `banner-text: #ffffff`, `banner-muted: #fecaca`, `body: #ffffff`, `body-text: #1f2937`, `accent: #b91c1c`, `muted: #6b7280`, `bar-bg: #e5e7eb` |
| **Section Order** | Profile → Experience → Education → Skills → Projects → Certifications → Languages → Achievements → Interests |
| **Skills Visualization** | Horizontal progress bars with level-based widths. Skill name above bar, bar track in light grey, fill in banner red. Clean and direct. |
| **Experience Layout** | Left accent bar (4px rounded) in red at 20% opacity. Position bold, company in accent red, duration right-aligned. Plain bullet description. |
| **Education Layout** | School bold, degree/field, year inline. Clean single-line entries. |
| **Project Layout** | Name bold, tech muted right, description below. |
| **Certification Layout** | Inline: name bold, issuer muted. |
| **Language Layout** | Inline: `Name (Proficiency)`, comma-separated. |
| **Achievement Layout** | Trophy emoji prefix, one per line. |
| **Interests Layout** | Comma-separated inline. |
| **References Layout** | Name, position, company per line. |
| **Special Elements** | Full-width banner with subtle diagonal stripe pattern. Large uppercase name. Red accent bar on experience entries. Progress bars for skills. Consistently uses red accent everywhere. |
| **ATS Compatibility** | Medium — progress bars may not parse, banner is fine. |
| **Difficulty** | Medium |

---

## Template 11 — Sidebar Elegance

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Refined, editorial, fashion-forward |
| **Best Use Case** | Fashion, luxury, editorial roles |
| **Layout Type** | Two-column — right sidebar (rose/dark, 35%) + left main content (65%) |
| **Header Design** | Content area has its own header: name in rose color bold, title in muted below, summary right in the header area. |
| **Typography** | Headers: Lato (sans). Sidebar: 10px uppercase with light pink tracking. Content: 11px. |
| **Color Palette** | `sidebar: #881337` (rose-900), `sidebar-text: #ffffff`, `sidebar-muted: #fda4af`, `accent: #881337` (rose-900), `body: #ffffff`, `body-text: #1c1917`, `muted: #78716c` |
| **Section Order** | *Content:* Summary (in header) → Experience → Education → Projects → Achievements → References. *Sidebar:* Initial avatar → Contact → Skills (with bars) → Certifications → Languages → Interests |
| **Skills Visualization** | Progress bars in sidebar, rose-pink fill on white/20bg. Level-based width. |
| **Experience Layout** | Position bold rose, company semibold, duration right. Description below. Achievement line in light rose. Clean and elegant. |
| **Education Layout** | School bold rose, degree/field, year, GPA. Clean separator. |
| **Project Layout** | Name bold rose, status chip, role, description, tech. |
| **Certification Layout** | In sidebar: compact, name + issuer dot-separated. |
| **Language Layout** | In sidebar: name, proficiency after `·`. |
| **Achievement Layout** | Star prefix in content, one per line. |
| **Interests Layout** | In sidebar: dot-separated compact. |
| **References Layout** | In content: name bold, position-company on next line. |
| **Special Elements** | Initial avatar in sidebar (2-letter, white border circle, large). Sidebar uses rose-900 — warm and distinctive. Content starts with a short horizontal rule + accent-colored section headers. Contact in sidebar uses emoji prefixes (✉, 📞, 📍). This is the inverse of Gradient Flow (sidebar on right vs left). |
| **ATS Compatibility** | Medium — two-column layout. |
| **Difficulty** | High |

---

## Template 12 — Gradient Flow

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Modern, fluid, smooth color transitions |
| **Best Use Case** | SaaS companies, modern tech, forward-thinking roles |
| **Layout Type** | Two-column — gradient left sidebar (blue gradient, 30%) + white main (70%) |
| **Header Design** | Name and title at top of gradient sidebar. White text on gradient. Title in lighter opacity. The sidebar has a smooth gradient from deep blue to sky blue. |
| **Typography** | Headers: Plus Jakarta Sans. Section titles in sidebar: 10px uppercase at white/60. Content section titles: 10px black uppercase with dot accent prefix. |
| **Color Palette** | `sidebar: linear-gradient(180deg, #0284c7, #38bdf8)`, `sidebar-text: #ffffff`, `content-accent: #0284c7`, `body: #ffffff`, `ink: #164e63`, `muted: #64748b` |
| **Section Order** | *Sidebar:* Contact → Skills (bars) → Education → Certifications → Languages. *Content:* Summary → Experience → Projects → Achievements → Interests → References |
| **Skills Visualization** | Progress bars in sidebar — white fill on white/25bg. Rounded caps. |
| **Experience Layout** | Timeline with dot-circle markers on a thin vertical line. Position bold in accent blue, company on next line, duration right. Description below. Achievement text in sky blue. |
| **Education Layout** | In sidebar only: school bold, degree, year, GPA. Stacked vertically. |
| **Project Layout** | Name bold, date range + status inline, role/tech on same line, description. |
| **Certification Layout** | In sidebar: checkmark prefix `✓`, name, issuer. |
| **Language Layout** | In sidebar: name bold, proficiency after `·`. |
| **Achievement Layout** | Star prefix with description. |
| **Interests Layout** | Dot-separated inline in main content. |
| **References Layout** | Name bold, position-company. |
| **Special Elements** | Gradient sidebar (blue). Timeline with circle markers. Summary in a tinted card (bg: accent at 3% opacity, rounded corners). Blue dot accent before each main section title. Distinct from Split Vibrant by color (blue vs dark) and sidebar position (left) and gradient vs flat. |
| **ATS Compatibility** | Medium — two-column, cards. |
| **Difficulty** | Medium |

---

## Template 13 — Academic Formal

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Scholarly, publication-ready, rigorous |
| **Best Use Case** | Professors, researchers, PhDs, scientists |
| **Layout Type** | Single column — paper-like, margins, publication format |
| **Header Design** | Centered, looks like a paper title. Name in 28px serif bold, navy. Title in italic below. Contact row with pipe separators. Pronouns and nationality included in header. Double-line border (thick navy, thin rule). |
| **Typography** | Headers: EB Garamond or Lora (serif). Body: 11.5px serif, 1.5 line-height. Section titles: 12px bold uppercase with 0.12em tracking, bordered below. |
| **Color Palette** | `primary: #1e3a8a` (navy), `body: #ffffff`, `body-text: #1f2937`, `muted: #6b7280`, `border: #d1d5db`, `accent: #3b82f6` |
| **Section Order** | Abstract (summary) → Appointments (experience) → Education & Degrees → Research Areas & Competencies (skills) → Publications & Projects → Certifications & Fellowships → Honors & Awards → Languages → Scholarly Interests → References |
| **Skills Visualization** | 2-col grid: skill name + category in italic, separated by `·`. Pure text, academic CV style. |
| **Experience Layout** | Position as section header, company+location italic on next line, duration right-aligned. Description with left border (1px navy) for blockquote feel. Achievements inline. |
| **Education Layout** | School bold, degree in field italic with year in parentheses. GPA right-aligned. Honors and minor as separate italic lines. |
| **Project Layout** | Name bold, role italic, date range right. Description block. Methods (tech) line at bottom in italic. |
| **Certification Layout** | Name bold, `—` issuer, date in parentheses. |
| **Language Layout** | Name bold, proficiency italic in parentheses. |
| **Achievement Layout** | Left-bordered block (1px navy 30%). |
| **Interests Layout** | Comma-separated italic list: "Scholarly Interests" section title. |
| **References Layout** | Name bold, position + company italic, email `·` separated. Academic CV format. |
| **Special Elements** | Double-line header border (thick/thin). Publication-style formatting. Section titles use "&" formatting. Italic extensively used for secondary information. Decorative underline on section titles (bordered, not colored). |
| **ATS Compatibility** | High — pure text, standard CV format. |
| **Difficulty** | Low |

---

## Template 14 — Startup Vibe

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Energetic, fresh, casual-professional |
| **Best Use Case** | Startups, tech companies, growth roles |
| **Layout Type** | Two-column — wide main (75%) + narrow right sidebar (25%) |
| **Header Design** | Clean header in main: name bold dark green, title with rocket emoji prefix, contact with emoji. Sidebar has a large emoji icon at top inside a tinted circle. |
| **Typography** | Headers: Poppins (sans). Body: 11px Poppins. Section titles: 10px bold uppercase with tracking. |
| **Color Palette** | `main-accent: #047857` (emerald-700), `sidebar: #022c22` (emerald-950), `sidebar-text: #a7f3d0`, `body: #ffffff`, `ink: #064e3b`, `accent: #10b981` |
| **Section Order** | *Main:* Summary → Hustle History (experience) → Education → Side Projects. *Sidebar:* Emoji icon → Skills → Badges (certs) → Languages |
| **Skills Visualization** | In sidebar: simple name + level in two-column flex. No bars, no chips. Minimal. |
| **Experience Layout** | Position bold, duration right in accent. Company + location on next line. Description. Clean and direct. |
| **Education Layout** | School bold, degree + year right. Simple. |
| **Project Layout** | Name bold, tech after `|`. Description. |
| **Certification Layout** | In sidebar: trophy emoji + name. |
| **Language Layout** | In sidebar: name only. |
| **Achievement Layout** | Not shown in this template. |
| **Interests Layout** | Not shown in this template. |
| **References Layout** | Not shown in this template. |
| **Special Elements** | Emoji accents throughout. Rocket `🚀` prefix on title. Trophy emoji for certs. Dark sidebar contrasting with white main. "Hustle History" and "Side Projects" as playful section names. Note: This template currently doesn't render achievements, interests, or references — it must be updated to include them in the full spec. |
| **ATS Compatibility** | Medium — two-column layout, emojis may confuse parsers. |
| **Difficulty** | Low-Medium |

---

## Template 15 — Dark Elegance

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Dark mode, sophisticated, modern luxury |
| **Best Use Case** | Design leaders, product executives, night-mode enthusiasts |
| **Layout Type** | Single column — full dark theme with card-based sections |
| **Header Design** | Dark header (slightly darker than body) centered. Name in white, title in accent blue. Contact row in grey. The whole page is dark — white text on dark backgrounds. |
| **Typography** | Headers: Inter (sans). Body: 12px Inter. White text on #0f172a background. |
| **Color Palette** | `page-bg: #0f172a` (slate-900), `header-bg: #111827`, `card-bg: #1e293b`, `text: #f3f4f6`, `accent: #60a5fa`, `muted: #9ca3af` |
| **Section Order** | Profile → Experience → Education → Skills → Projects → Languages → Achievements |
| **Skills Visualization** | Chips with dark card background: name in muted, no vibrant colors. Pill-style with dark card bg. |
| **Experience Layout** | Dark card (bg: #1e293b, rounded-lg, padding). Position bold white, duration muted right. Company/line accent. Description inside card. |
| **Education Layout** | School and degree inline, year muted. Flat text, no card. |
| **Project Layout** | White-text name, tech muted right. Same dark card treatment. |
| **Certification Layout** | Not shown — must be added. |
| **Language Layout** | Name + proficiency, comma-separated inline. |
| **Achievement Layout** | Star prefix, one per line in lighter text. |
| **Interests Layout** | Not shown — must be added. |
| **References Layout** | Not shown — must be added. |
| **Special Elements** | Dark theme throughout. Card-based experience and project entries with subtle depth. The only template that's fully dark. Uses layered backgrounds (page bg → header bg → card bg) for depth without shadows. Note: This template currently doesn't render certifications, interests, or references — all must be added. |
| **ATS Compatibility** | Medium — dark background may not print well; PDF export must force white text. |
| **Difficulty** | Medium |

---

## Template 16 — Timeline Pro

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Career-focused, chronological, visual progression |
| **Best Use Case** | Career changers, professionals with clear progression, project managers |
| **Layout Type** | Single column — visual timeline for experience, clean body for rest |
| **Header Design** | Centered, teal underline accent (2px). Name bold, title in teal below. Contact row compact. |
| **Typography** | Headers: Lato (sans). Body: 11.5px Lato. |
| **Color Palette** | `accent: #0d9488` (teal-600), `body: #ffffff`, `text: #1f2937`, `muted: #6b7280` |
| **Section Order** | Summary → Experience → Education → Skills → Projects → Languages |
| **Skills Visualization** | Pill chips with teal-tinted bg and teal text. Simple and clean. |
| **Experience Layout** | The key feature: vertical timeline. Each experience entry has a circle marker on the left connected by a vertical line. The first/current role has a filled circle, past ones are hollow. Position bold, company below, duration right. Description below. |
| **Education Layout** | School bold, degree/field/year on same line right-aligned. |
| **Project Layout** | Name bold, tech right. Description. |
| **Certification Layout** | Not shown — must be added. |
| **Language Layout** | Inline: name (proficiency), dot-separated. |
| **Achievement Layout** | Not shown — must be added. |
| **Interests Layout** | Not shown — must be added. |
| **References Layout** | Not shown — must be added. |
| **Special Elements** | Timeline with circle markers connected by vertical lines. First entry (current job) has filled circle, rest are hollow. Summary in italic with teal left border (3px). Teal accent throughout. Note: Must add certifications, achievements, interests, references to complete. |
| **ATS Compatibility** | Medium — timeline visual elements may confuse parsers. |
| **Difficulty** | Medium |

---

## Template 17 — Premium Slate

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Understated luxury, muted elegance, refined |
| **Best Use Case** | Consultants, strategists, advisors |
| **Layout Type** | Single column — header banner (slate) + off-white body |
| **Header Design** | Slate-grey banner (full width) with white text. Name large bold, title in 80% white. Contact row muted. Banner feels premium and restrained. |
| **Typography** | Headers: Work Sans (sans). Body: 11.5px system. Section titles: 10px bold uppercase with tracking in indigo accent. |
| **Color Palette** | `banner: #475569` (slate-600), `banner-text: #ffffff`, `body: #f1f5f9` (slate-100, off-white), `accent: #6366f1` (indigo-500), `text: #1e293b`, `muted: #64748b` |
| **Section Order** | Professional Summary → Work Experience → Education | Skills & Expertise → Key Projects → Certifications | Languages |
| **Skills Visualization** | Progress bars with indigo fill on slate-300 track. Level-based width. |
| **Experience Layout** | Position bold, duration right. Company accent on next line. Description. Clean single-column. |
| **Education Layout** | Left column of split: school bold, degree, year. |
| **Project Layout** | Name bold, role accent, description, tech line. |
| **Certification Layout** | Inline with Languages in 2-col grid. |
| **Language Layout** | Name + proficiency in muted. |
| **Achievement Layout** | Not shown — must be added. |
| **Interests Layout** | Not shown — must be added. |
| **References Layout** | Not shown — must be added. |
| **Special Elements** | Off-white body background (slate-100) — unique among templates. Indigo accent for section titles and bars. Slate banner. Split-grid layout for education/skills and certs/languages. Note: Must add achievements, interests, references. |
| **ATS Compatibility** | High — clean single column, off-white bg is subtle. |
| **Difficulty** | Low-Medium |

---

## Template 18 — Nature Green

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Organic, fresh, natural tones |
| **Best Use Case** | Environmental, sustainability, agriculture, wellness |
| **Layout Type** | Single column — circular photo placeholder + green accents |
| **Header Design** | Circular portrait placeholder (border-4 in green, large circle) centered at top. Name below in dark green serif. Title in vibrant green. Contact row. |
| **Typography** | Headers: Roboto Slab (slab-serif). Body: 14px Roboto Slab (larger, more readable). Section titles: bold uppercase with green underline. |
| **Color Palette** | `accent: #22c55e` (green-500), `dark: #166534`, `ink: #1a2e05`, `body: #f0fdf4` (green-50), `muted: #526044` |
| **Section Order** | About Me → Experience → [col: Education | Certifications] → [col: Skills | Languages] → Projects |
| **Skills Visualization** | Text list with category and level — no bars, no chips. Natural, understated. |
| **Experience Layout** | Position bold, duration right. Company in green, location. Description. |
| **Education Layout** | Left column: school bold, degree, year. |
| **Certification Layout** | Right column: name bold, issuer. |
| **Language Layout** | Right column: name + proficiency. |
| **Achievement Layout** | Not shown — must be added. |
| **Interests Layout** | Not shown — must be added. |
| **References Layout** | Not shown — must be added. |
| **Special Elements** | Green-50 tinted body background — fresh, natural feel. Circular photo area at top (border-4 in green, placeholder only). Green-underline section titles. 2-col grids for edu/certs and skills/languages. The only template with such a large circular portrait. Note: Must add achievements, interests, references. |
| **ATS Compatibility** | Medium — circular portrait is decorative only, doesn't affect text. |
| **Difficulty** | Low-Medium |

---

## Template 19 — Luxury Gold

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Opulent, high-end, warm metallics |
| **Best Use Case** | Luxury brands, high-end sales, wealth management |
| **Layout Type** | Single column — dark header banner with gold accents |
| **Header Design** | Dark/charcoal banner with gold accent. Name in large serif (Playfair Display), gold. Title in warm ivory. Contact in warm grey. Gold decorative divider (a thin rule with a diamond or dot center). |
| **Typography** | Headers: Fraunces (luxury serif) or Playfair Display. Name: 28px serif, gold. Section titles: small caps in gold/amber. Body: system sans 12px. |
| **Color Palette** | `banner: #1c1917` (warm-950), `gold: #d97706` (amber-600), `gold-light: #fbbf24`, `body: #fffbeb` (amber-50), `text: #292524`, `muted: #78716c` |
| **Section Order** | Profile → Experience → Education → Skills → Projects → Certifications → Languages → Achievements |
| **Skills Visualization** | Chips with gold-tinted bg, text in dark brown. |
| **Experience Layout** | Position bold, duration right. Company in gold italic. Description. |
| **Education Layout** | School bold, degree italic, year muted. |
| **Project Layout** | Name bold, tech right. Description. |
| **Certification Layout** | Inline: name, issuer, date. |
| **Achievement Layout** | Trophy emoji or star, one per line. |
| **Interests Layout** | Dot-separated inline. |
| **References Layout** | Name, position, company. |
| **Special Elements** | Warm amber-50 body background. Gold accents throughout. Warm-charcoal banner. Fraunces serif font for headers — unique among all templates. Decorative diamond divider between sections or after header. Warm, rich color palette. |
| **ATS Compatibility** | High — mostly clean single column. |
| **Difficulty** | Medium |

---

## Template 20 — Swiss Design

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Grid-based, mathematical, precise, International Typographic Style |
| **Best Use Case** | Graphic designers, architects, UI designers |
| **Layout Type** | Two-column grid (strict CSS grid, not flex) — left condensed (40%) + right detailed (60%) |
| **Header Design** | No traditional header. Name and title in a colored grid cell at top-left of the grid. Contact in top-right cell. Name is large (24px) in red or blue, sans-serif, all the visual hallmarks of Swiss Style. |
| **Typography** | Headers: Inter or Helvetica Neue (sans). Strictly sans-serif throughout. Section titles: 9px uppercase bold with 0.25em tracking, red or blue. Body: 10px. Grid-based alignment — everything aligns to the same baseline grid. |
| **Color Palette** | `accent: #dc2626` (red-600) or `#2563eb` (blue-600), `body: #ffffff`, `text: #111827`, `muted: #6b7280`, `grid-lines: #e5e7eb` |
| **Section Order** | Left column: Skills → Languages → Interests → References. Right column: Summary → Experience → Education → Projects → Certifications → Achievements |
| **Skills Visualization** | 2-col grid of compact entries: name and level/category. Minimal, typographic. |
| **Experience Layout** | In right column, minimal: position, company, duration, description. Extremely clean. |
| **Education Layout** | School, degree, year in minimal entries. |
| **Project Layout** | Name, tech, description. Compact. |
| **Certification Layout** | Inline text. |
| **Language Layout** | Name and proficiency in 2-col flex. |
| **Achievement Layout** | Bullet points. |
| **Interests Layout** | Compact inline text. |
| **References Layout** | Compact entries. |
| **Special Elements** | Strict grid layout inspired by Swiss typography. Red or blue accent (like classic Swiss posters). Grid lines visible or implied. Everything aligns to the same grid. Name in a colored banner cell. No rounded corners — everything is square. Asymmetric balance. This is the most distinctive layout of the set. |
| **ATS Compatibility** | Medium — grid layout may confuse parsers. |
| **Difficulty** | High |

---

## Template 21 — Scientific

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Research paper, citation-ready, structured |
| **Best Use Case** | Researchers, PhDs, scientists, data analysts |
| **Layout Type** | Single column — paper format with structured data sections |
| **Header Design** | Clean academic header: Name in 26px serif bold, affiliation (title) below, contact block as a structured metadata section with labels. Like the author block of a research paper. |
| **Typography** | Headers: Roboto Slab (slab-serif). Body: 11.5px serif (Georgia or similar). Section titles: 12px bold with "§" prefix. |
| **Color Palette** | `accent: #1e3a8a` (navy), `body: #ffffff`, `text: #1f2937`, `muted: #4b5563`, `divider: #d1d5db` |
| **Section Order** | Abstract → Research Interests → Education → Appointments (experience) → Publications & Projects → Technical Skills → Certifications → Honors → Languages → References |
| **Skills Visualization** | Table-like: `| Skill | Category | Level | Years |` grid with thin borders. |
| **Experience Layout** | Structured like CV entries: Role, Institution, Location, Duration. Description as research summary. |
| **Education Layout** | Institution, Degree, Field, Year — structured rows. |
| **Project Layout** | Name with DOI-style link, role, description, methods. |
| **Certification Layout** | Name, issuer, date. |
| **Achievement Layout** | Numbered list of honors. |
| **Languages Layout** | Name and proficiency in table format. |
| **References Layout** | Available upon request (standard academic format) or listed. |
| **Special Elements** | `§` prefix on section titles (pilcrow/ section sign — unique). Table-structured skills display. Metadata-block contact section in header (like paper author affiliations). Publication-style formatting. ORCID-like placeholder for researcher ID. |
| **ATS Compatibility** | High — clean structured text. |
| **Difficulty** | Medium |

---

## Template 22 — Creative Portfolio

| Attribute | Specification |
|-----------|--------------|
| **Design Style** | Bold, visual, portfolio-centric, artistic |
| **Best Use Case** | Artists, photographers, content creators, videographers |
| **Layout Type** | Two-column — left accent strip + main content with artistic header |
| **Header Design** | Artistic: Name in extra-large variable weight (font-weight 800–900) with a colored text shadow or overlapping effect. Title as a badge or tagline. A decorative divider (zigzag or wavy) below. The header feels like a portfolio cover. |
| **Typography** | Headers: Poppins or Plus Jakarta Sans. Name: 32px black weight. Section titles: 11px bold uppercase with diamond prefix `◆`. Body: 11px system sans. |
| **Color Palette** | `accent: #7c3aed` (purple-500), `secondary: #c026d3` (pink-600), `body: #ffffff`, `text: #1f2937`, `muted: #6b7280`, `accent-light: #f5f3ff` |
| **Section Order** | About (summary) → Experience → Education → Skills → Projects → Certifications → Achievements → Languages → Interests |
| **Skills Visualization** | Creative rating with colored bars in a 2-col grid. Each bar is a colored gradient from purple to pink. |
| **Experience Layout** | Bold left border (gradient, 3px). Position large bold, company accent, duration right. Description. |
| **Education Layout** | 2-col card grid with gradient top border (4px). School bold inside, degree, year. |
| **Project Layout** | 2-col card grid with tinted purple/pink bg at 5%. Name bold, role, description, tech tags. |
| **Certification Layout** | Inline pills with purple tint. |
| **Language Layout** | 2-col: name bold, proficiency muted. |
| **Achievement Layout** | Diamond prefix `◆`, one per line. |
| **Interests Layout** | Hashtag-style: `#item #item #item` (like Instagram tags). |
| **References Layout** | 2-col grid: name, position, company. |
| **Special Elements** | Gradient left accent strip (like Creative Burst but different color). Gradient skill bars. Hashtag-style interests (unique). Card-grid education and projects with gradient top borders. Colored text shadow on name in header. Decorative zigzag or double-line divider. The most visually rich template. |
| **ATS Compatibility** | Low — heavy visual elements, best for portfolio/PDF use. |
| **Difficulty** | High |

---

## Summary Comparison

| # | Template | Layout | Cols | Header Style | ATS | Difficulty |
|---|----------|--------|------|-------------|-----|------------|
| 1 | Executive | Banner + body | 1 | Dark banner, gold accent | High | Medium |
| 2 | Modern Clean | Clean single | 1 | Left-aligned, minimal | High | Low |
| 3 | Split Vibrant | Sidebar left | 2 | In-sidebar | Medium | Medium |
| 4 | Classic Serif | Single column | 1 | Centered, editorial | Very High | Low |
| 5 | Tech Mono | Terminal window | 1 | Traffic-light dots + prompt | Medium | Medium |
| 6 | Creative Burst | Accent strip | 1 | "Hello, I'm" vignette | Low | High |
| 7 | Compact Pro | Dense single | 1 | Ultra-compact inline | High | Medium |
| 8 | Corporate Blue | Banner + avatar | 1 | Navy banner, initial circle | Medium | High |
| 9 | Minimal Edge | Whitespace focus | 1 | Massive light name | Very High | Low |
| 10 | Banner Bold | Full banner | 1 | Large red uppercase | Medium | Medium |
| 11 | Sidebar Elegance | Sidebar right | 2 | Rose sidebar, initial avatar | Medium | High |
| 12 | Gradient Flow | Gradient sidebar left | 2 | Blue gradient sidebar | Medium | Medium |
| 13 | Academic Formal | Publication | 1 | Paper title format | High | Low |
| 14 | Startup Vibe | Narrow sidebar right | 2 | Emoji-accented | Medium | Low-Med |
| 15 | Dark Elegance | Full dark | 1 | Dark banner, card body | Medium | Medium |
| 16 | Timeline Pro | Timeline | 1 | Centered, teal accent | Medium | Medium |
| 17 | Premium Slate | Slate banner | 1 | Slate banner, off-white body | High | Low-Med |
| 18 | Nature Green | Circular portrait | 1 | Large circle photo | Medium | Low-Med |
| 19 | Luxury Gold | Dark + gold | 1 | Warm dark banner, gold serif | High | Medium |
| 20 | Swiss Design | Strict CSS grid | 2 | Grid-cell header | Medium | High |
| 21 | Scientific | Paper format | 1 | Author metadata block | High | Medium |
| 22 | Creative Portfolio | Accent strip v2 | 1 | Artistic shadow text | Low | High |

### Unique Layout Category Counts

- **Single column, banner header:** 5 (Executive, Banner Bold, Dark Elegance, Premium Slate, Luxury Gold)
- **Single column, clean centered:** 5 (Modern Clean, Classic Serif, Academic Formal, Minimal Edge, Timeline Pro)
- **Single column, special header:** 3 (Tech Mono, Compact Pro, Corporate Blue)
- **Two-column, sidebar left:** 2 (Split Vibrant, Gradient Flow)
- **Two-column, sidebar right:** 2 (Sidebar Elegance, Startup Vibe)
- **Single column, accent strip:** 2 (Creative Burst, Creative Portfolio)
- **Two-column, grid-based:** 1 (Swiss Design)
- **Single column, paper format:** 1 (Scientific)
- **Single column, circular portrait:** 1 (Nature Green)

Despite the same-category overlap, each template has a distinct visual identity through different layouts, typography, color psychology, section ordering, header designs, and special elements. No two templates look alike.

---

## Next Steps

1. **Review & approve** this design specification
2. **Phase 1 implementation** — Templates 1–5 (Executive, Modern Clean, Split Vibrant, Classic Serif, Tech Mono)
3. **Phase 2** — Templates 6–10 (Creative Burst, Compact Pro, Corporate Blue, Minimal Edge, Banner Bold)
4. **Phase 3** — Templates 11–15 (Sidebar Elegance, Gradient Flow, Academic Formal, Startup Vibe, Dark Elegance)
5. **Phase 4** — Templates 16–22 (Timeline Pro, Premium Slate, Nature Green, Luxury Gold, Swiss Design, Scientific, Creative Portfolio)
6. **Testing pass** after each phase — verify all data renders, PDF matches preview
