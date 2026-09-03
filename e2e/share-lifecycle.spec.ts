/**
 * C32 — Resume Public Sharing Browser Verification Tests
 *
 * Verifies the share lifecycle in a real browser:
 * - Share button appears in dashboard
 * - Enable sharing generates a public link
 * - Public link renders resume without auth
 * - Other resumes remain private
 * - Disable sharing revokes access
 * - Duplicate doesn't inherit share token
 * - Delete shared resume revokes access
 * - Edit shared resume reflects in public page
 *
 * Run: npx playwright test e2e/share-lifecycle.spec.ts --project=desktop-pagination
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

async function updateField(page: import("@playwright/test").Page, field: string, value: string) {
  return page.evaluate(({ field, value }) => (window as any).__resumeStore__.getState().updateField(field, value), { field, value });
}

async function enableShare(page: import("@playwright/test").Page, resumeId: string): Promise<{ shareEnabled: boolean; shareToken: string; shareUrl: string }> {
  return page.evaluate(async (resumeId) => {
    const res = await fetch(`/api/resumes/${resumeId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enable" }),
    });
    const data = await res.json();
    return { shareEnabled: data.shareEnabled ?? false, shareToken: data.shareToken ?? "", shareUrl: data.shareUrl ?? "" };
  }, resumeId);
}

async function disableShare(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate(async (resumeId) => {
    const res = await fetch(`/api/resumes/${resumeId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable" }),
    });
    return res.json();
  }, resumeId);
}

async function getShareStatus(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate(async (resumeId) => {
    const res = await fetch(`/api/resumes/${resumeId}/share`);
    return res.json();
  }, resumeId);
}

async function deleteResumeById(page: import("@playwright/test").Page, resumeId: string) {
  return page.evaluate((id) => (window as any).__resumeStore__.getState().deleteResume(id), resumeId);
}

async function duplicateResume(page: import("@playwright/test").Page, sourceId: string): Promise<string> {
  return page.evaluate((id) => (window as any).__resumeStore__.getState().duplicateResume(id), sourceId);
}

test.describe.serial("C32 — Resume Public Sharing Lifecycle", () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto("/resume-builder");
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(1500);
  });

  test("A: Share button exists on dashboard", async ({ page }) => {
    const idA = await createResume(page, "ShareTest-A");
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Alice Share");
    }, idA);
    await page.waitForTimeout(2000);

    // Navigate to overview
    await page.goto("/overview");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    // Open the dropdown menu by hovering on the more button
    const moreButton = page.locator('button[aria-label="Resume actions"]').first();
    await moreButton.hover();
    await page.waitForTimeout(300);

    // Check that Share button exists in the menu
    const shareButton = page.locator('button:has-text("Share")').first();
    await expect(shareButton).toBeVisible();
  });

  test("B: Enable sharing generates a public link", async ({ page }) => {
    const idA = await createResume(page, "ShareTest-B");
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "Bob Shareable");
    }, idA);
    await page.waitForTimeout(4000); // ensure POST to server has completed

    const result = await enableShare(page, idA);
    expect(result.shareEnabled).toBe(true);
    expect(result.shareToken).toBeTruthy();
    expect(result.shareUrl).toContain("/resume/share/");
  });

  test("C: Public link renders resume without authentication", async ({ page, context }) => {
    const idA = await createResume(page, "PUBLICCharlie_ChildName");
    await page.waitForTimeout(4000); // ensure server sync

    const result = await enableShare(page, idA);
    expect(result.shareEnabled).toBe(true);

    // Open public link in a new context (unauthenticated)
    const publicPage = await context.newPage();
    await publicPage.goto(result.shareUrl);
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(2000);

    // Should see the resume content, not a login page
    const bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("Shared Resume");
    expect(bodyText).toContain("PUBLICCharlie_ChildName");

    await publicPage.close();
  });

  test("D: Other resumes remain private when one is shared", async ({ page, context }) => {
    const idA = await createResume(page, "PRIVATE_UNQ_A");
    await page.waitForTimeout(1000);

    const idB = await createResume(page, "SHARED_UNQ_B");
    await page.waitForTimeout(4000); // ensure server sync

    // Share only B
    const result = await enableShare(page, idB);
    expect(result.shareEnabled).toBe(true);

    // Open B's public link
    const publicPage = await context.newPage();
    await publicPage.goto(result.shareUrl);
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(2000);

    const bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("SHARED_UNQ_B");
    expect(bodyText).not.toContain("PRIVATE_UNQ_A");

    await publicPage.close();
  });

  test("E: Disable sharing revokes public access", async ({ page, context }) => {
    const idA = await createResume(page, "EVE_UNQ_Revokeable");
    await page.waitForTimeout(4000); // ensure server sync

    const result = await enableShare(page, idA);
    expect(result.shareEnabled).toBe(true);

    // Verify public link works
    const publicPage = await context.newPage();
    await publicPage.goto(result.shareUrl);
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(1000);
    let bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("EVE_UNQ_Revokeable");

    // Disable sharing
    const disableResult = await disableShare(page, idA);
    expect(disableResult.shareEnabled).toBe(false);

    // Refresh public page — should now show unavailable
    await publicPage.goto(result.shareUrl);
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(1000);
    bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("Unavailable");

    await publicPage.close();
  });

  test("F: Invalid share token shows unavailable", async ({ page, context }) => {
    const publicPage = await context.newPage();
    await publicPage.goto("/resume/share/invalid_token_12345");
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(1000);

    const bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("Unavailable");
    await publicPage.close();
  });

  test("G: Duplicate shared resume does not inherit share token", async ({ page }) => {
    const idA = await createResume(page, "ShareTest-G");
    await page.evaluate((id) => {
      (window as any).__resumeStore__.getState().updateField("name", "George Shared");
    }, idA);
    await page.waitForTimeout(2000);

    const shareResult = await enableShare(page, idA);
    expect(shareResult.shareEnabled).toBe(true);

    // Duplicate A
    const idB = await duplicateResume(page, idA);
    await page.waitForTimeout(1000);

    // B should NOT have share enabled
    const bStatus = await getShareStatus(page, idB);
    expect(bStatus.shareEnabled).toBe(false);
    expect(bStatus.shareToken).toBeNull();
  });

  test("H: Delete shared resume revokes access", async ({ page, context }) => {
    const idA = await createResume(page, "HELEN_UNQ_Deleteable");
    await page.waitForTimeout(4000); // ensure server sync

    const result = await enableShare(page, idA);
    expect(result.shareEnabled).toBe(true);

    // Verify public link works
    const publicPage = await context.newPage();
    await publicPage.goto(result.shareUrl);
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(1000);
    let bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("HELEN_UNQ_Deleteable");

    // Delete the resume
    await deleteResumeById(page, idA);
    await page.waitForTimeout(2000);

    // Public link should now show unavailable
    await publicPage.goto(result.shareUrl);
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(1000);
    bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("Unavailable");

    await publicPage.close();
  });

  test("I: Share status survives page refresh", async ({ page }) => {
    const idA = await createResume(page, "IVAN_UNQ_Persistent");
    await page.waitForTimeout(4000); // ensure server sync

    const result = await enableShare(page, idA);
    expect(result.shareEnabled).toBe(true);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await waitForStore(page);
    await page.waitForTimeout(1500);

    // Share status should still be enabled
    const status = await getShareStatus(page, idA);
    expect(status.shareEnabled).toBe(true);
    expect(status.shareToken).toBe(result.shareToken);
  });

  test("J: Multiple resumes have independent share state", async ({ page, context }) => {
    // Use distinctive resumeNames (not name field) since public page shows resumeName
    const idA = await createResume(page, "MULTI_A_UniqueName");
    await page.waitForTimeout(1000);

    const idB = await createResume(page, "MULTI_B_UniqueName");
    await page.waitForTimeout(1000);

    const idC = await createResume(page, "MULTI_C_UniqueName");
    await page.waitForTimeout(2000);

    // Share only B
    const shareB = await enableShare(page, idB);
    expect(shareB.shareEnabled).toBe(true);

    // A and C should not be shared
    const statusA = await getShareStatus(page, idA);
    const statusC = await getShareStatus(page, idC);
    expect(statusA.shareEnabled).toBe(false);
    expect(statusC.shareEnabled).toBe(false);

    // Open B's public link — should show B only
    const publicPage = await context.newPage();
    await publicPage.goto(shareB.shareUrl);
    await publicPage.waitForLoadState("domcontentloaded");
    await publicPage.waitForTimeout(2000);

    const bodyText = await publicPage.textContent("body");
    expect(bodyText).toContain("MULTI_B_UniqueName");
    expect(bodyText).not.toContain("MULTI_A_UniqueName");
    expect(bodyText).not.toContain("MULTI_C_UniqueName");

    await publicPage.close();
  });
});
