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

  if (!identity || !identity.passportShareEnabled || !identity.passportShareToken) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    token: identity.passportShareToken,
    shareUrl: `/passport/share/${identity.passportShareToken}`,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, passportData } = body;

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
          passportShareEnabled: false,
          passportShareToken: null,
          passportDataCache: null,
        },
      });
      return NextResponse.json({ enabled: false });
    }

    // Generate a secure share token (reuse existing if present)
    const token = identity.passportShareToken || crypto.randomUUID();

    await prisma.professionalIdentity.update({
      where: { id: identity.id },
      data: {
        passportShareEnabled: true,
        passportShareToken: token,
        passportDataCache: passportData ? JSON.stringify(passportData) : null,
      },
    });

    return NextResponse.json({
      enabled: true,
      token,
      shareUrl: `/passport/share/${token}`,
    });
  } catch (err: unknown) {
    return handleApiError(err, "passport-share:POST");
  }
}
