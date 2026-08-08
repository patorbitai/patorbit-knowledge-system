import type { Metadata } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  Playfair_Display,
  EB_Garamond,
  JetBrains_Mono,
} from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import { DeploymentUpdateBanner } from "@/components/common/DeploymentUpdateBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

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
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${playfairDisplay.variable} ${ebGaramond.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
        <DeploymentUpdateBanner />
      </body>
    </html>
  );
}
