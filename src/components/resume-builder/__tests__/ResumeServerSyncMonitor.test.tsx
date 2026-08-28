import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ResumeServerSyncMonitor } from "../ResumeServerSyncMonitor";

const { sessionStatus, runSyncMock } = vi.hoisted(() => ({
  sessionStatus: { value: "unauthenticated" as string },
  runSyncMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: sessionStatus.value }),
}));

vi.mock("@/lib/resume-server-sync/sync", () => ({
  runServerResumeSync: runSyncMock,
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
