import type { MetadataRoute } from "next";

const BASE = "https://piums.io";

// Sitemap de las páginas públicas indexables. Los perfiles de artista y servicios
// individuales NO se incluyen todavía: hoy son client components sin metadata propia
// (mal indexables). Cuando se hagan server-render con generateMetadata por artista,
// se pueden agregar aquí dinámicamente desde el backend.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/buscar-artistas", priority: 0.9, changeFrequency: "daily" },
    { path: "/categorias", priority: 0.9, changeFrequency: "weekly" },
    { path: "/servicios", priority: 0.8, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/nosotros", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contacto", priority: 0.6, changeFrequency: "monthly" },
    { path: "/ayuda", priority: 0.5, changeFrequency: "monthly" },
    { path: "/terminos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacidad", priority: 0.3, changeFrequency: "yearly" },
    { path: "/reclamos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/automatizacion", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
