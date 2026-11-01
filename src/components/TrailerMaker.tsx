"use client";

/**
 * « Le livre en dessin animé » : lance la création, suit l'avancement des
 * scènes animées puis affiche la vidéo finale (montée sur le serveur).
 */

import { useCallback, useEffect, useState } from "react";
import { retryMontage, retryScene, startTrailer, trailerStatus } from "@/app/actions/trailer";
import type { Trailer } from "@/lib/storySchema";
import Notice from "./Notice";

export default function TrailerMaker({
  bookId,
  initial,
  essaisMax,
  nomFichier,
}: {
  bookId: string;
  initial: Trailer | null;
  essaisMax: number;
  nomFichier: string;
}) {
  const [trailer, setTrailer] = useState<Trailer | null>(initial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [telechargement, setTelechargement] = useState(false);

  const scenes = trailer?.scenes ?? [];
  const prets = scenes.filter((s) => s.clipUrl).length;
  const enEchec = scenes.filter((s) => s.erreur).length;
  const fini = Boolean(trailer?.finalUrl);
  const enCours = Boolean(trailer) && !fini && !trailer?.finalErreur && enEchec === 0;
  const pourcent = scenes.length
    ? Math.round(((prets + (trailer?.finalStatusUrl ? 1 : 0)) / (scenes.length + 2)) * 100)
    : 0;

  const suivre = useCallback(async () => {
    const r = await trailerStatus(bookId);
    if (r.ok && r.trailer !== undefined) setTrailer(r.trailer);
    else if (!r.ok) setErreur(r.message ?? "Erreur.");
  }, [bookId]);

  // Suivi automatique toutes les 10 s tant que la création avance.
  useEffect(() => {
    if (!enCours) return;
    void suivre();
    const id = setInterval(suivre, 10_000);
    return () => clearInterval(id);
  }, [enCours, suivre]);

  async function action(f: () => Promise<{ ok: boolean; message?: string; trailer?: Trailer | null }>) {
    setErreur(null);
    setOccupe(true);
    const r = await f();
    setOccupe(false);
    if (r.ok) setTrailer(r.trailer ?? null);
    else setErreur(r.message ?? "Erreur.");
  }

  /** Télécharge la vidéo (fichier hébergé ailleurs : on passe par un blob local). */
  async function telecharger() {
    if (!trailer?.finalUrl) return;
    setTelechargement(true);
    try {
      const blob = await (await fetch(trailer.finalUrl)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${nomFichier}.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    } catch {
      window.open(trailer.finalUrl, "_blank");
    }
    setTelechargement(false);
  }

  const essais = trailer?.essais ?? 0;

  return (
    <div className="space-y-5">
      {!trailer && (
        <div className="carte space-y-3">
          <p>
            Toute l'histoire devient un dessin animé : chaque page prend vie, une voix lit
            le texte du début à la fin, avec une musique douce. Une vraie vidéo MP4 à
            regarder ensemble ou à envoyer à la famille.
          </p>
          <button type="button" className="btn-primaire" onClick={() => action(() => startTrailer(bookId))} disabled={occupe}>
            {occupe ? "Lancement…" : "🎬 Créer le dessin animé"}
          </button>
          <p className="text-sm text-magique-texteClair">
            La création prend environ 10 minutes. Vous pouvez fermer la page et revenir plus tard.
          </p>
        </div>
      )}

      {fini && trailer?.finalUrl && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-3xl border border-white/15 shadow-conte">
            <video src={trailer.finalUrl} controls playsInline className="aspect-video w-full bg-black" />
          </div>
          <button type="button" className="btn-primaire" onClick={telecharger} disabled={telechargement}>
            {telechargement ? "Téléchargement…" : "⬇️ Télécharger la vidéo"}
          </button>
        </div>
      )}

      {trailer && !fini && (
        <div className="carte space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-xl">
              {trailer.finalStatusUrl ? "Montage final en cours…" : "Les pages prennent vie…"}
            </h2>
            <span className="text-sm text-magique-texteClair">
              {prets}/{scenes.length} scènes animées
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-magique-primaire transition-all" style={{ width: `${pourcent}%` }} />
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {scenes.map((s, i) => (
              <li key={i} className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                {s.clipUrl ? (
                  <video src={s.clipUrl} muted loop autoPlay playsInline className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-xs text-magique-texteClair">
                    {s.erreur ? "⚠️ Échec" : "✨ En création…"}
                  </div>
                )}
                <div className="p-2 text-[11px] leading-snug text-magique-texteClair">
                  {s.source === "cover" ? "Titre" : `Page ${s.source + 1}`}
                  {s.erreur && (
                    <button
                      type="button"
                      className="mt-1 block font-semibold text-magique-primaire underline"
                      onClick={() => action(() => retryScene(bookId, i))}
                    >
                      Réessayer cette scène
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {trailer.finalErreur && (
            <div className="space-y-2">
              <Notice kind="erreur">Le montage final n'a pas abouti. Vous pouvez le relancer.</Notice>
              <button type="button" className="btn-secondaire" onClick={() => action(() => retryMontage(bookId))} disabled={occupe}>
                Relancer le montage
              </button>
            </div>
          )}
          {enCours && (
            <p className="text-sm text-magique-texteClair">
              Cette page se met à jour toute seule. Vous pouvez la fermer et revenir plus tard.
            </p>
          )}
        </div>
      )}

      {trailer && (fini || enEchec > 0) && essais < essaisMax && (
        <button
          type="button"
          className="text-sm text-magique-texteClair underline"
          onClick={() => action(() => startTrailer(bookId))}
          disabled={occupe}
        >
          Tout recréer (encore {essaisMax - essais} essai{essaisMax - essais > 1 ? "s" : ""})
        </button>
      )}
      {erreur && <Notice kind="erreur">{erreur}</Notice>}
    </div>
  );
}
