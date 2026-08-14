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
  recommendedFor?: string;
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
  {
    id: "executive",
    name: "Patorbit Executive",
    description: "Sophisticated corporate layout with dark navy banner, warm champagne gold accents, and authoritative serif typography. Perfect for executives, directors, and corporate leaders.",
    preview: "🏛️",
    layout: "banner",
    suggestedFont: "garamond",
    category: "Executive",
    atsRating: 97,
    experienceLevel: "Executive",
    recommendedFor: "Managers, Directors & C-Suite",
    suggestedColors: {
      primary: "#0f172a",
      secondary: "#1e3a8a",
      accent: "#c9b068",
      bg: "#ffffff",
      text: "#1f2937",
      muted: "#6b7280",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#0f172a"
    }
  },
  {
    id: "patorbit-modern",
    name: "Patorbit Modern",
    description: "Flagship modern technology resume featuring an asymmetric two-column structure, vibrant cyan accents, timeline milestones, and clean skill tags. Engineered for software, AI, and data leaders.",
    preview: "⚡",
    layout: "two-column",
    suggestedFont: "jakarta",
    category: "Software Engineer",
    atsRating: 98,
    experienceLevel: "Senior",
    recommendedFor: "Software, AI & Tech Professionals",
    suggestedColors: {
      primary: "#0f172a",
      secondary: "#0ea5e9",
      accent: "#2563eb",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#eff6ff",
      sectionTitle: "#2563eb"
    }
  },
  {
    id: "minimal-ats",
    name: "Patorbit ATS",
    description: "The ultimate ATS-optimized resume. Strictly monochrome, zero decorative graphics, predictable single-column section order, and rigorous hierarchy designed to pass any applicant tracking system effortlessly.",
    preview: "📄",
    layout: "standard",
    suggestedFont: "jakarta",
    category: "ATS Optimized",
    atsRating: 99,
    experienceLevel: "Mid",
    recommendedFor: "Strict ATS Applications & Enterprise Hiring",
    suggestedColors: {
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#64748b",
      bg: "#ffffff",
      text: "#1e293b",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#64748b"
    }
  },
  {
    id: "modern-clean",
    name: "Modern Clean",
    description: "Sleek technology aesthetic with clean grid structure, elegant skill tags, modern headers, and high ATS-readable typography.",
    preview: "✨",
    layout: "standard",
    suggestedFont: "inter",
    category: "Software Engineer",
    atsRating: 98,
    experienceLevel: "Mid",
    recommendedFor: "Tech & Product Roles",
    suggestedColors: {
      primary: "#0f172a",
      secondary: "#0ea5e9",
      accent: "#0ea5e9",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#0f172a"
    }
  },
  {
    id: "executive-pro",
    name: "Executive Pro",
    description: "Premium dark-sidebar layout with warm gold accents and EB Garamond elegance for senior leadership.",
    preview: "🏛️",
    layout: "sidebar-right",
    suggestedFont: "garamond",
    category: "Executive",
    atsRating: 97,
    experienceLevel: "Executive",
    recommendedFor: "Managers & Directors",
    suggestedColors: {
      primary: "#1a1f2e",
      secondary: "#c9a84c",
      accent: "#c9a84c",
      bg: "#ffffff",
      text: "#0f1520",
      muted: "#5a6478",
      border: "#dde1ea",
      cardBg: "#f7f8fb",
      sectionTitle: "#5a6478"
    }
  },
  {
    id: "engineering-clean",
    name: "Engineering Clean",
    description: "Built for software, AI, cloud and data engineers targeting top tech companies with strong emphasis on technical stack.",
    preview: "⚙️",
    layout: "standard",
    suggestedFont: "jakarta",
    category: "Software Engineer",
    atsRating: 98,
    experienceLevel: "Senior",
    recommendedFor: "Software & AI Engineers",
    suggestedColors: {
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#64748b",
      bg: "#ffffff",
      text: "#1e293b",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f1f5f9",
      sectionTitle: "#64748b"
    }
  },
  {
    id: "consulting-elite",
    name: "Consulting Elite",
    description: "Premium single-column template designed for McKinsey, BCG, Bain, and Big 4 management consulting roles.",
    preview: "📊",
    layout: "standard",
    suggestedFont: "jakarta",
    category: "Consulting",
    atsRating: 98,
    experienceLevel: "Senior",
    recommendedFor: "Consultants & Strategy Managers",
    suggestedColors: {
      primary: "#0d1b2a",
      secondary: "#1e293b",
      accent: "#1d4ed8",
      bg: "#ffffff",
      text: "#1e293b",
      muted: "#52637a",
      border: "#dde3ea",
      cardBg: "#f8fafc",
      sectionTitle: "#1e3a5f"
    }
  },
  {
    id: "product-manager",
    name: "Product Manager",
    description: "Premium PM template highlighting product ownership, KPIs, team leadership, and product launches.",
    preview: "📦",
    layout: "standard",
    suggestedFont: "jakarta",
    category: "Product Manager",
    atsRating: 98,
    experienceLevel: "Senior",
    recommendedFor: "Product & Program Managers",
    suggestedColors: {
      primary: "#0d1b2a",
      secondary: "#1e293b",
      accent: "#1d4ed8",
      bg: "#ffffff",
      text: "#1e293b",
      muted: "#52637a",
      border: "#dde3ea",
      cardBg: "#f0f4ff",
      sectionTitle: "#1d4ed8"
    }
  },
  {
    id: "creative-professional",
    name: "Creative Professional",
    description: "Elegant single-column template for designers, brand creators, product designers, and marketing professionals.",
    preview: "🎨",
    layout: "standard",
    suggestedFont: "jakarta",
    category: "Designer",
    atsRating: 95,
    experienceLevel: "Mid",
    recommendedFor: "Designers & Creatives",
    suggestedColors: {
      primary: "#111827",
      secondary: "#1f2937",
      accent: "#7c3aed",
      bg: "#ffffff",
      text: "#1f2937",
      muted: "#6b7280",
      border: "#e5e7eb",
      cardBg: "#ede9fe",
      sectionTitle: "#7c3aed"
    }
  },
  {
    id: "academic-cv",
    name: "Academic CV",
    description: "Scholarly multi-page CV for professors, researchers, and PhD candidates with detailed publication sections.",
    preview: "🎓",
    layout: "standard",
    suggestedFont: "garamond",
    category: "Academic",
    atsRating: 98,
    experienceLevel: "Senior",
    recommendedFor: "Researchers & Faculty",
    suggestedColors: {
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#1e3a5f",
      bg: "#ffffff",
      text: "#1e293b",
      muted: "#475569",
      border: "#cbd5e1",
      cardBg: "#f8fafc",
      sectionTitle: "#1e3a5f"
    }
  },
  {
    id: "classic-serif",
    name: "Classic Serif",
    description: "Traditional serif design with timeless appeal. Ideal for legal, finance, government, and academia.",
    preview: "📜",
    layout: "standard",
    suggestedFont: "playfair",
    category: "Professional",
    atsRating: 90,
    experienceLevel: "Senior",
    recommendedFor: "Legal & Finance Professionals",
    suggestedColors: COLOR_PALETTES[0].colors
  },
  {
    id: "tech-mono",
    name: "Tech Mono",
    description: "Monospace accents with a sharp, code-native engineering aesthetic for developers and hackers.",
    preview: "💻",
    layout: "standard",
    suggestedFont: "sfmono",
    category: "Software Engineer",
    atsRating: 88,
    experienceLevel: "Mid",
    recommendedFor: "Backend & Systems Engineers",
    suggestedColors: COLOR_PALETTES[1].colors
  },
  {
    id: "creative-burst",
    name: "Creative Burst",
    description: "Left accent strip with vibrant personality and visual flair for creative portfolios.",
    preview: "🌈",
    layout: "sidebar-right",
    suggestedFont: "jakarta",
    category: "Designer",
    atsRating: 84,
    experienceLevel: "Entry",
    recommendedFor: "Visual Designers & Artists",
    suggestedColors: COLOR_PALETTES[2].colors
  },
  {
    id: "compact-pro",
    name: "Compact Pro",
    description: "Dense, information-rich layout fitting maximum experience and technical depth in a compact frame.",
    preview: "📋",
    layout: "compact",
    suggestedFont: "roboto",
    category: "DevOps",
    atsRating: 89,
    experienceLevel: "Senior",
    recommendedFor: "Senior Engineers & Specialists",
    suggestedColors: COLOR_PALETTES[6].colors
  },
  {
    id: "corporate-blue",
    name: "Corporate Blue",
    description: "Trustworthy navy-blue toned design standard across global corporate and advisory sectors.",
    preview: "🏢",
    layout: "standard",
    suggestedFont: "montserrat",
    category: "Professional",
    atsRating: 94,
    experienceLevel: "Senior",
    recommendedFor: "Corporate Managers & Analysts",
    suggestedColors: COLOR_PALETTES[0].colors
  },
  {
    id: "minimal-edge",
    name: "Minimal Edge",
    description: "Ultra-clean layout with refined geometric lines and minimalist aesthetic.",
    preview: "◻️",
    layout: "standard",
    suggestedFont: "worksans",
    category: "ATS Optimized",
    atsRating: 92,
    experienceLevel: "Entry",
    recommendedFor: "Early Career & Career Changers",
    suggestedColors: COLOR_PALETTES[6].colors
  },
  {
    id: "banner-bold",
    name: "Banner Bold",
    description: "Full-width crimson banner header commanding immediate attention and executive poise.",
    preview: "🚩",
    layout: "banner",
    suggestedFont: "montserrat",
    category: "Creative",
    atsRating: 82,
    experienceLevel: "Entry",
    recommendedFor: "Brand & Marketing Specialists",
    suggestedColors: COLOR_PALETTES[3].colors
  },
  {
    id: "sidebar-elegance",
    name: "Sidebar Elegance",
    description: "Refined right-side panel with balanced composition and clean typographic hierarchy.",
    preview: "🎭",
    layout: "sidebar-right",
    suggestedFont: "lato",
    category: "Designer",
    atsRating: 86,
    experienceLevel: "Mid",
    recommendedFor: "Product Designers & UI/UX",
    suggestedColors: COLOR_PALETTES[7].colors
  },
  {
    id: "gradient-flow",
    name: "Gradient Flow",
    description: "Modern gradient accents for a contemporary, forward-looking tech resume.",
    preview: "🌊",
    layout: "two-column",
    suggestedFont: "jakarta",
    category: "Software Engineer",
    atsRating: 91,
    experienceLevel: "Mid",
    recommendedFor: "AI/ML & Frontend Developers",
    suggestedColors: COLOR_PALETTES[4].colors
  },
  {
    id: "academic-formal",
    name: "Academic Formal",
    description: "Formal serif layout with publication-ready formatting for scholars and researchers.",
    preview: "🎓",
    layout: "standard",
    suggestedFont: "garamond",
    category: "Academic",
    atsRating: 93,
    experienceLevel: "Senior",
    recommendedFor: "Academics & Researchers",
    suggestedColors: COLOR_PALETTES[0].colors
  },
  {
    id: "startup-vibe",
    name: "Startup Vibe",
    description: "Energetic, modern two-column design with fresh colors tailored for high-growth tech startups.",
    preview: "🚀",
    layout: "two-column",
    suggestedFont: "poppins",
    category: "Creative",
    atsRating: 88,
    experienceLevel: "Entry",
    recommendedFor: "Startup Early Hires & Growth",
    suggestedColors: COLOR_PALETTES[1].colors
  },
  {
    id: "dark-elegance",
    name: "Dark Elegance",
    description: "Sophisticated dark header theme that stands out with bold contrast and memorable presence.",
    preview: "🌙",
    layout: "banner",
    suggestedFont: "inter",
    category: "Professional",
    atsRating: 85,
    experienceLevel: "Senior",
    recommendedFor: "Cybersecurity & Security Architects",
    suggestedColors: {
      primary: "#111827",
      secondary: "#1f2937",
      accent: "#374151",
      bg: "#ffffff",
      text: "#111827",
      muted: "#6b7280",
      border: "#e5e7eb",
      cardBg: "#f9fafb",
      sectionTitle: "#111827"
    }
  },
  {
    id: "timeline-pro",
    name: "Timeline Pro",
    description: "Chronological timeline layout emphasizing progressive career trajectory and continuous growth.",
    preview: "📅",
    layout: "standard",
    suggestedFont: "lato",
    category: "Software Engineer",
    atsRating: 87,
    experienceLevel: "Mid",
    recommendedFor: "Mid-to-Senior Engineers",
    suggestedColors: COLOR_PALETTES[8].colors
  },
  {
    id: "premium-slate",
    name: "Premium Slate",
    description: "Understated slate-gray palette for a refined, calm, and highly polished corporate look.",
    preview: "💎",
    layout: "standard",
    suggestedFont: "worksans",
    category: "Professional",
    atsRating: 92,
    experienceLevel: "Senior",
    recommendedFor: "Corporate Advisors & PMs",
    suggestedColors: COLOR_PALETTES[6].colors
  },
  {
    id: "nature-green",
    name: "Nature Green",
    description: "Earthy emerald and sage tones conveying stability, growth, and clean structure.",
    preview: "🌿",
    layout: "two-column",
    suggestedFont: "robotoslab",
    category: "Creative",
    atsRating: 88,
    experienceLevel: "Mid",
    recommendedFor: "Sustainability & Biotech Leaders",
    suggestedColors: COLOR_PALETTES[1].colors
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    description: "Warm amber and champagne gold accents for a top-tier executive presentation.",
    preview: "⭐",
    layout: "banner",
    suggestedFont: "fraunces",
    category: "Executive",
    atsRating: 90,
    experienceLevel: "Executive",
    recommendedFor: "Executive Leadership & Board Members",
    suggestedColors: COLOR_PALETTES[9].colors
  },
  {
    id: "swiss-design",
    name: "Swiss Design",
    description: "Grid-based layout inspired by classic Swiss international typography and mathematical balance.",
    preview: "📐",
    layout: "compact",
    suggestedFont: "inter",
    category: "Modern",
    atsRating: 90,
    experienceLevel: "Senior",
    recommendedFor: "Architects & Systems Engineers",
    suggestedColors: COLOR_PALETTES[10].colors
  },
  {
    id: "scientific",
    name: "Scientific",
    description: "Clean, citation-ready layout ideal for research scientists, laboratory directors, and PhDs.",
    preview: "🔬",
    layout: "standard",
    suggestedFont: "robotoslab",
    category: "Academic",
    atsRating: 95,
    experienceLevel: "Senior",
    recommendedFor: "Scientists & Researchers",
    suggestedColors: COLOR_PALETTES[0].colors
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    description: "Bold, visually-driven layout for designers, creative directors, and multidisciplinary artists.",
    preview: "🖌️",
    layout: "sidebar-right",
    suggestedFont: "poppins",
    category: "Designer",
    atsRating: 82,
    experienceLevel: "Entry",
    recommendedFor: "Artists & Creative Directors",
    suggestedColors: COLOR_PALETTES[2].colors
  },
];

export function getTemplateColors(templateId: string, paletteId?: string) {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (paletteId) {
    const palette = COLOR_PALETTES.find(p => p.id === paletteId);
    if (palette) return palette.colors;
  }
  return template?.suggestedColors || COLOR_PALETTES[0].colors;
}
