import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Venus",
  description: "Movies & TV shows, on us.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isTvEmbed = pathname.startsWith("/tv-embed");

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {!isTvEmbed && <Header />}
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
