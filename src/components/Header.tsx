/**
 * En-tête de navigation. Affiche les liens principaux et l'état de connexion.
 * Composant serveur : il lit la session pour adapter les liens.
 */

import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import Logo from "./Logo";
import NavMenu from "./NavMenu";

export default async function Header() {
  const session = await auth();
  const connecte = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#18245f]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:py-3">
        <Link href="/" aria-label="Accueil Encore une histoire" className="flex min-h-11 items-center">
          <Logo />
        </Link>
        {connecte ? (
          <NavMenu>
            <Link href="/creer" prefetch className="hover:text-magique-primaire">
              Créer un livre
            </Link>
            <Link href="/bibliotheque" prefetch className="hover:text-magique-primaire">
              Ma bibliothèque
            </Link>
            <Link href="/enfants" prefetch className="hover:text-magique-primaire">
              Mes enfants
            </Link>
            <Link href="/club" prefetch className="hover:text-magique-primaire">
              Le Club
            </Link>
            <Link href="/compte" prefetch className="hover:text-magique-primaire">
              Mon compte
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="text-magique-texteClair hover:underline">
                Se déconnecter
              </button>
            </form>
          </NavMenu>
        ) : (
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <NavMenu>
              <Link href="/demo" className="hover:text-magique-primaire">
                Lire un exemple
              </Link>
              <Link href="/#prix" className="hover:text-magique-primaire">
                Prix
              </Link>
              <Link href="/catalogue" className="hover:text-magique-primaire">
                Catalogue
              </Link>
              <Link href="/club" className="hover:text-magique-primaire">
                Le Club
              </Link>
              <Link href="/connexion" className="font-semibold text-magique-primaire sm:hidden">
                Se connecter ou créer un compte
              </Link>
            </NavMenu>
            <Link
              href="/connexion"
              aria-label="Se connecter"
              className="btn-primaire order-first whitespace-nowrap px-3.5 py-2 text-sm max-[399px]:w-11 max-[399px]:px-0 sm:order-last sm:px-4"
            >
              <span className="hidden min-[400px]:inline">Se connecter</span>
              <svg className="min-[400px]:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
