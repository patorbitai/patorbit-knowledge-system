"use strict";

/**
 * /api/career-memory — get career memory insights derived from application outcomes.
 *
 * M5: Career Memory.
 * Read-only endpoint for the dashboard and career intelligence system.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { careerMemoryService } from "@/services/career-memory.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );

    // Check for context parameters for relevance filtering
    const url = new URL(req.url);
    const skillsParam = url.searchParams.get("skills");
    const roleType = url.searchParams.get("roleType");

    if (skillsParam || roleType) {
      // Return relevant insights for specific context
      const skills = skillsParam ? skillsParam.split(",") : undefined;
      const insights = await careerMemoryService.getRelevantInsights(
        identity.id,
        { skills, roleType: roleType ?? undefined },
      );
      return NextResponse.json({ insights }, { status: 200 });
    }

    // Return full summary
    const summary = await careerMemoryService.getSummary(identity.id);
    return NextResponse.json(summary, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch career memory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
