import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { INITIAL_LOADER_BOOTSTRAP } from "@/lib/initial-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const description = "Student. Creator. Explorer. Notes, films, and useful things from Xing.";
  return {
    metadataBase: base,
    title: { default: "XING — Personal Hub", template: "%s — XING" },
    description,
    icons: { icon: "/og.png", shortcut: "/og.png" },
    openGraph: { title: "XING — Personal Hub", description, type: "website", images: [{ url: new URL("/og.png", base).toString(), width: 1732, height: 908, alt: "XING — Student. Creator. Explorer." }] },
    twitter: { card: "summary_large_image", title: "XING — Personal Hub", description, images: [new URL("/og.png", base).toString()] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: INITIAL_LOADER_BOOTSTRAP }} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
