import { z } from "zod";
import { ResumeSchema } from "@/utils/resume-schema";

/**
 * The canonical resume document stored in `Resume.payload` (ADR-003).
 *
 * The existing `ResumeSchema` remains the validation core; `styleConfigs` is an
 * additive, optional field so the store's per-resume style slice can round-trip
 * losslessly. This module is intentionally client-safe (zod + resume-schema
 * only) so both the server service and the client-side parity engine share ONE
 * canonical normalization — no second, incompatible schema.
 */
export const ResumePayloadSchema = ResumeSchema.extend({
  styleConfigs: z.record(z.string(), z.unknown()).default({}),
});

export type ResumePayload = z.infer<typeof ResumePayloadSchema>;
