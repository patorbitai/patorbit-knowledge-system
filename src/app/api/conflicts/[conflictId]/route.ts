"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { handleApiError } from "@/lib/api-error";
import { conflictService } from "@/services/conflict.service";

/**
 * /api/conflicts/[conflictId] — manage individual conflicts.
 *
 * Supports:
 *  GET    — retrieve a specific conflict
 *  PATCH  — update conflict status (reviewing, dismissed, resolved)
 *  DELETE — remove a conflict
 *
 * All operations enforce ProfessionalIdentity ownership.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: { conflictId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const conflict = await conflictService.getConflict(
      params.conflictId,
      identity.id,
    );
    return NextResponse.json(conflict, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Conflict not found") {
      return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
    }
    return handleApiError(err, "conflicts:GET");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { conflictId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const conflict = await conflictService.updateConflictStatus(
      params.conflictId,
      identity.id,
      body.status,
      body.resolution,
    );
    return NextResponse.json(conflict, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "Conflict not found") {
        return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
      }
      if (err.message.startsWith("Invalid status")) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }
    return handleApiError(err, "conflicts:PATCH");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { conflictId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    await conflictService.deleteConflict(params.conflictId, identity.id);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Conflict not found") {
      return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
    }
    return handleApiError(err, "conflicts:DELETE");
  }
}
