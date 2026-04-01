import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GetFarcast — AI-Powered Growth Engine for Founders",
  description:
    "Tell us what you built. Get a complete distribution playbook — ICP profiling, channel strategy, ready-to-post content, and cold outreach sequences. Built for founders who ship fast but need users.",
  keywords: [
    "growth engine",
    "vibe marketing",
    "startup distribution",
    "ICP profiling",
    "content marketing AI",
    "founder marketing tool",
  ],
  openGraph: {
    title: "GetFarcast — AI-Powered Growth Engine for Founders",
    description:
      "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
    type: "website",
    url: "https://getfarcast.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "GetFarcast — AI-Powered Growth Engine for Founders",
    description:
      "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
