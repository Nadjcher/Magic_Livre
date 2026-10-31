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
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="Accueil Storilou">
          <Logo />
        </Link>
        {connecte ? (
          <NavMenu>
            <Link href="/creer" className="hover:text-magique-primaire">
              Créer un livre
            </Link>
            <Link href="/bibliotheque" className="hover:text-magique-primaire">
              Ma bibliothèque
            </Link>
            <Link href="/enfants" className="hover:text-magique-primaire">
              Mes enfants
            </Link>
            <Link href="/compte" className="hover:text-magique-primaire">
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
          <div className="flex items-center gap-4 text-sm">
            <Link href="/catalogue" className="hidden hover:text-magique-primaire sm:inline">
              Catalogue
            </Link>
            <Link href="/connexion" className="btn-primaire whitespace-nowrap px-4 py-2 text-sm">
              Se connecter
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
