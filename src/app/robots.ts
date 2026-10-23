import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/appUrl";

/**
 * Règles d'indexation. On autorise le public mais on protège les espaces
 * privés et les routes techniques, qui n'ont rien à faire dans un index.
 */
const BASE_URL = getAppUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/creer",
        "/bibliotheque",
        "/enfants",
        "/compte",
        "/reinitialiser",
        "/verifier-email",
        "/mot-de-passe-oublie",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
