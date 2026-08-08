export const fontFamilies = {
  sans:      "var(--font-sans), 'Helvetica Neue', Arial, sans-serif",
  jakarta:   "var(--font-jakarta), 'Inter', sans-serif",
  playfair:  "var(--font-playfair), 'Georgia', serif",
  garamond:  "var(--font-garamond), 'Times New Roman', serif",
  mono:      "var(--font-jetbrains), 'SF Mono', 'Consolas', monospace",
} as const;

export type FontFamily = keyof typeof fontFamilies;
