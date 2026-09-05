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
        provider: "github",
      },
    });

    return NextResponse.json({ success: true, provider: "github" }, { status: 200 });
  } catch (err: unknown) {
    console.error("[github-disconnect] error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect GitHub. Please try again." },
      { status: 500 }
    );
  }
}
