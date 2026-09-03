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
    // C55.2: Handle OAuth sign-in — create/find user by email, link account
    async signIn({ user, account }) {
      // For OAuth providers, ensure the user exists in the database
      if (account?.provider && account.provider !== "credentials" && user?.email) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // User exists — link the OAuth account
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            });

            if (!existingAccount) {
              // Create the account link
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
            }

            // Update the user object with the existing user's ID
            user.id = existingUser.id;
          } else {
            // New user — create account
            const name = user.name || user.email.split("@")[0];
            const newUser = await prisma.user.create({
              data: {
                name,
                email: user.email,
                emailVerified: new Date(), // OAuth emails are considered verified
                passwordHash: "", // No password for OAuth users
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
          }
        } catch (err) {
          console.error("[auth] OAuth sign-in error:", err);
          return false;
        }
      }

      return true;
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
