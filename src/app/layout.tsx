import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/lib/config/env";
import { Theme } from "@/lib/types";
import "./globals.css";

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("ui-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.add(d?"dark":"light");r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.BETTER_AUTH_URL),
  title: "Tastebase - The recipes your house actually cooks",
  description:
    "A shared recipe collection for your household. Import recipes from a link, a photo or plain text, and keep notes together.",
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
    <html lang="en" className={bricolage.variable} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <ThemeProvider defaultTheme={Theme.SYSTEM} storageKey="ui-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
