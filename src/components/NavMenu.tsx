"use client";

/**
 * Navigation du compte : liens en ligne sur ordinateur, menu déroulant (☰)
 * sur mobile. Les liens sont rendus côté serveur et passés en `children`.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavMenu({ children }: { children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();

  // Referme le menu après chaque navigation.
  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  return (
    <>
      <div className="hidden flex-wrap items-center gap-3 text-sm sm:flex">{children}</div>

      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-magique-trait bg-white/80 text-magique-primaire sm:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          {ouvert ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {ouvert && (
        <div
          id="menu-mobile"
          className="absolute inset-x-0 top-full border-b border-magique-trait bg-white/95 px-4 py-4 shadow-lg backdrop-blur-md sm:hidden"
        >
          <div className="flex flex-col gap-4 text-base">{children}</div>
        </div>
      )}
    </>
  );
}
