"use strict";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { accessTokenFor, fetchMessage, type MailProvider } from "@/lib/interview/oauth";
import { interviewEmailService } from "@/services/interview-email.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ provider: string }>;
}

const messageSchema = z.object({
  messageId: z.string().trim().min(1).max(400),
});

/**
 * POST — fetch ONE selected message and extract interview details from it.
 * Only the message the user picked is retrieved; the rest of the mailbox is
 * never read.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { provider: raw } = await context.params;
  const provider = raw as MailProvider;
  if (provider !== "google" && provider !== "microsoft") {
    return NextResponse.json({ error: "UNKNOWN_PROVIDER" }, { status: 400 });
  }

  try {
    const { messageId } = messageSchema.parse(await req.json());
    const session = await accessTokenFor(auth.caller.identityId, provider);
    if (!session) {
      return NextResponse.json(
        { error: "NOT_CONNECTED", message: "Connect this mailbox first." },
        { status: 409 },
      );
    }

    const message = await fetchMessage(provider, session.token, messageId);
    const extraction = await interviewEmailService.extract({
      content: message.body,
      subject: message.subject,
      sender: message.from,
      sourceType: provider === "google" ? "gmail" : "outlook",
    });

    return NextResponse.json(
      {
        ...extraction,
        subject: message.subject,
        sender: message.from,
        receivedAt: message.receivedAt,
      },
      { status: 200 },
    );
  } catch (err) {
    return interviewErrorResponse(err, "mailbox/message:POST");
  }
}
