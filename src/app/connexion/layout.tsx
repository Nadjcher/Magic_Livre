import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à Encore une histoire pour retrouver les livres personnalisés de vos enfants.",
  alternates: { canonical: "/connexion" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
