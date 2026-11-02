import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte Storilou gratuitement et lisez le premier livre de votre enfant avant tout achat.",
  alternates: { canonical: "/inscription" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
