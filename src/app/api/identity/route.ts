"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/identity
 *
 * Returns the authenticated user's ProfessionalIdentity including profileData.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.getIdentity(session.user.id);
    if (!identity) {
      return NextResponse.json({ error: "Identity not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: identity.id,
      profileData: identity.profileData,
      onboardingCompleted: identity.onboardingCompleted,
      createdAt: identity.createdAt.toISOString(),
      updatedAt: identity.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch identity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/identity
 *
 * Updates the authenticated user's ProfessionalIdentity profile data.
 * Body: { profileData: {...}, onboardingCompleted?: boolean }
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  try {
    let identity;

    if (payload.profileData !== undefined) {
      if (typeof payload.profileData !== "object" || payload.profileData === null) {
        return NextResponse.json({ error: "profileData must be an object" }, { status: 400 });
      }
      identity = await identityService.updateProfileData(
        session.user.id,
        JSON.parse(JSON.stringify(payload.profileData)),
      );
    }

    if (payload.onboardingCompleted === true) {
      identity = await identityService.completeOnboarding(session.user.id);
    }

    if (!identity) {
      identity = await identityService.getIdentity(session.user.id);
    }

    return NextResponse.json({
      id: identity!.id,
      profileData: identity!.profileData,
      onboardingCompleted: identity!.onboardingCompleted,
      createdAt: identity!.createdAt.toISOString(),
      updatedAt: identity!.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update identity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
