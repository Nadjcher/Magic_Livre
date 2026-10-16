import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Mon Livre Magique",
  description:
    "Créez des livres illustrés personnalisés pour vos enfants, en français, avec des héros originaux.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col font-conte">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-black/5 bg-white/60 px-4 py-6 text-center text-sm text-magique-texteClair">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4">
            <Link href="/mentions-legales" className="hover:underline">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:underline">
              CGU
            </Link>
            <Link href="/confidentialite" className="hover:underline">
              Confidentialité
            </Link>
            <span>© {new Date().getFullYear()} Mon Livre Magique</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
