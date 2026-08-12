"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evidenceStorageService } from "@/services/evidence-storage.service";
import { evidenceRepository } from "@/repositories/evidence.repository";
import { entitlementService } from "@/services/entitlement.service";
import { usageService } from "@/services/usage.service";
import { MAX_EVIDENCE_FILE_BYTES } from "@/lib/evidence/validate";
import type { Evidence, EvidenceType, EvidenceKind, EvidenceVisibility } from "@/types/resume";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasEvidenceAccess = await entitlementService.hasFeature(session.user.id, "evidenceManagement");
  if (!hasEvidenceAccess) {
    return NextResponse.json({
      error: "Evidence management requires a Professional or Enterprise subscription",
      code: "FEATURE_NOT_ENTITLED",
      feature: "evidenceManagement",
    }, { status: 403 });
  }

  const usageCheck = await usageService.checkAndIncrementUsage(session.user.id, "evidence_uploads");
  if (!usageCheck.allowed) {
    return NextResponse.json({
      error: "Monthly evidence upload limit reached for Free tier. Upgrade to Professional for unlimited evidence.",
      code: "USAGE_LIMIT_REACHED",
    }, { status: 429 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let claimId = "";
    let evidenceKind: EvidenceKind = "GitHub Repository";
    let notes = "";
    let consent = false;
    let linkUrl = "";
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let fileMime = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      claimId = formData.get("claimId")?.toString() || "";
      evidenceKind = (formData.get("evidenceKind")?.toString() as EvidenceKind) || "GitHub Repository";
      notes = formData.get("notes")?.toString() || "";
      consent = formData.get("consent") === "true";
      linkUrl = formData.get("link")?.toString() || "";
      const file = formData.get("file");
      if (file && file instanceof Blob) {
        fileName = (file as File).name || "upload";
        fileMime = file.type || "application/octet-stream";
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      const body = await req.json();
      claimId = body.claimId;
      evidenceKind = body.evidenceKind;
      notes = body.notes || "";
      consent = body.consent;
      linkUrl = body.link || "";
    }

    if (!claimId) {
      return NextResponse.json({ error: "Missing claimId" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    const isLink = linkUrl.trim().length > 0;
    const evidenceType: EvidenceType = isLink ? "link" : (fileBuffer ? "file" : "document");

    if (fileBuffer && fileBuffer.length > MAX_EVIDENCE_FILE_BYTES) {
      return NextResponse.json({ error: "File exceeds maximum size limit" }, { status: 400 });
    }

    let content = linkUrl.trim();
    let format = isLink ? "link" : (fileMime || "file");
    const metadata: Evidence["metadata"] = {};

    if (isLink) {
      try {
        metadata.linkTitle = linkUrl.trim().replace(/^https?:\/\//, "").split("/")[0] || linkUrl.trim();
      } catch {
        metadata.linkTitle = linkUrl.trim();
      }
    } else if (fileBuffer) {
      const storageKey = await evidenceStorageService.uploadFile(fileBuffer, fileName, fileMime);
      content = storageKey;
      metadata.fileName = fileName;
      metadata.fileSize = fileBuffer.length;
      metadata.mimeType = fileMime;
    }

    const id = `evd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const record = await evidenceRepository.create({
      id,
      userId: session.user.id,
      claimId,
      evidenceType,
      evidenceKind,
      content,
      format,
      metadata: JSON.stringify(metadata),
      status: "evidence-added",
      confidence: isLink ? 0.7 : (fileBuffer ? 0.8 : 0.9),
      notes: notes.trim(),
      visibility: "private",
      consent: true,
    });

    const responseEvidence: Evidence = {
      id: record.id,
      claimId: record.claimId,
      evidenceType: record.evidenceType as EvidenceType,
      evidenceKind: record.evidenceKind as EvidenceKind,
      content: record.content,
      format: record.format,
      metadata: JSON.parse(record.metadata),
      uploadedBy: session.user.id,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      status: record.status as any,
      confidence: record.confidence,
      notes: record.notes || "",
      visibility: record.visibility as EvidenceVisibility,
      consent: record.consent,
    };

    return NextResponse.json(responseEvidence, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload evidence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const records = await evidenceRepository.findByUserId(session.user.id);
    const evidenceList: Evidence[] = records.map((r) => ({
      id: r.id,
      claimId: r.claimId,
      evidenceType: r.evidenceType as EvidenceType,
      evidenceKind: r.evidenceKind as EvidenceKind,
      content: r.content,
      format: r.format,
      metadata: JSON.parse(r.metadata),
      uploadedBy: r.userId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      status: r.status as any,
      confidence: r.confidence,
      notes: r.notes || "",
      visibility: r.visibility as EvidenceVisibility,
      consent: r.consent,
    }));

    return NextResponse.json({ evidence: evidenceList }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch evidence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
