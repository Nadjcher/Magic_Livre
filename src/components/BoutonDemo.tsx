"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { rangerEnDemo } from "@/app/actions/demo";

/** Pastille administrateur : ranger un livre avec les démos (ou l'en sortir). */
export default function BoutonDemo({ bookId, estDemo }: { bookId: string; estDemo: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await rangerEnDemo(bookId); router.refresh(); })}
      className="flex h-8 items-center rounded-full bg-[#0b1236]/70 px-3 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-magique-primaire hover:text-nuit disabled:opacity-50"
      title={estDemo ? "Remettre dans mes livres" : "Ranger avec les livres de démonstration"}
    >
      {pending ? "…" : estDemo ? "Mes livres" : "Démo"}
    </button>
  );
}
