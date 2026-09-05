"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";

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
    const { action, trustReport } = body;

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

    const token = crypto.randomUUID();
    await prisma.professionalIdentity.update({
      where: { id: identity.id },
      data: {
        trustShareEnabled: true,
        trustShareToken: token,
        trustReportCache: trustReport ? JSON.stringify(trustReport) : null,
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
