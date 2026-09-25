import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ResumeServerSyncMonitor } from "../ResumeServerSyncMonitor";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import type { Resume } from "@/types/resume";

const { sessionStatus, runSyncMock, fetchServerResumesMock } = vi.hoisted(() => ({
  sessionStatus: { value: "unauthenticated" as string },
  runSyncMock: vi.fn(),
  fetchServerResumesMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: sessionStatus.value }),
}));

vi.mock("@/lib/resume-server-sync/sync", () => ({
  runServerResumeSync: runSyncMock,
}));

vi.mock("@/lib/resume-server-sync/client", () => ({
  fetchServerResumes: fetchServerResumesMock,
}));

function renderMonitor() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<ResumeServerSyncMonitor />);
  });
  return { container, root, unmount: () => act(() => root.unmount()) };
}

describe("ResumeServerSyncMonitor", () => {
  beforeEach(() => {
    sessionStatus.value = "unauthenticated";
    runSyncMock.mockReset();
    runSyncMock.mockResolvedValue({ status: "ok", report: { entries: [], summary: { identical: 0, different: 0, localOnly: 0, serverOnly: 0 }, checkedAt: "x" } });
    fetchServerResumesMock.mockReset();
    fetchServerResumesMock.mockResolvedValue([]);
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nothing", () => {
    const { container, unmount } = renderMonitor();
    expect(container.childNodes.length).toBe(0);
    unmount();
  });

  it("does NOT fetch when unauthenticated", () => {
    renderMonitor();
    expect(runSyncMock).not.toHaveBeenCalled();
  });

  it("runs the read-only sync exactly once when authenticated", () => {
    sessionStatus.value = "authenticated";
    renderMonitor();
    expect(runSyncMock).toHaveBeenCalledTimes(1);
  });

  it("does not run again when the component re-renders (single-shot)", () => {
    sessionStatus.value = "authenticated";
    const { container, root } = renderMonitor();
    act(() => {
      root.render(<ResumeServerSyncMonitor />);
    });
    void container;
    expect(runSyncMock).toHaveBeenCalledTimes(1);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Regression coverage for the phantom-resume ownership blocker:
 * a contentless LOCAL_ONLY store placeholder persisted in localStorage must
 * be reconciled away by server hydration even when it sits NEXT TO a
 * server-backed resume (serverOnly === 0 && localEmpty === false) — the exact
 * state where hydration previously never ran and the phantom survived
 * refresh/navigation.
 * ────────────────────────────────────────────────────────────────────────── */
describe("ResumeServerSyncMonitor — phantom reconciliation", () => {
  const phantom: Resume = { ...defaultResume, resumeId: "id_phantom_0001", resumeName: "My Resume" };
  const localReal: Resume = {
    ...defaultResume,
    resumeId: "id_real_0001",
    resumeName: "My Resume",
    name: "Ada Lovelace",
    email: "ada@example.com",
  };

  const serverRealRecord = {
    resumeId: "id_real_0001",
    resumeName: "My Resume",
    templateId: "modern-clean",
    careerStage: "working-professional",
    version: 3,
    resume: { ...defaultResume, resumeId: "id_real_0001", name: "Ada Lovelace", email: "ada@example.com" },
  };

  beforeEach(() => {
    sessionStatus.value = "authenticated";
    runSyncMock.mockReset();
    fetchServerResumesMock.mockReset();
    fetchServerResumesMock.mockResolvedValue([]);
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("drops a contentless local-only phantom beside a server-backed resume (Test 5: stale local state)", async () => {
    useResumeBuilder.setState({
      resumes: [phantom, localReal],
      activeResumeId: "id_real_0001",
      resume: localReal,
      styleConfigs: {},
      pendingDeletes: [],
    });
    runSyncMock.mockResolvedValue({
      status: "ok",
      report: {
        entries: [
          { resumeId: "id_phantom_0001", status: "LOCAL_ONLY", localExists: true, serverExists: false },
          { resumeId: "id_real_0001", status: "DIFFERENT", localExists: true, serverExists: true },
        ],
        summary: { identical: 0, different: 1, localOnly: 1, serverOnly: 0 },
        checkedAt: "x",
      },
    });
    fetchServerResumesMock.mockResolvedValue([serverRealRecord]);

    const { unmount } = renderMonitor();

    await vi.waitFor(() => {
      expect(useResumeBuilder.getState().resumes.map((r) => r.resumeId)).toEqual(["id_real_0001"]);
    });
    expect(fetchServerResumesMock).toHaveBeenCalledTimes(1);
    // Server-backed resume and selection survive reconciliation.
    const state = useResumeBuilder.getState();
    expect(state.activeResumeId).toBe("id_real_0001");
    expect(state.resumes[0]?.name).toBe("Ada Lovelace");
    unmount();
  });

  it("does not re-hydrate when local state is in parity and has no phantom (no behavior change)", async () => {
    useResumeBuilder.setState({
      resumes: [localReal],
      activeResumeId: "id_real_0001",
      resume: localReal,
      styleConfigs: {},
      pendingDeletes: [],
    });
    runSyncMock.mockResolvedValue({
      status: "ok",
      report: {
        entries: [{ resumeId: "id_real_0001", status: "IDENTICAL", localExists: true, serverExists: true }],
        summary: { identical: 1, different: 0, localOnly: 0, serverOnly: 0 },
        checkedAt: "x",
      },
    });

    const { unmount } = renderMonitor();

    await vi.waitFor(() => expect(runSyncMock).toHaveBeenCalledTimes(1));
    // Flush the sync promise chain before asserting the negative.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(fetchServerResumesMock).not.toHaveBeenCalled();
    expect(useResumeBuilder.getState().resumes.map((r) => r.resumeId)).toEqual(["id_real_0001"]);
    unmount();
  });
});
