export const fontFamilies = {
  sans:      "Inter, var(--font-sans), 'Helvetica Neue', Arial, sans-serif",
  jakarta:   "'Plus Jakarta Sans', var(--font-jakarta), 'Inter', sans-serif",
  playfair:  "'Playfair Display', var(--font-playfair), 'Georgia', serif",
  garamond:  "'EB Garamond', var(--font-garamond), 'Times New Roman', serif",
  mono:      "'JetBrains Mono', var(--font-jetbrains), 'SF Mono', 'Consolas', monospace",
} as const;

export type FontFamily = keyof typeof fontFamilies;
