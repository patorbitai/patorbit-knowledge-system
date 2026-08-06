import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Auth pages — redirect to overview if already authenticated
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return NextResponse.redirect(new URL("/overview", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = [
    "/overview",
    "/resume",
    "/passport",
    "/trust",
    "/ai",
    "/network",
    "/settings",
    "/resume-builder",
  ];

  const isProtected = protectedPaths.some((p) =>
    pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/resume/:path*",
    "/passport/:path*",
    "/trust/:path*",
    "/ai/:path*",
    "/network/:path*",
    "/settings/:path*",
    "/resume-builder/:path*",
    "/login",
    "/register",
  ],
};
