"use strict";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import {
  appOrigin,
  buildAuthUrl,
  disconnect,
  isProviderConfigured,
  newState,
  type MailProvider,
} from "@/lib/interview/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ provider: string }>;
}

function asProvider(value: string): MailProvider | null {
  return value === "google" || value === "microsoft" ? value : null;
}

/** POST — begin the OAuth flow (explicit consent happens at the provider). */
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { provider: raw } = await context.params;
  const provider = asProvider(raw);
  if (!provider) {
    return NextResponse.json({ error: "UNKNOWN_PROVIDER" }, { status: 400 });
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      {
        error: "PROVIDER_NOT_CONFIGURED",
        message:
          provider === "google"
            ? "Gmail access is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server environment."
            : "Outlook access is not configured. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to the server environment.",
      },
      { status: 503 },
    );
  }

  try {
    const state = newState();
    const store = await cookies();
    store.set(`patorbit_oauth_${provider}`, `${auth.caller.identityId}:${state}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });

    const authUrl = buildAuthUrl(provider, appOrigin(req.nextUrl.origin), state);
    return NextResponse.json({ authUrl }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "connections/[provider]:POST");
  }
}

/** DELETE — disconnect and forget the stored tokens. */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { provider: raw } = await context.params;
  const provider = asProvider(raw);
  if (!provider) {
    return NextResponse.json({ error: "UNKNOWN_PROVIDER" }, { status: 400 });
  }

  try {
    await disconnect(auth.caller.identityId, provider);
    return NextResponse.json({ disconnected: true }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "connections/[provider]:DELETE");
  }
}
