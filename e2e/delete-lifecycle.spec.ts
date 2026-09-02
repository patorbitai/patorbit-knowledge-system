/**
 * C29.1 — Delete Lifecycle Browser Verification Tests
 *
 * Verifies the complete delete lifecycle in a real browser.
 * Tests are designed to be isolated — they only check resumes they create.
 *
 * Run: npx playwright test e2e/delete-lifecycle.spec.ts --project=desktop-pagination
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
    const store = (window as any).__resumeStore__;
    return store.getState().createResume(name);
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
      pendingDeletes: state.pendingDeletes || [],
    };
  });
}

async function deleteResumeById(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate((id) => {
    (window as any).__resumeStore__.getState().deleteResume(id);
  }, resumeId);
}

async function switchResumeById(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate((id) => {
    (window as any).__resumeStore__.getState().switchResume(id);
  }, resumeId);
}

test.describe.serial("C29 — Delete Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Clear localStorage and reload to get fresh state
    await page.evaluate(() => localStorage.clear());
    await page.goto("/resume-builder");
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    // Extra wait for hydration to complete after localStorage clear
    await page.waitForTimeout(1500);
  });

  test("A: Delete inactive resume", async ({ page }) => {
    const idA = await createResume(page, "DelTest-A");
    const idB = await createResume(page, "DelTest-B");
    await switchResumeById(page, idA);

    // Delete B (inactive)
    await deleteResumeById(page, idB);

    const state = await getResumes(page);
    // B must be gone
    expect(state.resumes.find((r: any) => r.resumeId === idB)).toBeUndefined();
    // A must still be active
    expect(state.activeResumeId).toBe(idA);
    // pendingDeletes must contain B
    expect(state.pendingDeletes).toContain(idB);
  });

  test("B: Delete active resume", async ({ page }) => {
    const idA = await createResume(page, "DelTest-A");
    const idB = await createResume(page, "DelTest-B");
    await switchResumeById(page, idB);

    // Delete B (active)
    await deleteResumeById(page, idB);

    const state = await getResumes(page);
    expect(state.resumes.find((r: any) => r.resumeId === idB)).toBeUndefined();
    // Active must not be the deleted resume
    expect(state.activeResumeId).not.toBe(idB);
    // Active must be a valid existing resume
    expect(state.resumes.some((r: any) => r.resumeId === state.activeResumeId)).toBe(true);
  });

  test("C: Server DELETE is actually issued", async ({ page }) => {
    const idA = await createResume(page, "DelTest-A");
    const idB = await createResume(page, "DelTest-B");
    await switchResumeById(page, idA);

    const deleteUrls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "DELETE" && req.url().includes("/api/resumes/")) {
        deleteUrls.push(req.url());
      }
    });

    await deleteResumeById(page, idB);
    await page.waitForTimeout(500);

    expect(deleteUrls.length).toBeGreaterThanOrEqual(1);
    expect(deleteUrls.some((u) => u.includes(idB))).toBe(true);
  });

  test("D: Refresh after delete — B stays gone", async ({ page }) => {
    const idA = await createResume(page, "DelTest-A");
    const idB = await createResume(page, "DelTest-B");
    await switchResumeById(page, idA);

    // Wait for write-back to settle
    await page.waitForTimeout(2000);

    await deleteResumeById(page, idB);
    await page.waitForTimeout(2000); // Wait for server DELETE

    // Verify B is gone locally
    const before = await getResumes(page);
    expect(before.resumes.find((r: any) => r.resumeId === idB)).toBeUndefined();

    // Verify B is gone from server
    const resp = await page.request.get(`/api/resumes/${idB}`);
    expect(resp.status()).toBe(404);

    // Refresh
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(2000);

    // B must not return after refresh
    const after = await getResumes(page);
    expect(after.resumes.find((r: any) => r.resumeId === idB)).toBeUndefined();
    // A must still exist
    expect(after.resumes.some((r: any) => r.resumeName === "DelTest-A")).toBe(true);
  });

  test("E: C28 hydration does not restore deleted resume", async ({ page }) => {
    const idA = await createResume(page, "DelTest-A");
    const idB = await createResume(page, "DelTest-B");
    await switchResumeById(page, idA);

    // Wait for write-back to create both on server
    await page.waitForTimeout(3000);

    // Verify A exists on server
    const getA = await page.request.get(`/api/resumes/${idA}`);
    expect(getA.status()).toBe(200);

    // Delete B
    await deleteResumeById(page, idB);
    await page.waitForTimeout(2000);

    // Verify B is gone from server
    const getB = await page.request.get(`/api/resumes/${idB}`);
    expect(getB.status()).toBe(404);

    // Refresh — triggers C28 server-first hydration
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(3000);

    // B must NOT be restored by hydration
    const after = await getResumes(page);
    expect(after.resumes.find((r: any) => r.resumeId === idB)).toBeUndefined();
    // A must still exist
    expect(after.resumes.some((r: any) => r.resumeName === "DelTest-A")).toBe(true);
  });

  test("F: Pending PUT cannot resurrect deleted resume", async ({ page }) => {
    const idA = await createResume(page, "DelTest-A");
    const idB = await createResume(page, "DelTest-B");
    await switchResumeById(page, idB);

    // Edit B to trigger pending save
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Edited B");
    }, idB);

    const requestsToB: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes(idB)) {
        requestsToB.push(`${req.method()} ${req.url()}`);
      }
    });

    // Delete B (cancels pending save, fires DELETE)
    await deleteResumeById(page, idB);
    await switchResumeById(page, idA);

    // Wait for any async operations
    await page.waitForTimeout(3000);

    // No PUT should have been issued for B after deletion
    const putsToB = requestsToB.filter((r: string) => r.startsWith("PUT"));
    expect(putsToB).toHaveLength(0);

    // No POST should have been issued for B
    const postsToB = requestsToB.filter((r: string) => r.startsWith("POST"));
    expect(postsToB).toHaveLength(0);
  });

  test("G: Last resume cannot be deleted", async ({ page }) => {
    // Create a fresh resume so we know the exact count
    const id = await createResume(page, "DelTest-LastOnly");
    const before = await getResumes(page);
    const count = before.resumes.length;

    // Try to delete it — but there are other resumes, so it WILL be deleted
    // Instead, test the invariant: if only 1 resume exists, deletion is blocked
    // We verify the store code: resumes.length <= 1 returns early
    // Since beforeEach creates a fresh state with 1 resume, creating then deleting
    // the only resume should be blocked
    // Actually, the beforeEach creates 1 resume, and we just created another = 2.
    // Let's verify the invariant holds by checking the store behavior:
    // When only 1 resume exists, deleteResume is a no-op
    const singleState = await page.evaluate(() => {
      const store = (window as any).__resumeStore__;
      const state = store.getState();
      // If only 1 resume, try to delete it
      if (state.resumes.length === 1) {
        store.getState().deleteResume(state.resumes[0].resumeId);
        return { deleted: false, count: store.getState().resumes.length };
      }
      // If multiple resumes, delete all but one, then try to delete the last
      const ids = state.resumes.map((r: any) => r.resumeId);
      while (store.getState().resumes.length > 1) {
        const currentIds = store.getState().resumes.map((r: any) => r.resumeId);
        store.getState().deleteResume(currentIds[currentIds.length - 1]);
      }
      const lastId = store.getState().resumes[0].resumeId;
      store.getState().deleteResume(lastId);
      return { deleted: false, count: store.getState().resumes.length };
    });
    expect(singleState.count).toBe(1);
  });

  test("H: Multi-resume isolation", async ({ page }) => {
    const idA = await createResume(page, "DelTest-A");
    const idB = await createResume(page, "DelTest-B");
    const idC = await createResume(page, "DelTest-C");

    // Delete B
    await deleteResumeById(page, idB);

    const after = await getResumes(page);
    // B must be gone
    expect(after.resumes.find((r: any) => r.resumeId === idB)).toBeUndefined();
    // A and C must remain
    expect(after.resumes.some((r: any) => r.resumeName === "DelTest-A")).toBe(true);
    expect(after.resumes.some((r: any) => r.resumeName === "DelTest-C")).toBe(true);
  });
});
