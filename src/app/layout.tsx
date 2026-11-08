import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import BarreNavigation from "@/components/BarreNavigation";
import { AGE_GROUPS } from "@/lib/ageGroups";
import "./globals.css";
import Header from "@/components/Header";
import PreparationFichier from "@/components/PreparationFichier";
import MagicParticles from "@/components/MagicParticles";
import TiltProvider from "@/components/TiltProvider";
import { getAppUrl } from "@/lib/appUrl";
import { avisPublics } from "@/lib/reviews";
import { unstable_cache } from "next/cache";

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

const APP_URL = getAppUrl();
const DESCRIPTION =
  "Le livre dont votre enfant est le héros : une histoire écrite pour lui, adaptée à son âge et " +
  "illustrée à son image, prête en quelques minutes. Lecture gratuite avant achat, sans abonnement.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Encore une histoire · Livres personnalisés pour enfants",
    template: "%s · Encore une histoire",
  },
  description: DESCRIPTION,
  applicationName: "Encore une histoire",
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
    siteName: "Encore une histoire",
    title: "Encore une histoire · Livres personnalisés pour enfants",
    description: DESCRIPTION,
    // L'image est fournie par src/app/opengraph-image.tsx (générée à la volée).
  },
  twitter: {
    card: "summary_large_image",
    title: "Encore une histoire · Livres personnalisés pour enfants",
    description: DESCRIPTION,
    // L'image est fournie par src/app/twitter-image.tsx.
  },
};

export const viewport = {
  themeColor: "#16245c",
};

/** Nombre d'avis publiés, mis en cache 10 minutes (évite une requête à chaque page). */
const nombreAvis = unstable_cache(async () => avisPublics(1).catch(() => ({ total: 0 })), ["nombre-avis"], { revalidate: 600 });

/** Lien « Avis des parents » : affiché seulement quand il y a de vrais avis publiés. */
async function LienAvis() {
  const { total } = await nombreAvis();
  if (total === 0) return null;
  return (
    <Link href="/avis" className="hover:text-white">
      Avis des parents
    </Link>
  );
}

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
        <Suspense fallback={null}>
          <BarreNavigation />
        </Suspense>
        <Header />
        <PreparationFichier />
        <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="relative z-10 mt-8 bg-nuit px-4 py-8 text-sm text-magique-texteClair">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:gap-y-3 [&>a]:py-3 sm:[&>a]:py-0">
            <Link href="/catalogue" className="hover:text-white">
              Catalogue
            </Link>
            <LienAvis />
            {AGE_GROUPS.map((g) => (
              <Link key={g.slug} href={`/livre-personnalise/${g.slug}`} className="hover:text-white">
                Livre {g.label}
              </Link>
            ))}
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/cgu" className="hover:text-white">
              CGU
            </Link>
            <Link href="/cgv" className="hover:text-white">
              CGV
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
            <span className="text-[#9aa6d6]">© {new Date().getFullYear()} Encore une histoire</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
