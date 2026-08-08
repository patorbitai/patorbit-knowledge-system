// Non-cryptographic hash for cache fingerprinting.
// Collision probability is negligible for a few hundred distinct resume states per session.
function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(33, h) ^ s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** Produce a compact fingerprint from one or more inputs. */
export function fingerprint(...inputs: unknown[]): string {
  return djb2(inputs.map((i) => JSON.stringify(i)).join("\x00"));
}

/** Read a cached value. Returns null on miss, stale fingerprint, or any error. */
export function readCache<T>(key: string, fp: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { fp: string; data: T };
    if (entry.fp !== fp) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/** Write a value to sessionStorage. Silently no-ops when storage is unavailable or full. */
export function writeCache<T>(key: string, fp: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ fp, data }));
  } catch {
    // unavailable (SSR, private browsing quota) or quota exceeded
  }
}

export const AI_CACHE_KEYS = {
  score:    "pki_ai_score",
  bullets:  "pki_ai_bullets",
  keywords: "pki_ai_keywords",
  match:    "pki_ai_match",
} as const;
