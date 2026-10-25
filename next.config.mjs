/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer doit être traité comme un paquet externe côté serveur
  // afin d'éviter des erreurs de regroupement (bundling) dans les routes API.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
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
