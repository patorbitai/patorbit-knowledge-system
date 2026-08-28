/**
 * Normalization for the JSON resume import path (/api/import).
 *
 * The ResumeSchema treats array-item ids as opaque keys, but the resume
 * builder matches array entries by id (see the store's makeArrayHelpers), so
 * every item must carry one. Raw JSON files arrive with ids in any shape:
 * - the app's own uid() format (strings like "id_123_abc"),
 * - third-party exports (numbers, strings, or no ids at all).
 *
 * ensureItemIds preserves ids that already exist (numbers or strings) and
 * assigns sequential numeric ids only to items that are missing one.
 */
export function ensureItemIds(data: Record<string, unknown>): Record<string, unknown> {
  const arrFields = [
    "experience", "education", "skills", "projects", "certifications",
    "languages", "interests", "achievements", "references", "portfolio",
  ] as const;
  const out: Record<string, unknown> = { ...data };
  for (const field of arrFields) {
    const arr = out[field];
    if (!Array.isArray(arr)) continue;
    out[field] = arr.map((item, i) =>
      item && typeof item === "object" && "id" in (item as Record<string, unknown>)
        ? item
        : { ...(item as Record<string, unknown>), id: i + 1 },
    );
  }
  return out;
}
