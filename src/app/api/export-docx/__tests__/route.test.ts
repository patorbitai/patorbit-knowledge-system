import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Packer } from "docx";
import { GALLERY_SAMPLE_RESUME } from "@/components/resume-builder/gallery-sample-resume";
import { resolveStyleConfig } from "@/lib/resume-design-system/style-config";

// Mock auth so the route runs without a real session/Prisma.
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { POST } from "@/app/api/export-docx/route";
import { getServerSession } from "next-auth";

const mockedSession = getServerSession as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/export-docx", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/export-docx", () => {
  beforeEach(() => {
    mockedSession.mockReset();
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockedSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ resume: {} }));
    expect(res.status).toBe(401);
  });

  it.each(["patorbit-modern", "executive-pro", "minimal-ats", "engineering-clean"])(
    "returns a valid non-empty DOCX for an authenticated customized resume (template: %s)",
    async (templateId) => {
      mockedSession.mockResolvedValue({ user: { id: "u1" } });
      const styleConfig = resolveStyleConfig({
        fontFamily: "garamond",
        accentColor: "#059669",
        headingColor: "accent",
        headingStyle: "title-case",
        bulletStyle: "dash",
        density: "compact",
        sectionSpacing: 16,
        entrySpacing: 8,
      });
      const resume = { ...GALLERY_SAMPLE_RESUME, templateId };
      const res = await POST(
        makeRequest({ resume, templateId, styleConfig }),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      const buf = Buffer.from(await res.arrayBuffer());
      expect(buf.length).toBeGreaterThan(1000);
      // A valid .docx starts with the PK zip magic and contains [Content_Types].xml
      expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
      expect(buf.includes(Buffer.from("[Content_Types].xml"))).toBe(true);
    },
  );

  it("still returns a valid DOCX for missing/invalid resume data (never a blank-format crash)", async () => {
    mockedSession.mockResolvedValue({ user: { id: "u1" } });
    const res = await POST(makeRequest({ resume: null, styleConfig: {} }));
    expect(res.status).toBe(200);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(100);
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("logs and returns a 500 for generator errors without leaking internals", async () => {
    mockedSession.mockResolvedValue({ user: { id: "u1" } });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const packerSpy = vi
      .spyOn(Packer, "toBuffer")
      .mockRejectedValueOnce(new Error("simulated generator failure"));
    const res = await POST(makeRequest({ resume: GALLERY_SAMPLE_RESUME, styleConfig: {} }));
    expect(res.status).toBe(500);
    const body = await res.json();
    // Safe message only — no internals leaked.
    expect(body.error).toBe("Failed to generate DOCX file.");
    expect(body.error).not.toContain("simulated generator failure");
    expect(logSpy).toHaveBeenCalledWith("DOCX export error:", expect.any(Error));
    packerSpy.mockRestore();
    logSpy.mockRestore();
  });
});
