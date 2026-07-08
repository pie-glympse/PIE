import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://glyms-app.fr";
  const routes = [
    "",
    "/login",
    "/register",
    "/pricing",
    "/contact-us",
    "/greetings",
    "/forgot-password",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
