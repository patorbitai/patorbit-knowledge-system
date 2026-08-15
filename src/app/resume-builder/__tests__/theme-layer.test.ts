import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("light-theme CSS layer (Resume Builder chrome)", () => {
  it("wires Tailwind's dark: variant to the manual .dark class", () => {
    expect(css).toContain("@custom-variant dark");
  });

  it("covers the Builder/Preview page background (#070d18) and its opacity variants", () => {
    expect(css).toContain(".light .bg-\\[\\#070d18\\]");
    expect(css).toContain(".light .bg-\\[\\#070d18\\]\\/90");
    expect(css).toContain(".light .bg-\\[\\#070d18\\]\\/95");
    expect(css).toContain(".light .bg-\\[\\#0A0E1B\\]\\/95");
  });

  it("remaps the chrome's hex text colors so text stays readable on light surfaces", () => {
    expect(css).toContain(".light .text-\\[\\#f8fafc\\]");
    expect(css).toContain(".light .text-\\[\\#94a3b8\\]");
    expect(css).toContain(".light .text-\\[\\#cbd5e1\\]");
    expect(css).toContain(".light .text-slate-100");
  });

  it("covers white-alpha surfaces, borders, and header borders (incl. hover variants)", () => {
    expect(css).toContain('[class*="bg-white/[0.0"]');
    expect(css).toContain('[class*="bg-white/[0.1"]');
    expect(css).toContain('[class*="border-white/[0."]');
    expect(css).toContain('[class*="border-[rgba(148,163,184"]');
  });

  it("protects the resume sheet from the app theme (req: resume unchanged)", () => {
    // The sheet is always wrapped in [data-rs-scope]; the template's own
    // class-based colors must win over the light overrides.
    expect(css).toContain("html.light [data-rs-scope] .text-white");
    expect(css).toContain("html.light [data-rs-scope] .text-slate-400");
  });
});
