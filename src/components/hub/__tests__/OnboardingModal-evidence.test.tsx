/**
 * Activation: lightweight onboarding evidence step.
 *
 * After the essential identity step, onboarding now captures ONE real role +
 * a small skill set before first-resume creation, so the server seeds the
 * master resume from full profileData and the first job analysis has real
 * evidence to compare against. The step must stay compact, honest (never
 * invents), skippable, and must not change the existing skip path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OnboardingModal } from "../OnboardingModal";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: trackMock }));

type FetchCall = { url: string; method: string; body: unknown };
let fetchLog: FetchCall[];

function makeFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const body = init?.body ? JSON.parse(init.body as string) : null;
    fetchLog.push({ url, method, body });
    return { ok: true, status: 200, json: async () => ({ version: 1 }) };
  });
}

async function flush(times = 8) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

function buttons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll("button")) as HTMLButtonElement[];
}

function buttonWith(text: string): HTMLButtonElement | null {
  return buttons().find((b) => b.textContent?.trim() === text) ?? null;
}

function setInput(selector: string, value: string) {
  const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) throw new Error(`input not found: ${selector}`);
  /* Bypass React's value tracker (instance assignment updates the tracker and
   * swallows the change event) — set via the prototype setter instead. */
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else (el as HTMLInputElement).value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return el;
}

let container: HTMLDivElement;
let root: Root | undefined;

async function render(open: boolean) {
  container = document.createElement("div");
  document.body.appendChild(container);
  const created = createRoot(container);
  root = created;
  await act(async () => {
    created.render(<OnboardingModal open={open} onComplete={vi.fn()} />);
  });
  await flush();
}

async function goToEvidenceStep() {
  await act(async () => {
    buttonWith("Get Started")?.click();
  });
  await flush();
  await act(async () => {
    buttonWith("Save")?.click();
  });
  await flush();
}

describe("OnboardingModal — evidence step (§activation)", () => {
  beforeEach(() => {
    fetchLog = [];
    trackMock.mockReset();
    vi.stubGlobal("fetch", makeFetchMock());
    document.body.innerHTML = "";
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root!.unmount();
      });
    }
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("shows the evidence step after identity Save, with honest no-invention copy", async () => {
    await render(true);
    await goToEvidenceStep();

    const text = document.body.textContent;
    expect(text).toContain("Add your recent experience");
    expect(text).toContain("never invents experience, employers");
    expect(text).toContain("One real role is enough");
    // Finish is gated until real evidence exists.
    const finish = buttonWith("Finish profile");
    expect(finish).not.toBeNull();
    expect(finish!.disabled).toBe(true);
    // Little-information users get a clear way out.
    expect(buttonWith("Skip for now")).not.toBeNull();
  });

  it("Finish persists experience + skills to profileData and completes onboarding", async () => {
    await render(true);
    await goToEvidenceStep();

    setInput('input[placeholder^="Position"]', "Senior Data Engineer");
    setInput('input[placeholder="Company name"]', "Contoso Analytics");
    setInput('input[placeholder^="Start date"]', "Mar 2021");
    setInput('textarea[placeholder^="What you did"]', "Built pipelines in PySpark and Azure Data Factory.");
    setInput('input[placeholder^="Skills you actually use"]', "Python, SQL, PySpark");

    const finish = buttonWith("Finish profile")!;
    expect(finish.disabled).toBe(false);
    await act(async () => {
      finish.click();
    });
    await flush(12);

    // The completion PUT carries BOTH the evidence and onboardingCompleted —
    // the server then seeds the first resume from this profileData.
    const put = fetchLog.find(
      (c) => c.method === "PUT" && c.url === "/api/identity" && (c.body as { onboardingCompleted?: boolean })?.onboardingCompleted === true,
    );
    expect(put).toBeTruthy();
    const payload = put!.body as {
      onboardingCompleted: boolean;
      profileData: { experience?: Array<Record<string, unknown>>; skills?: string[] };
    };
    expect(payload.onboardingCompleted).toBe(true);
    expect(payload.profileData.experience?.[0]?.company).toBe("Contoso Analytics");
    expect(payload.profileData.experience?.[0]?.position).toBe("Senior Data Engineer");
    expect(payload.profileData.skills).toEqual(["Python", "SQL", "PySpark"]);

    // Existing funnel event, new props distinguish thin vs evidenced profile.
    expect(trackMock).toHaveBeenCalledWith("profile_created", { experience: true, skills: 3 });

    // First resume creation fires through the existing C30 flow.
    expect(document.body.textContent).toContain("Creating your first resume...");
    await flush(12);
    expect(fetchLog.some((c) => c.method === "POST" && c.url === "/api/resumes")).toBe(true);
  });

  it("Skip on the evidence step still completes onboarding without evidence (existing behavior)", async () => {
    await render(true);
    await goToEvidenceStep();

    await act(async () => {
      buttonWith("Skip for now")?.click();
    });
    await flush(12);

    const puts = fetchLog.filter((c) => c.method === "PUT" && c.url === "/api/identity");
    const completion = puts.find((c) => (c.body as { onboardingCompleted?: boolean }).onboardingCompleted === true);
    expect(completion).toBeTruthy();
    const profileData = (completion!.body as { profileData: Record<string, unknown> }).profileData;
    expect(profileData.experience).toBeUndefined();
    expect(profileData.skills).toBeUndefined();
    expect(trackMock).toHaveBeenCalledWith("profile_created", { skipped: true });
    expect(document.body.textContent).toContain("Creating your first resume...");
  });

  it("identity-step skip path is unchanged (no evidence step, direct completion)", async () => {
    await render(true);
    await act(async () => {
      buttonWith("Get Started")?.click();
    });
    await flush();

    await act(async () => {
      buttonWith("Skip for now")?.click(); // skip from the identity editor
    });
    await flush(12);

    expect(document.body.textContent).not.toContain("Add your recent experience");
    const completion = fetchLog.find(
      (c) => c.method === "PUT" && c.url === "/api/identity" && (c.body as { onboardingCompleted?: boolean }).onboardingCompleted === true,
    );
    expect(completion).toBeTruthy();
    expect(trackMock).toHaveBeenCalledWith("profile_created", { skipped: true });
  });
});
