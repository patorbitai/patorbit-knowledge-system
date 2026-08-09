"use strict";

/**
 * Phase 0 + Phase 1 builder.
 *
 * Phase 0 — buildDocumentRecord:
 *   Turns the ordered extracted document text into a DocumentRecord that keeps
 *   page, line number and (when supplied) column per line. Columns are passed
 *   in as optional parallel arrays per page; text is split deterministically
 *   and layout produced by src/utils/pdf-extract.ts is never discarded.
 *
 * Phase 1 — buildDocumentBlocks:
 *   Groups lines into DocumentBlocks by detecting section headings with pure
 *   rules (sections.ts). The first line of a document always opens the
 *   preamble block (name/contact/header) so an all-caps name like "JANE DOE"
 *   is never mistaken for a section heading. Lines before the first heading
 *   form that preamble; anything unrecognised maps to "custom". The source
 *   order of all lines is preserved and nothing is dropped.
 */

import type {
  DocumentBlock,
  DocumentLine,
  DocumentPage,
  DocumentRecord,
  DocumentSource,
  DocumentSourceType,
  SectionKind,
} from "./types";
import { detectSectionKind, normalizeSectionTitle } from "./sections";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s]+/i;
const SOCIAL_RE = /linkedin\.com\/|github\.com\/|@[\w.-]+/i;

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(h, 31) + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function blockId(page: number, startLine: number): string {
  return `blk_${page}_${startLine}`;
}

/** Split one page's extracted text into trimmed non-empty lines. */
function splitPageLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** True when the raw line carries contact-style content (email/phone/URL/social). */
function isContactLike(line: string): boolean {
  return (
    EMAIL_RE.test(line) ||
    PHONE_RE.test(line) ||
    URL_RE.test(line) ||
    SOCIAL_RE.test(line)
  );
}

export interface BuildDocumentRecordOptions {
  fileName?: string;
  importedAt?: string;
  sourceType?: DocumentSourceType;
  /** Optional parallel array per page: the column of each parsed line. */
  columns?: number[][];
}

/**
 * Build a DocumentRecord preserving page + line + column + raw text. The record
 * id is deterministic from the page texts so identical extractions are stable.
 */
export function buildDocumentRecord(
  pageTexts: string[],
  options: BuildDocumentRecordOptions = {},
): DocumentRecord {
  const source: DocumentSource = {
    type: options.sourceType ?? "text",
    ...(options.fileName ? { fileName: options.fileName } : {}),
    ...(options.importedAt ? { importedAt: options.importedAt } : {}),
  };

  const pages: DocumentPage[] = [];
  const lines: DocumentLine[] = [];

  for (let p = 0; p < pageTexts.length; p++) {
    const pageLines: DocumentLine[] = [];
    const cols = options.columns?.[p];
    const rawLines = splitPageLines(pageTexts[p]);
    for (let i = 0; i < rawLines.length; i++) {
      const line: DocumentLine = {
        lno: lines.length + 1,
        page: p + 1,
        raw: rawLines[i],
        ...(cols && cols[i] != null ? { column: cols[i] } : {}),
      };
      lines.push(line);
      pageLines.push(line);
    }
    pages.push({ page: p + 1, lines: pageLines });
  }

  const blocks = buildDocumentBlocks(lines);

  return {
    id: `doc_${hashString(pageTexts.join("\n"))}`,
    source,
    pages,
    lines,
    blocks,
  };
}

/**
 * Group document lines into sections by heading. The very first line of a
 * document always starts the preamble (name/contact) so an all-caps name is
 * not treated as a "custom" heading. Later headings open new blocks; leftover
 * lines are kept verbatim as custom.
 */
export function buildDocumentBlocks(lines: DocumentLine[]): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  let current: (DocumentBlock & { fromHeading?: boolean }) | null = null;
  // Lines collected before the first detected heading. They are flushed as
  // name + contact blocks once that heading appears (or at end of input).
  let preamble: DocumentLine[] = [];

  const makeSimpleBlock = (
    blines: DocumentLine[],
    kind: SectionKind,
  ): DocumentBlock | null => {
    if (blines.length === 0) return null;
    const first = blines[0];
    return {
      id: blockId(first.page, first.lno),
      kind,
      title: first.raw,
      lines: [...blines],
      page: first.page,
      startLine: first.lno,
      endLine: blines[blines.length - 1].lno,
      // Name/contact are guesses (a one-liner could also be a summary line).
      confidence: 0.7,
      uncertain: true,
    };
  };

  const flushPreamble = () => {
    if (preamble.length === 0) return;

    const nameLines: DocumentLine[] = [];
    const contactLines: DocumentLine[] = [];
    let contactStarted = false;

    for (const pl of preamble) {
      const isContact = isContactLike(pl.raw);
      if (isContact && !contactStarted) contactStarted = true;
      (contactStarted ? contactLines : nameLines).push(pl);
    }

    // When contact lines appear first with no name line at all, prefer a
    // name block for the first line and fold the rest into contact, keeping
    // the invariant that a document begins with a name/contact block.
    if (nameLines.length === 0) {
      const [firstLine, ...rest] = contactLines;
      nameLines.push(firstLine);
      contactLines.splice(0, contactLines.length, ...rest);
    }

    const nameBlock = makeSimpleBlock(nameLines, "name");
    if (nameBlock) blocks.push(nameBlock);
    if (contactLines.length > 0) {
      const contact = makeSimpleBlock(contactLines, "contact");
      if (contact) blocks.push(contact);
    }

    preamble = [];
  };

  const close = () => {
    if (!current) return;
    current.endLine = current.lines[current.lines.length - 1].lno;
    delete (current as { fromHeading?: boolean }).fromHeading;
    blocks.push(current as DocumentBlock);
    current = null;
  };

  let first = true;
  for (const line of lines) {
    const kind = first ? null : detectSectionKind(line.raw);
    first = false;

    if (kind !== null) {
      flushPreamble();
      close();
      current = {
        id: blockId(line.page, line.lno),
        kind,
        title: normalizeSectionTitle(line.raw),
        lines: [line],
        page: line.page,
        startLine: line.lno,
        endLine: line.lno,
        confidence: kind === "custom" ? 0.3 : 1,
        uncertain: kind === "custom",
        fromHeading: true,
      };
      continue;
    }

    // Body line → current block, or queue into the pre-heading preamble.
    if (current) {
      current.lines.push(line);
      current.endLine = line.lno;
    } else {
      preamble.push(line);
    }
  }

  flushPreamble();
  close();
  return blocks;
}