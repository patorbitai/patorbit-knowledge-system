import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] authorize() called, email:", credentials?.email ?? "MISSING");

        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] authorize() early return: missing credentials");
          return null;
        }

        let user;
        try {
          console.log("[auth] querying prisma for user:", credentials.email);
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          console.log("[auth] prisma result:", user ? `found id=${user.id}` : "NOT FOUND");
        } catch (err) {
          console.error("[auth] prisma query threw:", err);
          return null;
        }

        if (!user) {
          return null;
        }

        let passwordMatch;
        try {
          console.log("[auth] calling bcrypt.compare");
          passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          console.log("[auth] bcrypt.compare result:", passwordMatch);
        } catch (err) {
          console.error("[auth] bcrypt.compare threw:", err);
          return null;
        }

        if (!passwordMatch) {
          console.log("[auth] password mismatch, returning null");
          return null;
        }

        console.log("[auth] authorize() success, returning user id:", user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("[auth] jwt callback, user present:", !!user);
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[auth] session callback, token.userId:", token.userId);
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
