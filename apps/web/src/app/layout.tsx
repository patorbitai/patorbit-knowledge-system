// apps/web/src/app/layout.tsx
import { type Metadata } from "next";

import { AuthProvider } from "../lib/auth/auth-provider";

export const metadata: Metadata = {
  title: "Patorbit | Career Intelligence Platform",
  description: "The future of career development, powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
