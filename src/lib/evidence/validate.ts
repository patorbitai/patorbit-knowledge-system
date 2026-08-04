"use strict";

/**
 * Evidence Validation (Client-side)
 *
 * Pure validation helpers for the Evidence upload workflow (Slice 2, Task 2).
 * Kept separate from the UI so the same rules can be unit-tested and shared
 * between the modal and any future programmatic evidence creation.
 */

import type { EvidenceKind, EvidenceType } from "@/types/resume";
import { kindToTransport } from "@/types/evidence-kinds";

/** Maximum accepted file size in bytes (≈20MB) — IndexedDB quota is generous,
 * but we cap to keep writes snappy and honest. */
export const MAX_EVIDENCE_FILE_BYTES = 20 * 1024 * 1024; // ~20 MB

/** Primary URL protocols we accept for link evidence. */
const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:"]);

/** MIME types we accept for document-style file uploads. */
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

/** A structured validation error. Null `field` means a form-wide error. */
export interface EvidenceValidationError {
  field: "kind" | "link" | "file" | "consent" | null;
  message: string;
}

/** Validates the user's chosen evidence kind exists and is well-formed. */
export function validateEvidenceKind(kind: EvidenceKind | null): EvidenceValidationError | null {
  if (!kind) {
    return { field: "kind", message: "Select an evidence type." };
  }
  return null;
}

/** Validates a link value for `link`-transport evidence kinds. */
export function validateEvidenceLink(
  link: string,
  kind: EvidenceKind | null,
): EvidenceValidationError | null {
  if (!kind) return null;
  const transport = kindToTransport(kind);
  if (transport !== "link") return null; // N/A for file-based kinds

  const trimmed = link.trim();
  if (!trimmed) {
    return { field: "link", message: "Add a URL to your evidence." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { field: "link", message: "That doesn't look like a valid URL." };
  }

  if (!ALLOWED_LINK_PROTOCOLS.has(parsed.protocol)) {
    return { field: "link", message: "Use an http:// or https:// link." };
  }

  return null;
}

/** Validates a file selection. `kind` is used to check transport matches. */
export function validateEvidenceFile(
  file: File | null,
  kind: EvidenceKind | null,
): EvidenceValidationError | null {
  if (!kind) return null;
  const transport = kindToTransport(kind);
  if (transport !== "file" && transport !== "document") return null; // link kinds don't take files

  if (!file) {
    return { field: "file", message: "Choose a file to upload." };
  }

  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return { field: "file", message: `File is too large. Max ${MAX_EVIDENCE_FILE_BYTES / (1024 * 1024)} MB.` };
  }

  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return { field: "file", message: `Unsupported file type (${file.type || "unknown"}). Use PDF, DOCX, or common images.` };
  }

  return null;
}

/** Validates consent — evidence must never be submitted without user consent. */
export function validateEvidenceConsent(consent: boolean): EvidenceValidationError | null {
  if (!consent) {
    return { field: "consent", message: "You must agree to let Patorbit use this document for verification." };
  }
  return null;
}

/** The root validator for the whole evidence entry — a single call the modal
 * uses to decide whether submit is allowed. Returns the first error, or null. */
export function validateEvidenceEntry(input: {
  kind: EvidenceKind | null;
  link: string;
  file: File | null;
  consent: boolean;
}): EvidenceValidationError | null {
  return (
    validateEvidenceKind(input.kind) ??
    validateEvidenceLink(input.link, input.kind) ??
    validateEvidenceFile(input.file, input.kind) ??
    validateEvidenceConsent(input.consent)
  );
}

/** Whether the current transport for a kind is a link (drives the URL input). */
export function isLinkKind(kind: EvidenceKind | null): kind is EvidenceKind {
  return !!kind && kindToTransport(kind) === "link";
}

/** Explicit type re-export for ergonomic imports. */
export type { EvidenceType, EvidenceKind };