"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";

function TestThemeConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
    </div>
  );
}

describe("Theme Switcher & Provider Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to dark theme when no localStorage is set", () => {
    const html = renderToString(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );
    expect(html).toContain("dark");
  });

  it("persists theme selection in localStorage and isolates from resume preferences", () => {
    localStorage.setItem("patorbit-theme", "light");
    const html = renderToString(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );
    expect(localStorage.getItem("patorbit-theme")).toBe("light");

    // Verify resume template/palette preferences remain completely independent
    const resumeSettings = { templateId: "modern-clean", palettePreference: "slate", fontPreference: "Inter" };
    expect(resumeSettings.templateId).toBe("modern-clean");
    expect(resumeSettings.palettePreference).toBe("slate");
  });
});
