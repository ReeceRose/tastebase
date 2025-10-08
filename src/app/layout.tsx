// BetterAuth will be configured here
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/lib/config/env";
import { Theme } from "@/lib/types";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.BETTER_AUTH_URL),
  title:
    "Tastebase - Your Personal Recipe Collection | AI-Powered Recipe Management",
  description:
    "Organize your recipes with AI-powered import, beautiful UI, and seamless organization. Perfect for cooking enthusiasts who want to collect and manage recipes in one place.",
  keywords: [
    "Tastebase",
    "recipe management",
    "cooking",
    "recipes",
    "AI recipe import",
    "recipe collection",
    "cooking app",
    "recipe organizer",
  ],
  authors: [{ name: "Tastebase" }],
  creator: "Tastebase",
  publisher: "Tastebase",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tastebase.app",
    title: "Tastebase - Your Personal Recipe Collection",
    description:
      "Organize your recipes with AI-powered import, beautiful UI, and seamless organization.",
    siteName: "Tastebase",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tastebase - AI-Powered Recipe Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tastebase - Your Personal Recipe Collection",
    description:
      "Organize your recipes with AI-powered import, beautiful UI, and seamless organization.",
    creator: "@tastebase",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme={Theme.SYSTEM} storageKey="ui-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
