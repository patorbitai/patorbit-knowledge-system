"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { deriveTrustForUser } from "@/lib/trust/canonical-loader";
import crypto from "crypto";

/**
 * Derive TrustReport from canonical server-side data for the given user.
 *
 * Phase 8: Uses the single canonical Trust input loader (canonical-loader.ts)
 * to ensure identical results with GET /api/trust and Passport derivation.
 *
 * SECURITY: This must NEVER accept client-supplied trust data.
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = await prisma.professionalIdentity.findUnique({
    where: { userId: session.user.id },
  });

  if (!identity || !identity.trustShareEnabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    token: identity.trustShareToken,
    shareUrl: `/trust/share/${identity.trustShareToken}`,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // SECURITY: trustReport is NEVER accepted from the client body.
    // Trust is always derived server-side from canonical data.

    let identity = await prisma.professionalIdentity.findUnique({
      where: { userId: session.user.id },
    });

    if (!identity) {
      identity = await prisma.professionalIdentity.create({
        data: { userId: session.user.id },
      });
    }

    if (action === "disable") {
      await prisma.professionalIdentity.update({
        where: { id: identity.id },
        data: {
          trustShareEnabled: false,
          trustShareToken: null,
          trustReportCache: null,
        },
      });
      return NextResponse.json({ enabled: false });
    }

    // Derive TrustReport from canonical server-side data
    // Phase 8: Uses canonical loader to ensure parity with GET /api/trust
    const trustReport = await deriveTrustForUser(session.user.id);

    const token = crypto.randomUUID();
    await prisma.professionalIdentity.update({
      where: { id: identity.id },
      data: {
        trustShareEnabled: true,
        trustShareToken: token,
        trustReportCache: JSON.stringify(trustReport),
      },
    });

    return NextResponse.json({
      enabled: true,
      token,
      shareUrl: `/trust/share/${token}`,
    });
  } catch (err: unknown) {
    return handleApiError(err, "trust-share:POST");
  }
}
