/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer doit être traité comme un paquet externe côté serveur
  // afin d'éviter des erreurs de regroupement (bundling) dans les routes API.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    // La création de livre peut recevoir une photo (redimensionnée) en data URL.
    serverActions: { bodySizeLimit: "4mb" },
    // Polices du livre PDF, lues sur disque au moment du rendu.
    outputFileTracingIncludes: {
      "/api/books/[id]/pdf": ["./src/pdf-assets/**"],
    },
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
