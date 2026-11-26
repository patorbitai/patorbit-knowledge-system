"use strict";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { isProviderConfigured, type MailProvider } from "@/lib/interview/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/interview/connections — honest connection status.
 * A provider is only reported as connected when a token row actually exists.
 */
export async function GET() {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const connections = await prisma.interviewEmailConnection.findMany({
      where: { professionalIdentityId: auth.caller.identityId },
      select: { provider: true, accountEmail: true, connectedAt: true, scope: true },
    });

    const status = (["google", "microsoft"] as MailProvider[]).map((provider) => {
      const connection = connections.find((entry) => entry.provider === provider);
      return {
        provider,
        configured: isProviderConfigured(provider),
        connected: Boolean(connection),
        accountEmail: connection?.accountEmail ?? null,
        connectedAt: connection?.connectedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ providers: status }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "connections:GET");
  }
}
