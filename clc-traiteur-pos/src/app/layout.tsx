import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C.LC. Traiteur — POS",
  description: "Système de gestion des devis et événements traiteur",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
    <html lang="fr" className="h-full">
      <body className="min-h-[100dvh] flex flex-col">{children}</body>
    </html>
  );
}
