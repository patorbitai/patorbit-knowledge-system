import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import { DeploymentUpdateBanner } from "@/components/common/DeploymentUpdateBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Patorbit — Verified Professional Identity",
  description:
    "Build, prove, and share your professional identity. AI-powered resume intelligence, credential verification, and trust scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
        <DeploymentUpdateBanner />
      </body>
    </html>
  );
}
