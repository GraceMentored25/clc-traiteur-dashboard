import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ThemeApplier from "@/components/ThemeApplier";
import MotionProvider from "@/components/MotionProvider";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "C.LC. Traiteur — Devis et Outils",
  description: "Système de gestion des devis et événements traiteur",
  icons: {
    icon: "/newlogo.png",
    apple: "/newlogo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`h-full ${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          </>
        ) : null}
      </head>
      <body className="min-h-[100dvh] flex flex-col">
        <ThemeApplier />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
