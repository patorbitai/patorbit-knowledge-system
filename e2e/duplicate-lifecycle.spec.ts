/**
 * C31 — Duplicate Resume Browser Verification Tests
 *
 * Verifies the duplicate lifecycle in a real browser:
 * - Duplicate creates new resume
 * - Duplicate has unique ID
 * - Duplicate copies content
 * - Duplicate → Edit → original unchanged
 * - Duplicate → Delete → original remains
 * - Duplicate → Refresh → both survive
 * - Server POST fires for duplicate
 *
 * Run: npx playwright test e2e/duplicate-lifecycle.spec.ts --project=desktop-pagination
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
  return page.evaluate((name) => (window as any).__resumeStore__.getState().createResume(name), name);
}

async function duplicateResume(page: import("@playwright/test").Page, sourceId: string): Promise<string> {
  return page.evaluate((id) => (window as any).__resumeStore__.getState().duplicateResume(id), sourceId);
}

async function deleteResumeById(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate((id) => (window as any).__resumeStore__.getState().deleteResume(id), resumeId);
}

async function switchResumeById(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate((id) => (window as any).__resumeStore__.getState().switchResume(id), resumeId);
}

async function getResumes(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const store = (window as any).__resumeStore__;
    const state = store.getState();
    return {
      resumes: state.resumes.map((r: any) => ({
        resumeId: r.resumeId,
        resumeName: r.resumeName,
        name: r.name,
      })),
      activeResumeId: state.activeResumeId,
      serverVersions: state.serverVersions || {},
    };
  });
}

test.describe.serial("C31 — Duplicate Resume Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto("/resume-builder");
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(1500);
  });

  test("A: Duplicate creates new resume with unique ID", async ({ page }) => {
    const idA = await createResume(page, "DupTest-A");
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Alice");
    }, idA);
    await page.waitForTimeout(2000); // let POST settle

    const idB = await duplicateResume(page, idA);

    expect(idB).not.toBe(idB === idA ? idA : ""); // basic sanity
    expect(idB).not.toBe(idA);

    const state = await getResumes(page);
    expect(state.resumes.some((r: any) => r.resumeId === idB)).toBe(true);
    expect(state.activeResumeId).toBe(idB);
  });

  test("B: Duplicate copies content from original", async ({ page }) => {
    const idA = await createResume(page, "DupTest-B");
    await page.evaluate((id) => {
      const store = (window as any).__resumeStore__;
      store.getState().updateField("name", "Alice");
      store.getState().updateField("email", "alice@test.com");
    }, idA);
    await page.waitForTimeout(2000);

    const idB = await duplicateResume(page, idA);

    const state = await getResumes(page);
    const dup = state.resumes.find((r: any) => r.resumeId === idB);
    expect(dup).toBeDefined();
    expect(dup!.name).toBe("Alice");
    expect(dup!.resumeName).toContain("(Copy)");
  });

  test("C: Duplicate → Edit does not affect original", async ({ page }) => {
    const idA = await createResume(page, "DupTest-C");
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Alice");
    }, idA);
    await page.waitForTimeout(2000);

    const idB = await duplicateResume(page, idA);

    // Edit B
    await page.evaluate((id) => {
      const store = (window as any).__resumeStore__;
      store.getState().switchResume(id);
      store.getState().updateField("name", "Bob");
    }, idB);

    // A should be unchanged
    const state = await getResumes(page);
    const orig = state.resumes.find((r: any) => r.resumeId === idA);
    expect(orig!.name).toBe("Alice");

    const dup = state.resumes.find((r: any) => r.resumeId === idB);
    expect(dup!.name).toBe("Bob");
  });

  test("D: Duplicate → Delete preserves original", async ({ page }) => {
    const idA = await createResume(page, "DupTest-D");
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Alice");
    }, idA);
    await page.waitForTimeout(2000);

    const idB = await duplicateResume(page, idA);
    await deleteResumeById(page, idB);

    const state = await getResumes(page);
    // A must remain
    expect(state.resumes.some((r: any) => r.resumeId === idA)).toBe(true);
    const orig = state.resumes.find((r: any) => r.resumeId === idA);
    expect(orig!.name).toBe("Alice");
    // B must be gone
    expect(state.resumes.find((r: any) => r.resumeId === idB)).toBeUndefined();
  });

  test("E: Duplicate → Refresh → both survive", async ({ page }) => {
    const idA = await createResume(page, "DupTest-E");
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Alice");
    }, idA);
    await page.waitForTimeout(2000);

    const idB = await duplicateResume(page, idA);
    await page.waitForTimeout(2000); // let duplicate POST settle

    // Refresh
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(3000);

    const state = await getResumes(page);
    expect(state.resumes.some((r: any) => r.resumeId === idA)).toBe(true);
    expect(state.resumes.some((r: any) => r.resumeId === idB)).toBe(true);
  });

  test("F: Duplicate server POST fires for new resumeId", async ({ page }) => {
    const postBodies: any[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/resumes")) {
        try { postBodies.push(JSON.parse(req.postData() || "{}")); } catch {}
      }
    });

    const idA = await createResume(page, "DupTest-F");
    await page.waitForTimeout(1000);

    const idB = await duplicateResume(page, idA);
    await page.waitForTimeout(2000);

    // Find the POST for the duplicate
    const dupPost = postBodies.find((b) => b.resumeId === idB);
    expect(dupPost).toBeDefined();
    expect(dupPost.resumeId).toBe(idB);
    expect(dupPost.resumeName).toContain("(Copy)");
  });
});
