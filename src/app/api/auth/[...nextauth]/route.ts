import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("[auth-route] loading /api/auth/[...nextauth] handler");

let handler: ReturnType<typeof NextAuth>;
try {
  handler = NextAuth(authOptions);
  console.log("[auth-route] NextAuth handler created successfully");
} catch (err) {
  console.error("[auth-route] NextAuth() threw during initialization:", err);
  throw err;
}

export { handler as GET, handler as POST };
