import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

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
  title: "Farcast - AI Growth Co-Founder for micro SaaS teams",
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
    title: "Farcast - AI Growth Co-Founder for micro SaaS teams",
    description:
      "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
    siteName: "GetFarcast",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Farcast - AI Growth Co-Founder for micro SaaS teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farcast - AI Growth Co-Founder for micro SaaS teams",
    description:
      "Your product is built. Now get users. GetFarcast generates a complete growth playbook tailored to your product and audience.",
    images: ["/og-image.png"],
  },
};

import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";
import YandexMetrica from "@/components/YandexMetrica";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
      {process.env.NEXT_PUBLIC_YANDEX_METRICA_ID && (
        <Suspense fallback={null}>
          <YandexMetrica yandexMetricaId={process.env.NEXT_PUBLIC_YANDEX_METRICA_ID} />
        </Suspense>
      )}
    </html>
  );
}