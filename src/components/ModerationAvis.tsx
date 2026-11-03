"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { modererAvis } from "@/app/actions/reviews";

export default function ModerationAvis({ id, visible }: { id: string; visible: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full border border-white/25 px-3 py-1 text-sm hover:border-white"
      onClick={() => start(async () => { await modererAvis(id, !visible); router.refresh(); })}
    >
      {visible ? "Masquer" : "Publier"}
    </button>
  );
}
