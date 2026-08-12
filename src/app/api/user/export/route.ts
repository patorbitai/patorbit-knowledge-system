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

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        professionalIdentity: true,
        accounts: true,
        sessions: true,
        evidenceRecords: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let trustReportCache = null;
    try {
      if (user.professionalIdentity?.trustReportCache) {
        trustReportCache = JSON.parse(user.professionalIdentity.trustReportCache);
      }
    } catch {
      trustReportCache = user.professionalIdentity?.trustReportCache;
    }

    let passportDataCache = null;
    try {
      if (user.professionalIdentity?.passportDataCache) {
        passportDataCache = JSON.parse(user.professionalIdentity.passportDataCache);
      }
    } catch {
      passportDataCache = user.professionalIdentity?.passportDataCache;
    }

    const exportData = {
      exportVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      dataSource: "server-database",
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      professionalIdentity: user.professionalIdentity ? {
        trustShareEnabled: user.professionalIdentity.trustShareEnabled,
        passportShareEnabled: user.professionalIdentity.passportShareEnabled,
        trustReportCache,
        passportDataCache,
        createdAt: user.professionalIdentity.createdAt,
        updatedAt: user.professionalIdentity.updatedAt,
      } : null,
      connectedAccounts: user.accounts.map((acc) => ({
        provider: acc.provider,
        type: acc.type,
      })),
      evidenceRecords: user.evidenceRecords.map((e) => ({
        id: e.id,
        claimId: e.claimId,
        evidenceType: e.evidenceType,
        evidenceKind: e.evidenceKind,
        format: e.format,
        metadata: JSON.parse(e.metadata),
        status: e.status,
        visibility: e.visibility,
        createdAt: e.createdAt,
      })),
      activeSessionsCount: user.sessions.length,
    };

    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="patorbit-data-export-${user.id}.json"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
