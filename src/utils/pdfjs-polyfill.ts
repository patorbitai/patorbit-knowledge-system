"use strict";

/**
 * pdfjs-dist v5 reads `new DOMMatrix()` and similar at module top level, and
 * relies on DOM globals (`DOMMatrix`, `DOMPoint`, `DOMRect`, `Path2D`,
 * `ImageData`) that do not exist in Node. Its built-in fallback tries to load
 * `@napi-rs/canvas` via `createRequire`, which fails when Turbopack externalises
 * the package. Since `@napi-rs/canvas` is already a dependency it ships all of
 * these globals over the same geometry interface, so install them upfront.
 *
 * Import this module *before* `import("pdfjs-dist/legacy/build/pdf.mjs")`.
 */

import { DOMMatrix, DOMPoint, DOMRect, Path2D, ImageData } from "@napi-rs/canvas";

const globalTarget = globalThis as unknown as Record<string, unknown>;

if (typeof globalTarget.DOMMatrix === "undefined") {
  globalTarget.DOMMatrix = DOMMatrix;
}
if (typeof globalTarget.DOMPoint === "undefined") {
  globalTarget.DOMPoint = DOMPoint;
}
if (typeof globalTarget.DOMRect === "undefined") {
  globalTarget.DOMRect = DOMRect;
}
if (typeof globalTarget.Path2D === "undefined") {
  globalTarget.Path2D = Path2D;
}
if (typeof globalTarget.ImageData === "undefined") {
  globalTarget.ImageData = ImageData;
}