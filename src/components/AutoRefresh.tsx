"use client";

/**
 * Rafraîchit la page à intervalle régulier (ex. pendant la génération d'un
 * livre), pour afficher automatiquement le résultat dès qu'il est prêt.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
