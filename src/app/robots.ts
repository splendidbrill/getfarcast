import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/playbook/"],
    },
    sitemap: "https://getfarcast.com/sitemap.xml",
  };
}
