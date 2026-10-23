import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import MagicParticles from "@/components/MagicParticles";
import TiltProvider from "@/components/TiltProvider";

// Fraunces : serif de conte, caractérielle (titres). Nunito : ronde et
// chaleureuse (texte/UI). Chargées sans FOUT via next/font.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const APP_URL = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DESCRIPTION =
  "Créez en une minute un livre illustré personnalisé pour votre enfant : son prénom, " +
  "un héros original et une histoire douce à lire ensemble. PDF à imprimer dès 4,99 €, sans abonnement.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Mon Livre Magique · Livres personnalisés pour enfants",
    template: "%s · Mon Livre Magique",
  },
  description: DESCRIPTION,
  applicationName: "Mon Livre Magique",
  category: "family",
  keywords: [
    "livre personnalisé enfant",
    "histoire personnalisée prénom",
    "conte pour enfant",
    "livre illustré enfant",
    "cadeau personnalisé enfant",
    "histoire du soir",
    "livre à imprimer enfant",
  ],
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "Mon Livre Magique",
    title: "Mon Livre Magique · Livres personnalisés pour enfants",
    description: DESCRIPTION,
    // L'image est fournie par src/app/opengraph-image.tsx (générée à la volée).
  },
  twitter: {
    card: "summary_large_image",
    title: "Mon Livre Magique · Livres personnalisés pour enfants",
    description: DESCRIPTION,
    // L'image est fournie par src/app/twitter-image.tsx.
  },
};

export const viewport = {
  themeColor: "#1b1544",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <MagicParticles />
        <TiltProvider />
        <Header />
        <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="relative z-10 mt-8 bg-nuit px-4 py-8 text-sm text-[#b7aee0]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-5">
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:text-white">
              CGU
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
            <span className="text-[#8278b8]">© {new Date().getFullYear()} Mon Livre Magique</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
