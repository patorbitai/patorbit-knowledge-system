import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days hard limit — inactivity logout handled client-side
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────
    // C55.2: Only enabled when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // ── GitHub OAuth ──────────────────────────────────────────────
    // C55.2: Only enabled when GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set.
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),

    // ── Email/Password (always available) ─────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
        } catch {
          return null;
        }

        if (!user) {
          return null;
        }

        let passwordMatch;
        try {
          passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
        } catch {
          return null;
        }

        if (!passwordMatch) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email address before signing in.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    // C55.2/C55.2.1: Handle OAuth sign-in — create user or link account safely.
    // SECURITY: We do NOT automatically link OAuth to existing password accounts.
    // This prevents account takeover via email spoofing on providers with weak
    // email verification (e.g., GitHub noreply addresses).
    async signIn({ user, account }) {
      if (!account?.provider || account.provider === "credentials" || !user?.email) {
        return true;
      }

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Check if this specific OAuth account is already linked
          const alreadyLinked = existingUser.accounts.some(
            (a) => a.provider === account.provider && a.providerAccountId === account.providerAccountId
          );

          if (alreadyLinked) {
            // Returning OAuth user — safe to proceed
            user.id = existingUser.id;
            return true;
          }

          // Check if the existing account has a password (was created via email/password)
          const hasPassword = existingUser.passwordHash && existingUser.passwordHash.length > 0;

          if (hasPassword) {
            // SECURITY: Do NOT automatically link OAuth to a password account.
            // The user must sign in with email/password, then link OAuth from Settings.
            console.warn(
              `[auth] Blocked OAuth link: ${account.provider} email ${user.email} matches existing password account. ` +
              `User must sign in with email/password and link from Settings.`
            );
            return false;
          }

          // Existing OAuth-only account (no password) — safe to link new provider
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state: account.session_state ?? null,
            },
          });

          user.id = existingUser.id;
          return true;
        }

        // Brand-new user — create account via Prisma nested create
        const name = user.name || user.email.split("@")[0];
        const newUser = await prisma.user.create({
          data: {
            name,
            email: user.email,
            emailVerified: new Date(), // OAuth emails are considered verified
            passwordHash: "", // No password for OAuth-only users
            accounts: {
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ?? null,
              },
            },
          },
        });

        user.id = newUser.id;
        return true;
      } catch (err) {
        console.error("[auth] OAuth sign-in error:", err);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
