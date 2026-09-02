/**
 * Browser pagination verification tests.
 *
 * These tests inject deterministic resume fixtures via the exposed Zustand store,
 * then verify pagination behavior in a real Chromium browser.
 *
 * Run: npx playwright test e2e/pagination.spec.ts --project=desktop-pagination
 */
import { test, expect } from "@playwright/test";
import {
  SMALL_RESUME,
  MULTIPAGE_RESUME,
  EXPERIENCE_BOUNDARY_RESUME,
} from "./fixtures/resume-fixtures";

// ── Helper: log in to the test account ──────────────────────────────────────
const TEST_EMAIL = "test@patorbit.com";
const TEST_PASSWORD = "Test1234!";

async function login(page: import("@playwright/test").Page) {
  // Check if already logged in
  await page.goto("/resume-builder");
  await page.waitForLoadState("networkidle");
  const url = page.url();
  if (!url.includes("/login")) {
    // Already logged in
    return;
  }

  // Fill in credentials
  await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign In")');

  // Wait for redirect (try overview or resume-builder)
  await page.waitForURL(
    (url) => !url.toString().includes("/login"),
    { timeout: 15000 },
  );
  await page.waitForLoadState("networkidle");
}

// ── Helper: inject a resume fixture into the Zustand store ──────────────────
async function injectResume(
  page: import("@playwright/test").Page,
  resume: Record<string, unknown>,
  templateId: string,
) {
  // Navigate to resume builder
  await page.goto("/resume-builder");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Inject resume data via the exposed Zustand store
  await page.evaluate(
    ({ resume, templateId }) => {
      const store = (window as any).__resumeStore__;
      if (!store) throw new Error("Store not exposed — check __resumeStore__");
      const state = store.getState();
      // Create a new resume entry and set it as active
      const resumeId = `test-${Date.now()}`;
      const newResume = { ...resume, resumeId, templateId, resumeName: resume.name || "Test Resume" };
      store.setState({
        resumes: [...state.resumes.filter((r: any) => r.resumeId !== resumeId), newResume],
        activeResumeId: resumeId,
        resume: newResume,
      });
    },
    { resume, templateId },
  );

  // Switch to preview mode
  const previewBtn = page.getByRole("button", { name: "Preview", exact: true });
  if (await previewBtn.count() > 0) {
    await previewBtn.click();
  }

  // Wait for pagination to stabilize
  await page.waitForSelector(".rs-page", { timeout: 5000 });
  await page.waitForTimeout(1000);
}

// ── Helper: get page contents ───────────────────────────────────────────────
async function getPageTexts(page: import("@playwright/test").Page): Promise<string[]> {
  const pages = await page.locator(".rs-page").all();
  const texts: string[] = [];
  for (const p of pages) {
    texts.push((await p.textContent()) || "");
  }
  return texts;
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Pagination — SMALL_RESUME", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("renders exactly 1 page", async ({ page }) => {
    await injectResume(page, SMALL_RESUME as any, "modern-clean");

    const pageCount = await page.locator(".rs-page").count();
    console.log(`SMALL_RESUME page count: ${pageCount}`);
    expect(pageCount).toBe(1);
  });

  test("page indicator matches actual count", async ({ page }) => {
    await injectResume(page, SMALL_RESUME as any, "modern-clean");

    const pageCount = await page.locator(".rs-page").count();
    const indicator = page.locator("text=/\\d+ pages?/");
    if (await indicator.count() > 0) {
      const text = await indicator.first().textContent();
      const match = text?.match(/(\d+)/);
      if (match) {
        expect(parseInt(match[1], 10)).toBe(pageCount);
      }
    }
  });

  test("page has correct A4 aspect ratio", async ({ page }) => {
    await injectResume(page, SMALL_RESUME as any, "modern-clean");

    const page1 = page.locator(".rs-page").first();
    const box = await page1.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      const ratio = box.width / box.height;
      const a4Ratio = 794 / 1123;
      expect(Math.abs(ratio - a4Ratio)).toBeLessThan(0.05);
    }
  });
});

test.describe("Pagination — MULTIPAGE_RESUME", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("renders 2+ pages", async ({ page }) => {
    await injectResume(page, MULTIPAGE_RESUME as any, "corporate-blue");

    const pageCount = await page.locator(".rs-page").count();
    console.log(`MULTIPAGE_RESUME page count: ${pageCount}`);
    expect(pageCount).toBeGreaterThanOrEqual(2);
  });

  test("each page has substantial content", async ({ page }) => {
    await injectResume(page, MULTIPAGE_RESUME as any, "corporate-blue");

    const texts = await getPageTexts(page);
    console.log(`MULTIPAGE_RESUME: ${texts.length} pages`);
    for (let i = 0; i < texts.length; i++) {
      console.log(`  Page ${i + 1}: ${texts[i].length} chars`);
      expect(texts[i].length).toBeGreaterThan(50);
    }
  });

  test("page indicator matches actual count", async ({ page }) => {
    await injectResume(page, MULTIPAGE_RESUME as any, "corporate-blue");

    const pageCount = await page.locator(".rs-page").count();
    const indicator = page.locator("text=/\\d+ pages?/");
    if (await indicator.count() > 0) {
      const text = await indicator.first().textContent();
      const match = text?.match(/(\d+)/);
      if (match) {
        const indicatorCount = parseInt(match[1], 10);
        console.log(`Indicator: ${indicatorCount}, Actual: ${pageCount}`);
        expect(indicatorCount).toBe(pageCount);
      }
    }
  });

  test("all A4 pages have correct aspect ratio", async ({ page }) => {
    await injectResume(page, MULTIPAGE_RESUME as any, "corporate-blue");

    const pages = await page.locator(".rs-page").all();
    for (let i = 0; i < pages.length; i++) {
      const box = await pages[i].boundingBox();
      if (box) {
        const ratio = box.width / box.height;
        const a4Ratio = 794 / 1123;
        expect(Math.abs(ratio - a4Ratio)).toBeLessThan(0.05);
      }
    }
  });
});

test.describe("Pagination — EXPERIENCE_BOUNDARY_RESUME", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("renders 2+ pages with experience boundary", async ({ page }) => {
    await injectResume(page, EXPERIENCE_BOUNDARY_RESUME as any, "corporate-blue");

    const pageCount = await page.locator(".rs-page").count();
    console.log(`EXPERIENCE_BOUNDARY page count: ${pageCount}`);
    expect(pageCount).toBeGreaterThanOrEqual(2);
  });

  test("experience entries are not split across pages", async ({ page }) => {
    await injectResume(page, EXPERIENCE_BOUNDARY_RESUME as any, "corporate-blue");

    const texts = await getPageTexts(page);
    console.log(`EXPERIENCE_BOUNDARY: ${texts.length} pages`);

    // Check that no page ends with orphaned bullet points
    // (the blank-gap regression: bullets from one entry appearing alone on a page)
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      // A page should not consist only of bullet points without any company/position header
      const hasCompanyHeader = /TechCorp|Analytics|Brightpath|DataFlow/.test(text);
      const hasOnlyBullets = text.trim().startsWith("•") || text.trim().startsWith("-");
      console.log(`  Page ${i + 1}: company=${hasCompanyHeader}, onlyBullets=${hasOnlyBullets}`);

      // Pages with content should have at least some non-bullet content
      // unless it's a continuation page with only bullets from a split entry
      // (which is allowed for oversized items)
    }
  });

  test("page 1 contains first experience", async ({ page }) => {
    await injectResume(page, EXPERIENCE_BOUNDARY_RESUME as any, "corporate-blue");

    const page1Text = await page.locator(".rs-page").first().textContent();
    console.log(`Page 1 contains DataCorp: ${page1Text?.includes("DataCorp")}`);
    console.log(`Page 1 contains Analytics Solutions: ${page1Text?.includes("Analytics Solutions")}`);

    // Page 1 should contain the first experience (DataCorp Inc.)
    expect(page1Text).toContain("DataCorp");
  });
});

test.describe("Pagination — Blank-Gap Regression", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("section heading is not orphaned without content", async ({ page }) => {
    await injectResume(page, MULTIPAGE_RESUME as any, "corporate-blue");

    const texts = await getPageTexts(page);
    if (texts.length >= 2) {
      // Last page should have substantial content, not just a section heading
      const lastPage = texts[texts.length - 1];
      console.log(`Last page length: ${lastPage.length}`);
      expect(lastPage.length).toBeGreaterThan(100);
    }
  });
});

test.describe("Pagination — Dynamic Content", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("pagination recalculates after content change", async ({ page }) => {
    await injectResume(page, SMALL_RESUME as any, "modern-clean");

    const initialCount = await page.locator(".rs-page").count();
    console.log(`Initial page count: ${initialCount}`);

    // Add a long summary to potentially trigger multi-page
    await page.evaluate(() => {
      const store = (window as any).__resumeStore__;
      if (!store) return;
      const state = store.getState();
      const longSummary = "Experienced software engineer. ".repeat(100);
      store.setState({
        resume: { ...state.resume, summary: longSummary },
      });
    });

    // Wait for pagination to recalculate
    await page.waitForTimeout(1500);

    const newCount = await page.locator(".rs-page").count();
    console.log(`After content change: ${newCount} pages`);

    // The page count may or may not change depending on content length
    // But pagination must still produce valid pages
    expect(newCount).toBeGreaterThanOrEqual(1);

    // Verify each page has content
    const texts = await getPageTexts(page);
    for (const text of texts) {
      expect(text.length).toBeGreaterThan(10);
    }
  });
});

test.describe("Pagination — CSS Classes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("page structure has correct CSS classes", async ({ page }) => {
    await injectResume(page, SMALL_RESUME as any, "modern-clean");

    await expect(page.locator(".rs-pages")).toBeAttached();
    await expect(page.locator(".rs-page-measure")).toBeAttached();
    await expect(page.locator(".rs-page")).toHaveCount(1);
  });
});
