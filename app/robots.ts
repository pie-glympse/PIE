import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://glyms-app.fr";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/office/", "/settings", "/profile", "/notifications"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
