"use strict";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

/**
 * GET /api/passport/share/[token]
 *
 * Public endpoint for unauthenticated Passport access.
 * Returns the server-derived Passport snapshot for a valid share token.
 *
 * No authentication required — this is the public sharing mechanism.
 * The Passport data was derived server-side when sharing was enabled.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const identity = await prisma.professionalIdentity.findUnique({
      where: { passportShareToken: token },
      include: { user: true },
    });

    if (!identity || !identity.passportShareEnabled || !identity.passportDataCache) {
      return NextResponse.json(
        { error: "Passport not found or unavailable" },
        { status: 404 },
      );
    }

    let passport;
    try {
      passport = JSON.parse(identity.passportDataCache);
    } catch {
      return NextResponse.json(
        { error: "Passport data corrupted" },
        { status: 500 },
      );
    }

    // Verify the passport has the expected structure
    if (!passport || !passport.identity || !passport.schemaVersion) {
      return NextResponse.json(
        { error: "Invalid passport format" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      passport,
      ownerName: identity.user?.name || "Professional",
    });
  } catch (err: unknown) {
    return handleApiError(err, "passport-share-token:GET");
  }
}
