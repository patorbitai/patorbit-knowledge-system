"use strict";

/**
 * Document Understanding foundation — public API.
 *
 * Deterministic only: the DocumentRecord preserves page/line/column/raw text
 * from the extraction layer, and DocumentBlock detection is rule-based. No AI,
 * no template assumptions, nothing silently dropped.
 */

export { buildDocumentRecord, buildDocumentBlocks } from "./build";
export type { BuildDocumentRecordOptions } from "./build";
export { detectSectionKind, normalizeSectionTitle } from "./sections";
export type {
  DocumentBlock,
  DocumentLine,
  DocumentPage,
  DocumentRecord,
  DocumentSource,
  DocumentSourceType,
  SectionKind,
} from "./types";