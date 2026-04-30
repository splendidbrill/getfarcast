import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// export const metadata: Metadata = {
//   metadataBase: new URL("https://www.getfarcast.com"),
//   title: "GetFarcast — AI-Powered Growth Engine for Founders",
//   description:
//     "Tell us what you built. Get a complete distribution playbook — ICP profiling, channel strategy, ready-to-post content, and cold outreach sequences. Built for founders who ship fast but need users.",
//   keywords: [
//     "growth engine",
//     "vibe marketing",
//     "startup distribution",
//     "ICP profiling",
//     "content marketing AI",
//     "founder marketing tool",
//   ],
//   alternates: {
//     canonical: "/",
//   },
//   openGraph: {
//     title: "GetFarcast — AI-Powered Growth Engine for Founders",
//     description:
//       "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
//     siteName: "GetFarcast",
//     type: "website",
//     url: "/",
//     images: [
//       {
//         url: "/opengraph-image",
//         width: 1200,
//         height: 630,
//         alt: "GetFarcast homepage preview",
//       },
//     ],
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "GetFarcast — AI-Powered Growth Engine for Founders",
//     description:
//       "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
//     images: ["/twitter-image"],
//   },
// };


export const metadata: Metadata = {
  metadataBase: new URL("https://www.getfarcast.com"),
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GetFarcast — AI-Powered Growth Engine for Founders",
    description:
      "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
    siteName: "GetFarcast",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GetFarcast homepage preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GetFarcast — AI-Powered Growth Engine for Founders",
    description:
      "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
    images: ["/opengraph-image"],
  },
};

import { GoogleAnalytics } from "@next/third-parties/google";

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
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}