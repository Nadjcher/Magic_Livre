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
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white sm:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          {ouvert ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {ouvert && (
        <div
          id="menu-mobile"
          className="absolute inset-x-0 top-full border-b border-magique-trait bg-[#18245f] px-4 py-2 shadow-conte sm:hidden"
        >
          <div className="flex flex-col text-base [&>*]:py-3 [&>a]:block">{children}</div>
        </div>
      )}
    </>
  );
}
