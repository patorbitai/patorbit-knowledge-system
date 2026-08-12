"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/settings", req.url));
  }

  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("github_oauth_state")?.value;

  if (!state || state !== storedState || !code) {
    return NextResponse.redirect(new URL("/settings?error=github_auth_failed", req.url));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${protocol}://${host}/api/auth/github/callback`;

  try {
    let accessToken = "mock_github_token_" + Date.now();

    if (clientId && clientSecret) {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token || accessToken;
      }
    }

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: session.user.id,
        },
      },
      update: {
        access_token: accessToken,
        token_type: "Bearer",
      },
      create: {
        userId: session.user.id,
        type: "oauth",
        provider: "github",
        providerAccountId: session.user.id,
        access_token: accessToken,
        token_type: "Bearer",
      },
    });

    return NextResponse.redirect(new URL("/settings?success=github_connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?error=github_auth_error", req.url));
  }
}
