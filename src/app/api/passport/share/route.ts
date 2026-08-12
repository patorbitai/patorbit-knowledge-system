"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = await prisma.professionalIdentity.findUnique({
    where: { userId: session.user.id },
  });

  if (!identity || !identity.passportShareEnabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    shareUrl: `/passport/${session.user.id}`,
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
          passportDataCache: null,
        },
      });
      return NextResponse.json({ enabled: false });
    }

    await prisma.professionalIdentity.update({
      where: { id: identity.id },
      data: {
        passportShareEnabled: true,
        passportDataCache: passportData ? JSON.stringify(passportData) : null,
      },
    });

    return NextResponse.json({
      enabled: true,
      shareUrl: `/passport/${session.user.id}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update passport share settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
