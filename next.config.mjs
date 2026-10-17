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
};

export default nextConfig;
