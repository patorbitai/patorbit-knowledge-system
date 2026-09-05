import type { Metadata } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  Playfair_Display,
  EB_Garamond,
  JetBrains_Mono,
} from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { InactivityProvider } from "@/components/providers/InactivityProvider";
import { InactivityWarning } from "@/components/providers/InactivityWarning";
import { DeploymentUpdateBanner } from "@/components/common/DeploymentUpdateBanner";
import { ToastProvider } from "@/components/common/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: {
    default: "Patorbit — Build Better Resumes. Build Your Professional Identity.",
    template: "%s | Patorbit",
  },
  description:
    "Create your Professional Identity once, then build multiple resumes and tailor each one to the job — without inventing experience. AI-assisted, truthful, user-controlled.",
  metadataBase: new URL("https://www.patorbit.com"),
  openGraph: {
    siteName: "Patorbit",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable} ${playfairDisplay.variable} ${ebGaramond.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem("patorbit-theme") || "dark";
                document.documentElement.classList.add(theme);
              } catch (e) {
                document.documentElement.classList.add("dark");
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>
              <InactivityProvider>
                {children}
                <InactivityWarning />
              </InactivityProvider>
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
        <DeploymentUpdateBanner />
      </body>
    </html>
  );
}
