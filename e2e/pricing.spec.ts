import { test, expect } from "@playwright/test";

const card = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("heading", { name, exact: true }).locator("..");

test.describe("Pricing page responsive QA", () => {
  test("prices render with currency symbol and correct values", async ({ page }) => {
    await page.goto("/pricing");

    const pro = card(page, "Professional");
    const starter = card(page, "Starter");
    const ent = card(page, "Enterprise");

    // Professional defaults to yearly billing => ₹119
    await expect(pro).toContainText("₹119");
    // Starter is free
    await expect(starter).toContainText("₹0");
    // Enterprise is custom
    await expect(ent).toContainText("Custom");

    // Switch to Monthly => Professional shows ₹149 (not bare "149")
    await page.getByRole("radio", { name: "Monthly" }).click();
    await expect(pro).toContainText("₹149");
  });

  test("comparison table scrolls on 320px without page overflow or clipped columns", async ({ page }) => {
    await page.goto("/pricing");

    const wrap = page.locator("table").locator("..");
    const scrollable = await wrap.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrollable).toBe(true);

    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(pageOverflow).toBe(false);

    // scroll to the far right and confirm the last column is fully within the viewport
    await wrap.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    const lastColInViewport = await page.locator("thead th").last().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= window.innerWidth;
    });
    expect(lastColInViewport).toBe(true);
  });

  test("FAQ accordion opens without clipping its answer on a 320px screen", async ({ page }) => {
    await page.goto("/pricing");

    const btn = page.getByRole("button", { name: /Professional Passport/ });
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");

    await expect(async () => {
      const clipped = await page.evaluate(() => {
        const openBtn = document.querySelector('button[aria-expanded="true"]');
        const panel = document.getElementById(openBtn!.getAttribute("aria-controls")!);
        const p = panel!.querySelector("p")!;
        return p.getBoundingClientRect().bottom > panel!.getBoundingClientRect().bottom + 1;
      });
      expect(clipped).toBe(false);
    }).toPass({ timeout: 2000 });
  });

  test("billing toggle is keyboard accessible with ARIA radio semantics", async ({ page }) => {
    await page.goto("/pricing");

    const group = page.getByRole("radiogroup", { name: "Billing period" });
    await expect(group).toBeVisible();

    const monthly = page.getByRole("radio", { name: "Monthly" });
    const yearly = page.getByRole("radio", { name: /Yearly/ });

    // Default: yearly active
    await expect(yearly).toHaveAttribute("aria-checked", "true");
    await expect(monthly).toHaveAttribute("aria-checked", "false");

    // Roving tabindex: only the active option is in the tab order
    await expect(yearly).toHaveAttribute("tabindex", "0");
    await expect(monthly).toHaveAttribute("tabindex", "-1");

    // Arrow keys move selection and focus
    await yearly.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(monthly).toHaveAttribute("aria-checked", "true");
    await expect(monthly).toBeFocused();
    await expect(yearly).toHaveAttribute("tabindex", "-1");
    await expect(monthly).toHaveAttribute("tabindex", "0");

    await page.keyboard.press("ArrowRight");
    await expect(yearly).toHaveAttribute("aria-checked", "true");
    await expect(yearly).toBeFocused();
  });

  test("all interactive elements reveal a visible focus ring when keyboard-navigated", async ({ page }) => {
    await page.goto("/pricing");
    await page.locator("body").click();

    const seen: { text: string; boxShadow: string; outlineStyle: string; outlineWidth: string }[] = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const interactive = el.tagName === "BUTTON" || (el.tagName === "A" && el.hasAttribute("href"));
        if (!interactive) return null;
        const cs = getComputedStyle(el);
        return {
          text: (el.textContent || "").trim().slice(0, 14),
          boxShadow: cs.boxShadow,
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
        };
      });
      if (info && !seen.some((s) => s.text === info.text)) seen.push(info);
    }

    expect(seen.length).toBeGreaterThan(0);
    for (const s of seen) {
      const hasRing =
        s.boxShadow !== "none" ||
        (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0);
      expect(hasRing, `focus ring missing on "${s.text}"`).toBe(true);
    }
  });
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("FAQ opens instantly and remains fully visible", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByRole("button", { name: /Professional Passport/ }).click();
    await expect(page.locator("#faq-panel-1")).toBeVisible();

    await expect(async () => {
      const clipped = await page.evaluate(() => {
        const panel = document.getElementById("faq-panel-1")!;
        const p = panel.querySelector("p")!;
        return p.getBoundingClientRect().bottom > panel.getBoundingClientRect().bottom + 1;
      });
      expect(clipped).toBe(false);
    }).toPass({ timeout: 2000 });
  });
});
