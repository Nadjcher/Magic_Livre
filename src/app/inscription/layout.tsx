import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte",
  robots: { index: false, follow: true },
  description: "Créez votre compte Encore une histoire gratuitement et lisez le premier livre de votre enfant avant tout achat.",
  alternates: { canonical: "/inscription" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
