import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.scss";
import NavBar from "@/components/ui/NavBar";
import SupabaseProvider from "@/components/providers/SupabaseProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VinylBox",
  description: "Manage and discover vinyl records with your personal box.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SupabaseProvider>
          <div className="app-shell">
            <NavBar />
            <main className="page">{children}</main>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
