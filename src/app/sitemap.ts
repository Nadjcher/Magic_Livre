import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/appUrl";
import { THEMES } from "@/lib/themes";
import { AGE_GROUPS } from "@/lib/ageGroups";

/**
 * Plan du site pour les moteurs de recherche. On n'y liste que les pages
 * publiques et indexables ; les espaces privés (création, bibliothèque,
 * compte…) et les pages transitoires (réinitialisation, vérification) en
 * sont volontairement exclus.
 */
const BASE_URL = getAppUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, freq: "weekly" },
    { path: "/catalogue", priority: 0.9, freq: "weekly" },
    { path: "/club", priority: 0.9, freq: "weekly" },
    { path: "/avis", priority: 0.7, freq: "weekly" },
    { path: "/demo", priority: 0.8, freq: "monthly" },
    { path: "/connexion", priority: 0.5, freq: "yearly" },
    { path: "/inscription", priority: 0.5, freq: "yearly" },
    { path: "/mentions-legales", priority: 0.2, freq: "yearly" },
    { path: "/cgu", priority: 0.2, freq: "yearly" },
    { path: "/cgv", priority: 0.2, freq: "yearly" },
    { path: "/confidentialite", priority: 0.2, freq: "yearly" },
  ];

  for (const t of THEMES) pages.push({ path: `/catalogue/${t.id}`, priority: 0.8, freq: "monthly" });
  for (const g of AGE_GROUPS) pages.push({ path: `/livre-personnalise/${g.slug}`, priority: 0.8, freq: "monthly" });

  return pages.map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
