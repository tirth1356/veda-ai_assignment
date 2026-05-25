import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppInitializer from "../components/AppInitializer";
import AppLayoutClient from "../components/AppLayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VedaAI - AI Assessment Creator",
  description: "Create structured exam question papers using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-gray-100 text-gray-900 font-sans min-h-screen flex">
        <AppInitializer>
          <AppLayoutClient>{children}</AppLayoutClient>
        </AppInitializer>
      </body>
    </html>
  );
}

