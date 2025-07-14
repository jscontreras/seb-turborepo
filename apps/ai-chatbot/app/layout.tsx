import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Generator",
  description: "Generate text and images with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="p-4 bg-primary text-primary-foreground">
          <div className="flex justify-between max-w-2xl mx-auto">
            <Link href="/" className="font-bold">
              AI Generator
            </Link>
            <div className="space-x-4">
              <Link href="/" className="hover:underline">
                Tools
              </Link>
              <Link href="/image-chatbot" className="hover:underline">
                Changelog
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
