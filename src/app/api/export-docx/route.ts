import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Packer } from "docx";
import { buildDocx, type DocxResumeData } from "@/lib/export-docx";
import { DEFAULT_STYLE_CONFIG, resolveStyleConfig, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { materializePlan } from "@/lib/resume-planner";
import type { ResumeContentPlan } from "@/lib/resume-planner";

interface ExportDocxBody {
  resume?: DocxResumeData;
  templateId?: string;
  styleConfig?: Partial<ResumeStyleConfig>;
  /** The SAME content plan the preview rendered with (preview ↔ export parity). */
  plan?: ResumeContentPlan;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication — required to export a resume
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body: ExportDocxBody = await request.json();
    const resume = body.resume ?? {};
    // Resolve/clamp the config server-side using the SAME shared resolver the
    // preview uses — the exported document can never silently differ from what
    // the user sees in Professional Preview.
    const style = resolveStyleConfig(body.styleConfig ?? DEFAULT_STYLE_CONFIG);

    // §2 architecture: render through the SAME deliberate content plan the
    // preview used — budgets, ordering and exclusions match by construction.
    const plan = body.plan && Array.isArray(body.plan.sections) ? body.plan : undefined;
    const data = plan ? materializePlan(resume, plan) : resume;

    const doc = buildDocx(data, style, plan);
    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="resume.docx"`,
      },
    });
  } catch (error) {
    console.error("DOCX export error:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX file." },
      { status: 500 }
    );
  }
}
