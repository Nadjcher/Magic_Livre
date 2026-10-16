/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer doit être traité comme un paquet externe côté serveur
  // afin d'éviter des erreurs de regroupement (bundling) dans les routes API.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
