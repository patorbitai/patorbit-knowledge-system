"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evidenceStorageService } from "@/services/evidence-storage.service";
import { evidenceRepository } from "@/repositories/evidence.repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  
  try {
    const record = await evidenceRepository.findById(id);
    if (!record) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === record.userId;
    const isPublic = record.visibility === "public";

    // Access control: only owner can access private evidence. Public can access public metadata or files.
    if (!isOwner && !isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If it's a link evidence, redirect or return metadata
    if (record.evidenceType === "link") {
      return NextResponse.json({
        id: record.id,
        claimId: record.claimId,
        evidenceType: record.evidenceType,
        evidenceKind: record.evidenceKind,
        content: record.content,
        metadata: JSON.parse(record.metadata),
        visibility: record.visibility,
        status: record.status,
      });
    }

    // For file evidence, retrieve buffer from server-side storage
    const buffer = await evidenceStorageService.getFile(record.content);
    if (!buffer) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    const metadata = JSON.parse(record.metadata);
    const mimeType = metadata.mimeType || "application/octet-stream";
    const fileName = metadata.fileName || "evidence-file";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": isOwner ? "private, no-store" : "public, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve evidence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const record = await evidenceRepository.findById(id);
    if (!record) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    if (record.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove from object storage if file type
    if (record.evidenceType !== "link") {
      await evidenceStorageService.deleteFile(record.content).catch(() => {});
    }

    // Delete record from database
    await evidenceRepository.delete(id);

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete evidence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
