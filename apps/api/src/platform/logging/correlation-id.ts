import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

export const CORRELATION_ID_HEADER = "x-correlation-id";

const VALID_CORRELATION_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function resolveCorrelationId(
  request: IncomingMessage,
  response: ServerResponse,
): string {
  const header = request.headers[CORRELATION_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  const correlationId =
    typeof value === "string" && VALID_CORRELATION_ID.test(value)
      ? value
      : randomUUID();

  response.setHeader(CORRELATION_ID_HEADER, correlationId);
  return correlationId;
}
