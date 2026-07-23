import type { MetadataRoute } from "next";

// Robots: permite indexar las páginas públicas (marketing, catálogo, legales) y
// bloquea las zonas privadas del app (dashboard, reservas, chat, API, etc.).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/bookings",
        "/booking",
        "/chat",
        "/profile",
        "/notifications",
        "/mis-tickets",
        "/tickets",
        "/coupons",
        "/bookmarks",
        "/calendario",
        "/estadisticas",
        "/onboarding",
        "/quejas",
        "/tutorial",
        "/auth/",
        "/login",
        "/register",
        "/forgot-password",
      ],
    },
    sitemap: "https://piums.io/sitemap.xml",
    host: "https://piums.io",
  };
}
