import type { MetadataRoute } from "next";

/**
 * Plan du site pour les moteurs de recherche. On n'y liste que les pages
 * publiques et indexables ; les espaces privés (création, bibliothèque,
 * compte…) et les pages transitoires (réinitialisation, vérification) en
 * sont volontairement exclus.
 */
const BASE_URL = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, freq: "weekly" },
    { path: "/demo", priority: 0.8, freq: "monthly" },
    { path: "/connexion", priority: 0.5, freq: "yearly" },
    { path: "/inscription", priority: 0.5, freq: "yearly" },
    { path: "/mentions-legales", priority: 0.2, freq: "yearly" },
    { path: "/cgu", priority: 0.2, freq: "yearly" },
    { path: "/confidentialite", priority: 0.2, freq: "yearly" },
  ];

  return pages.map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
