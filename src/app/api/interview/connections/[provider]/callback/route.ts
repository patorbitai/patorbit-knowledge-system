"use strict";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptToken, safeEqual } from "@/lib/interview/crypto";
import { exchangeCode, type MailProvider } from "@/lib/interview/oauth";
import { identityService } from "@/services/identity.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ provider: string }>;
}

function asProvider(value: string): MailProvider | null {
  return value === "google" || value === "microsoft" ? value : null;
}

/**
 * OAuth callback. Validates the signed state against the cookie and the
 * authenticated session before exchanging the code — a replayed or foreign
 * state is rejected.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const { provider: raw } = await context.params;
  const provider = asProvider(raw);
  const redirectBase = "/interview-preparation/import";

  if (!provider) {
    return NextResponse.redirect(new URL(`${redirectBase}?mailbox=error`, req.nextUrl.origin));
  }

  const error = req.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?mailbox=cancelled&provider=${provider}`, req.nextUrl.origin),
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") ?? "";
  const cookieName = `patorbit_oauth_${provider}`;
  const store = await cookies();
  const stored = store.get(cookieName)?.value ?? "";
  store.delete(cookieName);

  if (!code || !stored) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?mailbox=error&provider=${provider}`, req.nextUrl.origin),
    );
  }

  const [identityId, expectedState] = stored.split(":");
  if (!identityId || !expectedState || !safeEqual(expectedState, state)) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?mailbox=state_mismatch&provider=${provider}`, req.nextUrl.origin),
    );
  }

  // The callback must belong to the signed-in owner of that identity.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
  const identity = await identityService.ensureProfessionalIdentity(session.user.id);
  if (identity.id !== identityId) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?mailbox=state_mismatch&provider=${provider}`, req.nextUrl.origin),
    );
  }

  try {
    const tokens = await exchangeCode(provider, req.nextUrl.origin, code);
    await prisma.interviewEmailConnection.upsert({
      where: { professionalIdentityId_provider: { professionalIdentityId: identity.id, provider } },
      update: {
        accessTokenEncrypted: encryptToken(tokens.access_token),
        refreshTokenEncrypted: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,
        tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scope: tokens.scope ?? null,
      },
      create: {
        professionalIdentityId: identity.id,
        provider,
        accessTokenEncrypted: encryptToken(tokens.access_token),
        refreshTokenEncrypted: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
        tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scope: tokens.scope ?? null,
      },
    });

    return NextResponse.redirect(
      new URL(`${redirectBase}?mailbox=connected&provider=${provider}`, req.nextUrl.origin),
    );
  } catch (err) {
    console.error("[oauth] callback failed", err);
    return NextResponse.redirect(
      new URL(`${redirectBase}?mailbox=error&provider=${provider}`, req.nextUrl.origin),
    );
  }
}
