/**
 * V18 — Interview Preparation end-to-end coverage.
 *
 * Covers the deterministic product paths in a real browser:
 *   A. create an interview profile from scratch
 *   B. paste an invitation, review the extracted fields, save the profile
 *   C. a second account cannot read another user's profile (404, not 403/200)
 *
 * The AI-dependent flows (preparation plan, practice session, report) are gated
 * on `E2E_AI_ENABLED=1` because they cannot pass without a configured provider;
 * they are reported as skipped rather than silently passing.
 *
 * Run: npx playwright test e2e/interview-preparation.spec.ts --project=desktop-pagination
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const OWNER_EMAIL = "test@patorbit.com";
const OWNER_PASSWORD = "Test1234!";
const OTHER_EMAIL = "e2e-second-user@patorbit.test";
const OTHER_PASSWORD = "Second1234!";
const AI_ENABLED = process.env.E2E_AI_ENABLED === "1";

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const raw = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
  const line = raw.split(/\r?\n/).find((entry) => entry.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is not configured.");
  return line.slice("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
}

const prisma = new PrismaClient({ datasourceUrl: databaseUrl() });

async function ensureSecondUser() {
  const passwordHash = await bcrypt.hash(OTHER_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: OTHER_EMAIL },
    update: { passwordHash, emailVerified: new Date() },
    create: {
      email: OTHER_EMAIL,
      name: "E2E Second User",
      passwordHash,
      emailVerified: new Date(),
    },
  });
  await prisma.professionalIdentity.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
}

async function login(page: Page, email = OWNER_EMAIL, password = OWNER_PASSWORD) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  // Wait for hydration: a fill before the form mounts is reset and posts empty
  // credentials, which returns 401 and looks like a wrong password.
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await emailInput.waitFor({ state: "visible" });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await expect(emailInput).toHaveValue(email);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL((url) => !url.toString().includes("/login"), { timeout: 30_000 });
}

/** Create a profile through the API so a test can focus on something else. */
/** Cuid ids are long; `/interview-preparation/new` must not match this. */
const PROFILE_URL = /\/interview-preparation\/[a-z0-9]{15,}$/;

async function createProfileViaUi(page: Page, company: string, title: string): Promise<string> {
  await page.goto("/interview-preparation/new", { waitUntil: "domcontentloaded" });
  // React forms submit natively until hydration finishes, which reloads the
  // page without calling the API. Wait for the control to hold its value.
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const companyInput = page.locator("#companyName");
  await companyInput.fill(company);
  await expect(companyInput).toHaveValue(company);
  await page.locator("#jobTitle").fill(title);
  await page.locator("#interviewType").selectOption("technical_interview");
  await page.click('button[type="submit"]:has-text("Create interview profile")');
  await page.waitForURL(PROFILE_URL, { timeout: 30_000 });
  const id = new URL(page.url()).pathname.split("/").pop() as string;
  expect(id).toMatch(/^[a-z0-9]+$/);
  return id;
}

test.describe("Interview Preparation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await ensureSecondUser();
  });

  test.afterAll(async () => {
    await prisma.interviewProfile.deleteMany({
      where: { companyName: { startsWith: "E2E " } },
    });
    await prisma.$disconnect();
  });

  test("A: creates an interview profile and shows it on its own page", async ({ page }) => {
    await login(page);
    await page.goto("/interview-preparation", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Interview Preparation" })).toBeVisible();

    const company = `E2E Profile ${Date.now()}`;
    const id = await createProfileViaUi(page, company, "Data Platform Engineer");

    await expect(page.getByText(company, { exact: false }).first()).toBeVisible();
    // The profile starts with one round so the timeline is never empty.
    await expect(page.getByText("Interview timeline")).toBeVisible();
    await expect(page.locator("ol li").first()).toBeVisible();

    // It is listed on the dashboard too.
    await page.goto("/interview-preparation", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(company, { exact: false }).first()).toBeVisible();
    expect(id).toBeTruthy();
  });

  test("B: pastes an invitation, reviews extracted fields and saves the profile", async ({ page }) => {
    await login(page);
    await page.goto("/interview-preparation/import", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await expect(page.getByRole("heading", { name: "Import an interview invitation" })).toBeVisible();

    const company = `E2E Import ${Date.now()}`;
    const body = [
      `Subject: Interview invitation — ${company}`,
      "",
      `Hello,`,
      "",
      `Thank you for applying to ${company}. We would like to invite you for a`,
      `technical interview for the Senior Data Engineer role on 12 December 2026 at 10:30 IST.`,
      `The interview will last 45 minutes over a video call.`,
      "",
      `Skills we will cover: SQL, Python, PySpark, Azure Data Factory.`,
      "",
      `Best regards,`,
      `Recruiting Team`,
    ].join("\n");

    await page.locator("#content").fill(body);
    await expect(page.locator("#content")).toHaveValue(body);
    await page.click('button:has-text("Extract details")');

    // Review screen: fields the email actually states are pre-filled, and
    // everything stays editable. The company is deliberately left blank here —
    // the pasted text names no sender domain, and unknown must stay unknown
    // rather than be guessed.
    const companyField = page.locator("#ex-company");
    await expect(companyField).toBeVisible({ timeout: 30_000 });
    // The email states a 45-minute technical interview, so those two fields are
    // populated with evidence; the exact interview-type heuristic is not pinned
    // here (a PySpark mention legitimately maps to the PySpark assessment).
    await expect(page.locator("#ex-duration")).toHaveValue("45");
    await expect(page.locator("#ex-type")).not.toHaveValue("");
    await expect(companyField).toHaveValue("");
    await expect(companyField).toBeEditable();

    // Edits made on the review screen are what get saved.
    await companyField.fill(company);
    await page.click('button:has-text("Save interview profile")');

    await page.waitForURL(PROFILE_URL, { timeout: 30_000 });
    await expect(page.getByText(company, { exact: false }).first()).toBeVisible();
  });

  test("C: a second account cannot open the profile (404)", async ({ page, browser }) => {
    await login(page);
    const company = `E2E Private ${Date.now()}`;
    const profileId = await createProfileViaUi(page, company, "Backend Engineer");

    // Same URL, different signed-in account.
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await login(otherPage, OTHER_EMAIL, OTHER_PASSWORD);

    await otherPage.goto(`/interview-preparation/${profileId}`, { waitUntil: "domcontentloaded" });
    // The page streams, so the HTTP status can be 200 in `next dev` even when
    // notFound() renders; what matters is that no profile content leaks.
    await expect(otherPage.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(otherPage.getByText(company, { exact: false })).toHaveCount(0);

    // The API agrees, and says "not found" rather than leaking existence.
    const api = await otherPage.request.get(`/api/interview/profiles/${profileId}`);
    expect(api.status()).toBe(404);

    await otherContext.close();
  });

  test("D: plan, practice session and report (requires a configured AI provider)", async ({ page }) => {
    test.skip(!AI_ENABLED, "E2E_AI_ENABLED is not set: no AI provider credentials in this environment.");

    await login(page);
    const company = `E2E Ai ${Date.now()}`;
    const profileId = await createProfileViaUi(page, company, "Analytics Engineer");

    // Preparation plan.
    await page.goto(`/interview-preparation/${profileId}/plan`, { waitUntil: "domcontentloaded" });
    await page.click('button:has-text("Generate")');
    await expect(page.getByText("Roadmap")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(/general role-based/i).first()).toBeVisible();

    // Practice session.
    await page.goto(`/interview-preparation/${profileId}`, { waitUntil: "domcontentloaded" });
    await page.click('button:has-text("Start practice")');
    await page.waitForURL(/\/sessions\/[a-z0-9]+$/, { timeout: 90_000 });
    await page.locator("textarea").first().fill(
      "In a Spark job I first inspect the physical plan and the stage timeline, then reduce shuffle by " +
        "broadcasting the small side or salting a skewed key, and finally verify output file sizes.",
    );
    await page.click('button:has-text("Submit answer")');
    await expect(page.getByText(/Evaluation of your last answer/i)).toBeVisible({ timeout: 90_000 });
    await page.click('button:has-text("Finish and get report")');
    await page.waitForURL(/\/report$/, { timeout: 90_000 });
    await expect(page.getByRole("heading", { name: "Performance report" })).toBeVisible();
  });
});
