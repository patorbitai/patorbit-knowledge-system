"use strict";

/**
 * Deterministic Document Model — Phase 0/1 foundation.
 *
 * A DocumentRecord is the ordered, geometry-preserving representation of an
 * extracted document (PDF/DOCX/text). It keeps every non-empty line with its
 * page number, line number, raw text and optional column so no layout
 * information produced by pdf-extract is discarded.
 *
 * DocumentBlock is the Phase 1 unit of section detection. Blocks are built
 * purely from deterministic rules; nothing is inferred with AI and unknown
 * sections are preserved as `custom` so no content is ever silently dropped.
 */

export type DocumentSourceType = "pdf" | "docx" | "json" | "text";

export interface DocumentSource {
  type: DocumentSourceType;
  fileName?: string;
  importedAt?: string;
}

export interface DocumentLine {
  /** 1-based line number across the whole document. */
  lno: number;
  /** The raw line text, verbatim. */
  raw: string;
  /** 1-based page number. */
  page: number;
  /** 0-based column index, when the extractor reports columns. */
  column?: number;
  /** Human-readability: pages group lines. */
}

export interface DocumentPage {
  page: number;
  lines: DocumentLine[];
}

/** Canonical, template-independent section vocabulary, plus `custom`. */
export type SectionKind =
  | "name"
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "achievements"
  | "interests"
  | "references"
  | "portfolio"
  | "custom";

/**
 * A contiguous run of document lines starting at a detected section heading
 * (or the preamble before the first heading, classified as name/contact).
 */
export interface DocumentBlock {
  /** Deterministic id: `blk_<page>_<startLno>`. */
  id: string;
  kind: SectionKind;
  /** Original heading text verbatim (pre-preamble blocks use first line). */
  title: string;
  /** Verbatim lines belonging to this block, in source order. */
  lines: DocumentLine[];
  page: number;
  startLine: number;
  endLine: number;
  /** Deterministic 0–1 confidence of the section classification. */
  confidence: number;
  /** True when the classification is uncertain (always for `custom`). */
  uncertain: boolean;
}

export interface DocumentRecord {
  id: string;
  source: DocumentSource;
  pages: DocumentPage[];
  lines: DocumentLine[];
  blocks: DocumentBlock[];
}