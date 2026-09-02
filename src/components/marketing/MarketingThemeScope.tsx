"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * Wraps marketing layout children and applies data-theme attribute
 * so marketing-theme.css can scope light-mode overrides.
 */
export function MarketingThemeScope({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <div data-theme={theme} className="contents">
      {children}
    </div>
  );
}
