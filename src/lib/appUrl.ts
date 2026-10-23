/**
 * URL publique de l'application, normalisée et SÛRE (ne jette jamais).
 *
 * Corrige les mauvaises configurations courantes de AUTH_URL :
 *  - schéma manquant ("mon-site.vercel.app" → "https://mon-site.vercel.app") ;
 *  - slash final ;
 *  - valeur vide ou invalide → repli sur localhost.
 *
 * Évite qu'un AUTH_URL mal saisi fasse planter `new URL(...)` dans le layout,
 * le sitemap, l'image OpenGraph, etc. (exception serveur sur tout le site).
 */
export function getAppUrl(): string {
  const raw = (process.env.AUTH_URL ?? "").trim();
  let url = raw.length > 0 ? raw : "http://localhost:3000";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/+$/, "");
  try {
    // Valide ; si invalide, on retombe sur une valeur sûre.
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    url = "http://localhost:3000";
  }
  return url;
}
