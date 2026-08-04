export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  layout: "standard" | "two-column" | "banner" | "sidebar-right" | "compact";
  suggestedFont: string;
  category: string;
  atsRating: number;
  experienceLevel: "Entry" | "Mid" | "Senior" | "Executive";
  suggestedColors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    muted: string;
    border: string;
    cardBg: string;
    sectionTitle: string;
  };
}

export const FONTS = [
  { id: "inter", name: "Inter", family: "'Inter', 'Segoe UI', sans-serif", category: "Sans-serif" },
  { id: "roboto", name: "Roboto", family: "'Roboto', 'Helvetica Neue', sans-serif", category: "Sans-serif" },
  { id: "montserrat", name: "Montserrat", family: "'Montserrat', 'Arial', sans-serif", category: "Sans-serif" },
  { id: "opensans", name: "Open Sans", family: "'Open Sans', 'Segoe UI', sans-serif", category: "Sans-serif" },
  { id: "lato", name: "Lato", family: "'Lato', 'Helvetica Neue', sans-serif", category: "Sans-serif" },
  { id: "poppins", name: "Poppins", family: "'Poppins', 'Segoe UI', sans-serif", category: "Sans-serif" },
  { id: "merriweather", name: "Merriweather", family: "'Merriweather', 'Georgia', serif", category: "Serif" },
  { id: "playfair", name: "Playfair Display", family: "'Playfair Display', 'Georgia', serif", category: "Serif" },
  { id: "garamond", name: "EB Garamond", family: "'EB Garamond', 'Georgia', serif", category: "Serif" },
  { id: "robotoslab", name: "Roboto Slab", family: "'Roboto Slab', 'Georgia', serif", category: "Serif" },
  { id: "worksans", name: "Work Sans", family: "'Work Sans', 'Helvetica Neue', sans-serif", category: "Sans-serif" },
  { id: "sfmono", name: "SF Mono", family: "'SF Mono', 'Menlo', monospace", category: "Monospace" },
  { id: "jakarta", name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', 'Segoe UI', sans-serif", category: "Sans-serif" },
  { id: "fraunces", name: "Fraunces", family: "'Fraunces', 'Georgia', serif", category: "Serif" },
];

export const COLOR_PALETTES = [
  { id: "navy", name: "Navy Professional", colors: { primary: "#1e3a8a", secondary: "#1e40af", accent: "#2563eb", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#1e3a8a" } },
  { id: "emerald", name: "Emerald Green", colors: { primary: "#047857", secondary: "#059669", accent: "#10b981", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#047857" } },
  { id: "royal", name: "Royal Purple", colors: { primary: "#7c3aed", secondary: "#6d28d9", accent: "#8b5cf6", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#7c3aed" } },
  { id: "crimson", name: "Crimson Red", colors: { primary: "#b91c1c", secondary: "#dc2626", accent: "#ef4444", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#b91c1c" } },
  { id: "ocean", name: "Ocean Blue", colors: { primary: "#0284c7", secondary: "#0ea5e9", accent: "#38bdf8", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#0284c7" } },
  { id: "sunset", name: "Sunset Orange", colors: { primary: "#ea580c", secondary: "#f97316", accent: "#fb923c", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#ea580c" } },
  { id: "slate", name: "Slate Dark", colors: { primary: "#1e293b", secondary: "#334155", accent: "#475569", bg: "#ffffff", text: "#0f172a", muted: "#475569", border: "#cbd5e1", cardBg: "#f1f5f9", sectionTitle: "#1e293b" } },
  { id: "rose", name: "Rose Pink", colors: { primary: "#be123c", secondary: "#e11d48", accent: "#fb7185", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#be123c" } },
  { id: "teal", name: "Teal Modern", colors: { primary: "#0d9488", secondary: "#14b8a6", accent: "#2dd4bf", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#0d9488" } },
  { id: "amber", name: "Amber Warm", colors: { primary: "#b45309", secondary: "#d97706", accent: "#f59e0b", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#b45309" } },
  { id: "indigo", name: "Indigo Depth", colors: { primary: "#4338ca", secondary: "#4f46e5", accent: "#6366f1", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#4338ca" } },
  { id: "lime", name: "Lime Fresh", colors: { primary: "#4d7c0f", secondary: "#65a30d", accent: "#84cc16", bg: "#ffffff", text: "#1f2937", muted: "#4b5563", border: "#d1d5db", cardBg: "#f8fafc", sectionTitle: "#4d7c0f" } },
];

export const TEMPLATES: ResumeTemplate[] = [
  { id: "executive", name: "Executive", description: "Bold dark banner header with serif elegance. Perfect for C-suite and senior leadership.", preview: "👔", layout: "banner", suggestedFont: "merriweather", category: "Product Manager", atsRating: 92, experienceLevel: "Executive", suggestedColors: COLOR_PALETTES[0].colors },
  { id: "modern-clean", name: "Modern Clean", description: "Sleek single-column layout with generous whitespace. Ideal for tech and creative roles.", preview: "✨", layout: "standard", suggestedFont: "inter", category: "Software Engineer", atsRating: 88, experienceLevel: "Mid", suggestedColors: COLOR_PALETTES[6].colors },
  { id: "split-vibrant", name: "Split Vibrant", description: "Two-column layout with a colorful sidebar for personal brand showcase.", preview: "🎨", layout: "two-column", suggestedFont: "jakarta", category: "Designer", atsRating: 85, experienceLevel: "Mid", suggestedColors: COLOR_PALETTES[4].colors },
  { id: "classic-serif", name: "Classic Serif", description: "Traditional serif design with timeless appeal. Great for law, finance, and academia.", preview: "📜", layout: "standard", suggestedFont: "playfair", category: "Product Manager", atsRating: 90, experienceLevel: "Senior", suggestedColors: COLOR_PALETTES[0].colors },
  { id: "tech-mono", name: "Tech Mono", description: "Monospace font with a sharp, engineering-focused aesthetic.", preview: "💻", layout: "standard", suggestedFont: "sfmono", category: "Software Engineer", atsRating: 84, experienceLevel: "Mid", suggestedColors: COLOR_PALETTES[1].colors },
  { id: "creative-burst", name: "Creative Burst", description: "Left accent strip with personality and visual flair for designers.", preview: "🌈", layout: "sidebar-right", suggestedFont: "jakarta", category: "Designer", atsRating: 82, experienceLevel: "Entry", suggestedColors: COLOR_PALETTES[2].colors },
  { id: "compact-pro", name: "Compact Pro", description: "Dense, information-rich layout fitting maximum content per page.", preview: "📋", layout: "compact", suggestedFont: "roboto", category: "DevOps", atsRating: 86, experienceLevel: "Senior", suggestedColors: COLOR_PALETTES[6].colors },
  { id: "corporate-blue", name: "Corporate Blue", description: "Trustworthy blue-toned design standard across consulting and finance.", preview: "🏢", layout: "standard", suggestedFont: "montserrat", category: "Product Manager", atsRating: 93, experienceLevel: "Senior", suggestedColors: COLOR_PALETTES[0].colors },
  { id: "minimal-edge", name: "Minimal Edge", description: "Ultra-clean layout with thin borders and subtle elegance.", preview: "◻️", layout: "standard", suggestedFont: "worksans", category: "Software Engineer", atsRating: 87, experienceLevel: "Entry", suggestedColors: COLOR_PALETTES[6].colors },
  { id: "banner-bold", name: "Banner Bold", description: "Full-width color banner header commanding immediate attention.", preview: "🚩", layout: "banner", suggestedFont: "montserrat", category: "Fresher", atsRating: 80, experienceLevel: "Entry", suggestedColors: COLOR_PALETTES[3].colors },
  { id: "sidebar-elegance", name: "Sidebar Elegance", description: "Right-side info panel with refined typography and balanced composition.", preview: "🎭", layout: "sidebar-right", suggestedFont: "lato", category: "Designer", atsRating: 83, experienceLevel: "Mid", suggestedColors: COLOR_PALETTES[7].colors },
  { id: "gradient-flow", name: "Gradient Flow", description: "Modern gradient accents for a contemporary, forward-looking feel.", preview: "🌊", layout: "two-column", suggestedFont: "jakarta", category: "AI/ML Engineer", atsRating: 89, experienceLevel: "Mid", suggestedColors: COLOR_PALETTES[4].colors },
  { id: "academic-formal", name: "Academic Formal", description: "Formal serif layout with publication-ready formatting for researchers.", preview: "🎓", layout: "standard", suggestedFont: "garamond", category: "Data Scientist", atsRating: 91, experienceLevel: "Senior", suggestedColors: COLOR_PALETTES[0].colors },
  { id: "startup-vibe", name: "Startup Vibe", description: "Energetic, modern design with fresh colors for startup roles.", preview: "🚀", layout: "two-column", suggestedFont: "poppins", category: "Fresher", atsRating: 86, experienceLevel: "Entry", suggestedColors: COLOR_PALETTES[1].colors },
  { id: "dark-elegance", name: "Dark Elegance", description: "Dark-themed resume that stands out. Bold and memorable.", preview: "🌙", layout: "banner", suggestedFont: "inter", category: "Cybersecurity", atsRating: 81, experienceLevel: "Senior", suggestedColors: { primary: "#111827", secondary: "#1f2937", accent: "#374151", bg: "#ffffff", text: "#111827", muted: "#6b7280", border: "#e5e7eb", cardBg: "#f9fafb", sectionTitle: "#111827" } },
  { id: "timeline-pro", name: "Timeline Pro", description: "Chronological timeline layout emphasizing career progression visually.", preview: "📅", layout: "standard", suggestedFont: "lato", category: "Software Engineer", atsRating: 85, experienceLevel: "Mid", suggestedColors: COLOR_PALETTES[8].colors },
  { id: "premium-slate", name: "Premium Slate", description: "Sophisticated slate-gray palette for a refined, understated look.", preview: "💎", layout: "standard", suggestedFont: "worksans", category: "Product Manager", atsRating: 90, experienceLevel: "Senior", suggestedColors: COLOR_PALETTES[6].colors },
  { id: "nature-green", name: "Nature Green", description: "Earthy green tones conveying growth, stability, and environmental focus.", preview: "🌿", layout: "two-column", suggestedFont: "robotoslab", category: "Data Scientist", atsRating: 86, experienceLevel: "Mid", suggestedColors: COLOR_PALETTES[1].colors },
  { id: "luxury-gold", name: "Luxury Gold", description: "Warm amber and gold accents for a premium, high-end presentation.", preview: "⭐", layout: "banner", suggestedFont: "fraunces", category: "Product Manager", atsRating: 88, experienceLevel: "Executive", suggestedColors: COLOR_PALETTES[9].colors },
  { id: "swiss-design", name: "Swiss Design", description: "Grid-based layout inspired by classic Swiss typography and precision.", preview: "📐", layout: "compact", suggestedFont: "inter", category: "DevOps", atsRating: 87, experienceLevel: "Senior", suggestedColors: COLOR_PALETTES[10].colors },
  { id: "scientific", name: "Scientific", description: "Clean, citation-ready layout ideal for research scientists and PhDs.", preview: "🔬", layout: "standard", suggestedFont: "robotoslab", category: "Data Scientist", atsRating: 94, experienceLevel: "Senior", suggestedColors: COLOR_PALETTES[0].colors },
  { id: "creative-portfolio", name: "Creative Portfolio", description: "Bold, visually-driven layout for designers, artists, and content creators.", preview: "🖌️", layout: "sidebar-right", suggestedFont: "poppins", category: "Designer", atsRating: 79, experienceLevel: "Entry", suggestedColors: COLOR_PALETTES[2].colors },
];

export function getTemplateColors(templateId: string, paletteId?: string) {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (paletteId) {
    const palette = COLOR_PALETTES.find(p => p.id === paletteId);
    if (palette) return palette.colors;
  }
  return template?.suggestedColors || COLOR_PALETTES[0].colors;
}
