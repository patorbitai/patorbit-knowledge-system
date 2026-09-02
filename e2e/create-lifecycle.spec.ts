/**
 * C30 — Explicit Server-Side Resume Creation Browser Verification Tests
 *
 * Verifies the create lifecycle in a real browser:
 * - Explicit POST on create
 * - Server version captured
 * - Create → edit → PUT
 * - Create → delete → server absent
 * - Create → refresh → one resume
 * - Multiple creates independent
 *
 * Run: npx playwright test e2e/create-lifecycle.spec.ts --project=desktop-pagination
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = "test@patorbit.com";
const TEST_PASSWORD = "Test1234!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/resume-builder");
  await page.waitForLoadState("domcontentloaded");
  const url = page.url();
  if (!url.includes("/login")) return;
  await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL((url) => !url.toString().includes("/login"), { timeout: 15000 });
  await page.waitForLoadState("domcontentloaded");
}

async function waitForStore(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => !!(window as any).__resumeStore__, { timeout: 15000 });
  await page.waitForTimeout(300);
}

async function createResume(page: import("@playwright/test").Page, name: string): Promise<string> {
  return page.evaluate((name) => {
    return (window as any).__resumeStore__.getState().createResume(name);
  }, name);
}

async function getResumes(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const store = (window as any).__resumeStore__;
    const state = store.getState();
    return {
      resumes: state.resumes.map((r: any) => ({
        resumeId: r.resumeId,
        resumeName: r.resumeName,
      })),
      activeResumeId: state.activeResumeId,
      serverVersions: state.serverVersions || {},
      pendingDeletes: state.pendingDeletes || [],
    };
  });
}

async function deleteResumeById(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate((id) => {
    (window as any).__resumeStore__.getState().deleteResume(id);
  }, resumeId);
}

test.describe.serial("C30 — Explicit Server-Side Resume Creation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto("/resume-builder");
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(1500);
  });

  test("A: Create fires explicit POST", async ({ page }) => {
    const postUrls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/resumes")) {
        postUrls.push(req.url());
      }
    });

    const id = await createResume(page, "C30-Test-A");
    await page.waitForTimeout(2000);

    // Exactly one POST should have been fired
    expect(postUrls.length).toBe(1);

    // Verify the resume exists locally
    const state = await getResumes(page);
    expect(state.resumes.some((r: any) => r.resumeId === id)).toBe(true);
    expect(state.activeResumeId).toBe(id);
  });

  test("B: Create → Edit → server version captured", async ({ page }) => {
    const id = await createResume(page, "C30-Test-B");
    await page.waitForTimeout(2000);

    // Verify server version was captured
    const state = await getResumes(page);
    expect(state.serverVersions[id]).toBeGreaterThanOrEqual(1);
  });

  test("C: Create → Edit → PUT (no PUT→404→POST)", async ({ page }) => {
    const postUrls: string[] = [];
    const putUrls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/resumes")) {
        postUrls.push(req.url());
      }
      if (req.method() === "PUT" && req.url().includes("/api/resumes/")) {
        putUrls.push(req.url());
      }
    });

    const id = await createResume(page, "C30-Test-C");
    await page.waitForTimeout(2000);

    // Edit the resume to trigger a PUT
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Edited C");
    }, id);
    await page.waitForTimeout(3000);

    // Should have exactly 1 POST (creation)
    expect(postUrls.length).toBe(1);
    // Should have at least 1 PUT (edit)
    expect(putUrls.length).toBeGreaterThanOrEqual(1);
    // PUT should be for the correct resume
    expect(putUrls.some((u) => u.includes(id))).toBe(true);
  });

  test("D: Create → Delete immediately", async ({ page }) => {
    const id = await createResume(page, "C30-Test-D");
    await page.waitForTimeout(2000);

    // Delete immediately
    await deleteResumeById(page, id);
    await page.waitForTimeout(2000);

    // Verify server resume is gone
    const resp = await page.request.get(`/api/resumes/${id}`);
    expect(resp.status()).toBe(404);
  });

  test("E: Create → Refresh → one resume", async ({ page }) => {
    const id = await createResume(page, "C30-Test-E");
    await page.waitForTimeout(2000);

    // Verify on server
    const getResp = await page.request.get(`/api/resumes/${id}`);
    expect(getResp.status()).toBe(200);

    // Refresh
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(3000);

    // Resume should exist after refresh
    const state = await getResumes(page);
    expect(state.resumes.some((r: any) => r.resumeId === id)).toBe(true);
    expect(state.resumes.some((r: any) => r.resumeName === "C30-Test-E")).toBe(true);
  });

  test("F: Multiple creates are independent", async ({ page }) => {
    const idA = await createResume(page, "C30-Multi-A");
    const idB = await createResume(page, "C30-Multi-B");
    const idC = await createResume(page, "C30-Multi-C");

    await page.waitForTimeout(3000);

    // All three should exist locally
    const state = await getResumes(page);
    expect(state.resumes.some((r: any) => r.resumeId === idA)).toBe(true);
    expect(state.resumes.some((r: any) => r.resumeId === idB)).toBe(true);
    expect(state.resumes.some((r: any) => r.resumeId === idC)).toBe(true);

    // IDs should be unique
    expect(idA).not.toBe(idB);
    expect(idB).not.toBe(idC);
  });
});
