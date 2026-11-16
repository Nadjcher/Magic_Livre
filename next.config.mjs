/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le site n'utilise pas next/image : on coupe l'optimiseur d'images (surface
  // d'attaque inutile, plusieurs failles connues sur Next 14).
  images: { unoptimized: true },
  reactStrictMode: true,
  // @react-pdf/renderer doit être traité comme un paquet externe côté serveur
  // afin d'éviter des erreurs de regroupement (bundling) dans les routes API.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Polices du livre PDF, lues sur disque au moment du rendu.
  outputFileTracingIncludes: {
    "/api/books/[id]/pdf": ["./src/pdf-assets/**"],
    // Jeu d'épreuve de la relectrice d'images (images aux défauts connus).
    "/api/admin/epreuve": ["./src/epreuve/**"],
  },
  experimental: {
    // Revenir sur une page déjà vue dans les 30 dernières secondes est instantané.
    staleTimes: { dynamic: 30 },
    // La création de livre peut recevoir une photo (redimensionnée) en data URL.
    serverActions: { bodySizeLimit: "4mb" },
  },
  // En-têtes de sécurité appliqués à toutes les réponses.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Politique de contenu prudente : interdit l'intégration du site dans un
          // autre site, les plugins, la modification de l'adresse de base, et
          // n'autorise l'envoi de formulaires que vers le site et Stripe.
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; upgrade-insecure-requests",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
