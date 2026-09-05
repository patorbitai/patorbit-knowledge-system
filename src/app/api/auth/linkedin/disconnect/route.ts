"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: "linkedin",
      },
    });

    return NextResponse.json({ success: true, provider: "linkedin" }, { status: 200 });
  } catch (err: unknown) {
    console.error("[linkedin-disconnect] error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect LinkedIn. Please try again." },
      { status: 500 }
    );
  }
}
