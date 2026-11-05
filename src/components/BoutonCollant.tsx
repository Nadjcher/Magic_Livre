"use client";

/**
 * Bouton « Créer son histoire » toujours à portée de pouce sur mobile : il
 * apparaît une fois le haut de page passé et s'efface près de l'appel final.
 * Un simple bouton d'action, pas une barre de navigation.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BoutonCollant({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const maj = () => {
      const fin = document.getElementById("appel-final");
      const finProche = fin ? fin.getBoundingClientRect().top < window.innerHeight : false;
      setVisible(window.scrollY > 650 && !finProche);
    };
    maj();
    window.addEventListener("scroll", maj, { passive: true });
    return () => window.removeEventListener("scroll", maj);
  }, []);
  return (
    <div
      className={`fixed inset-x-4 bottom-4 z-40 transition duration-300 sm:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <Link href={href} tabIndex={visible ? 0 : -1} className="btn-primaire w-full text-base shadow-conte">
        Créer son histoire · gratuit
      </Link>
    </div>
  );
}
