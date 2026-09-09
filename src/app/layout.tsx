import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#0f172a", viewportFit: "cover", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: { default: "PlayVth – Book sports venues, join games, find coaches", template: "%s | PlayVth" },
  description: "Book badminton courts, football turfs and more near you. Join games with players of your level. Find coaches.",
  appleWebApp: { capable: true, title: "PlayVth", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
