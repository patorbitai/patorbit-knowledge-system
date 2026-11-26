"use strict";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { accessTokenFor, searchMailbox, type MailProvider } from "@/lib/interview/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ provider: string }>;
}

const searchSchema = z.object({
  query: z.string().trim().min(2).max(200),
});

/** POST — user-initiated mailbox search. Never runs in the background. */
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { provider: raw } = await context.params;
  const provider = raw as MailProvider;
  if (provider !== "google" && provider !== "microsoft") {
    return NextResponse.json({ error: "UNKNOWN_PROVIDER" }, { status: 400 });
  }

  try {
    const { query } = searchSchema.parse(await req.json());
    const session = await accessTokenFor(auth.caller.identityId, provider);
    if (!session) {
      return NextResponse.json(
        { error: "NOT_CONNECTED", message: "Connect this mailbox first." },
        { status: 409 },
      );
    }

    const messages = await searchMailbox(provider, session.token, query);
    return NextResponse.json({ messages }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "mailbox/search:POST");
  }
}
