/**
 * Server-side parsing of imported email/document files.
 *
 * Supported: .txt, .eml, .pdf, .docx. `.msg` is intentionally rejected — there
 * is no dependable parser in this project's dependency set, and pretending to
 * read it would be worse than asking the user to export it.
 */
import { MAX_UPLOAD_BYTES } from "./constants";

export class UnsupportedFileError extends Error {}
export class FileTooLargeError extends Error {}

export interface ParsedDocument {
  text: string;
  kind: "txt" | "eml" | "pdf" | "docx";
  subject?: string;
  sender?: string;
}

const ALLOWED_EXTENSIONS = new Set(["txt", "eml", "pdf", "docx"]);

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

/** Magic-byte validation — an extension alone is never trusted. */
function assertSignature(kind: string, bytes: Buffer): void {
  if (kind === "pdf") {
    if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new UnsupportedFileError("That file is not a valid PDF.");
    }
  }
  if (kind === "docx") {
    // DOCX is a ZIP container.
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new UnsupportedFileError("That file is not a valid .docx document.");
    }
  }
  if ((kind === "txt" || kind === "eml") && bytes.includes(0)) {
    throw new UnsupportedFileError("That file is not readable text.");
  }
}

/** Pull Subject/From headers out of a raw .eml message. */
function parseEmlHeaders(raw: string): { subject?: string; sender?: string; body: string } {
  const split = raw.split(/\r?\n\r?\n/);
  const headers = split[0] ?? "";
  const body = split.slice(1).join("\n\n");
  const header = (name: string) => {
    const match = headers.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
    return match?.[1]?.trim();
  };
  return { subject: header("Subject"), sender: header("From"), body: body || raw };
}

export async function parseUploadedFile(
  filename: string,
  bytes: Buffer,
): Promise<ParsedDocument> {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new FileTooLargeError("Files must be 8 MB or smaller.");
  }
  const kind = extensionOf(filename);
  if (kind === "msg") {
    throw new UnsupportedFileError(
      "Outlook .msg files are not supported yet. Save the invitation as .eml, .pdf or .txt and upload that instead.",
    );
  }
  if (!ALLOWED_EXTENSIONS.has(kind)) {
    throw new UnsupportedFileError(
      "Unsupported file type. Upload a .txt, .eml, .pdf or .docx file.",
    );
  }

  assertSignature(kind, bytes);

  if (kind === "txt" || kind === "eml") {
    const raw = bytes.toString("utf8");
    if (kind === "eml") {
      const parsed = parseEmlHeaders(raw);
      return { kind: "eml", text: parsed.body, subject: parsed.subject, sender: parsed.sender };
    }
    return { kind: "txt", text: raw };
  }

  if (kind === "pdf") {
    const { PDFParse } = (await import("pdf-parse")) as unknown as {
      PDFParse: new (options: { data: Uint8Array }) => { getText: () => Promise<{ text: string }> };
    };
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    const result = await parser.getText();
    return { kind: "pdf", text: result.text ?? "" };
  }

  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: bytes });
  return { kind: "docx", text: result.value ?? "" };
}
