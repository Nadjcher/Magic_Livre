"use client";

/**
 * Lecteur de livre page par page.
 *
 * Fonctions : navigation précédent/suivant, navigation au clavier (flèches),
 * lecture à voix haute via la synthèse vocale du navigateur (Web Speech API)
 * avec choix de la voix, pause et arrêt.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Story } from "@/lib/storySchema";

export default function BookReader({ story }: { story: Story }) {
  // Index 0 = couverture, puis une page par page d'histoire.
  const totalEcrans = story.pages.length + 1;
  const [index, setIndex] = useState(0);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [enLecture, setEnLecture] = useState(false);
  // Mode projection murale (plein écran, idéal pour caster sur TV / projecteur).
  const [projection, setProjection] = useState(false);
  const [autoDefile, setAutoDefile] = useState(false);
  const voixDisponible =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Texte de l'écran courant.
  const texteCourant = useMemo(() => {
    if (index === 0) return story.titre;
    return story.pages[index - 1]?.texte ?? "";
  }, [index, story]);

  // Charge les voix françaises disponibles.
  useEffect(() => {
    if (!voixDisponible) return;
    const charger = () => {
      const liste = window.speechSynthesis.getVoices();
      const fr = liste.filter((v) => v.lang.toLowerCase().startsWith("fr"));
      const choix = fr.length > 0 ? fr : liste;
      setVoices(choix);
      if (choix.length > 0 && !voiceURI) setVoiceURI(choix[0]!.voiceURI);
    };
    charger();
    window.speechSynthesis.onvoiceschanged = charger;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voixDisponible, voiceURI]);

  const arreter = useCallback(() => {
    if (!voixDisponible) return;
    window.speechSynthesis.cancel();
    setEnLecture(false);
  }, [voixDisponible]);

  const lire = useCallback(() => {
    if (!voixDisponible || texteCourant.length === 0) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texteCourant);
    const voix = voices.find((v) => v.voiceURI === voiceURI);
    if (voix) u.voice = voix;
    u.lang = voix?.lang ?? "fr-FR";
    u.rate = 0.95;
    u.onend = () => setEnLecture(false);
    u.onerror = () => setEnLecture(false);
    setEnLecture(true);
    window.speechSynthesis.speak(u);
  }, [voixDisponible, texteCourant, voices, voiceURI]);

  const pause = useCallback(() => {
    if (!voixDisponible) return;
    window.speechSynthesis.pause();
    setEnLecture(false);
  }, [voixDisponible]);

  const precedent = useCallback(() => {
    arreter();
    setIndex((i) => Math.max(0, i - 1));
  }, [arreter]);

  const suivant = useCallback(() => {
    arreter();
    setIndex((i) => Math.min(totalEcrans - 1, i + 1));
  }, [arreter, totalEcrans]);

  // Navigation au clavier.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") precedent();
      else if (e.key === "ArrowRight") suivant();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [precedent, suivant]);

  // Arrête la lecture quand on quitte le composant.
  useEffect(() => arreter, [arreter]);

  // Défilement automatique en mode projection.
  useEffect(() => {
    if (!projection || !autoDefile) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = Math.min(totalEcrans - 1, i + 1);
        return next;
      });
    }, 8000);
    return () => clearInterval(id);
  }, [projection, autoDefile, totalEcrans]);

  // Échap pour quitter la projection.
  useEffect(() => {
    if (!projection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProjection(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projection]);

  const imageCourante =
    index === 0 ? story.couvertureUrl : story.pages[index - 1]?.imageUrl;

  return (
    <div className="space-y-4">
      {/* Écran du livre */}
      <div className="carte flex min-h-[320px] flex-col items-center justify-center text-center">
        {index === 0 ? (
          <>
            {story.couvertureUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.couvertureUrl}
                alt={`Couverture : ${story.titre}`}
                className="mb-5 max-h-72 w-full max-w-xl rounded-2xl object-cover"
              />
            )}
            <h2 className="text-3xl font-bold text-magique-primaire">{story.titre}</h2>
            <p className="mt-4 text-magique-texteClair">Tournez la page pour commencer →</p>
          </>
        ) : (
          <>
            {story.pages[index - 1]?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.pages[index - 1]!.imageUrl!}
                alt={story.pages[index - 1]?.scene_illustration ?? ""}
                className="mb-5 max-h-80 w-full max-w-2xl rounded-2xl object-cover"
              />
            )}
            <p className="max-w-2xl text-2xl leading-relaxed">{texteCourant}</p>
            {!story.pages[index - 1]?.imageUrl && (
              <p className="mt-6 text-xs italic text-magique-texteClair">
                ✦ {story.pages[index - 1]?.scene_illustration}
              </p>
            )}
          </>
        )}
      </div>

      {/* Barre de navigation */}
      <div className="flex items-center justify-between">
        <button className="btn-secondaire" onClick={precedent} disabled={index === 0}>
          ← Précédent
        </button>
        <span className="text-sm text-magique-texteClair">
          {index === 0 ? "Couverture" : `Page ${index} / ${story.pages.length}`}
        </span>
        <button
          className="btn-secondaire"
          onClick={suivant}
          disabled={index === totalEcrans - 1}
        >
          Suivant →
        </button>
      </div>

      {/* Lecture à voix haute */}
      {voixDisponible ? (
        <div className="carte flex flex-wrap items-center gap-3">
          <button className="btn-primaire" onClick={lire} disabled={enLecture}>
            🔊 Lire à voix haute
          </button>
          <button className="btn-secondaire" onClick={pause} disabled={!enLecture}>
            ⏸ Pause
          </button>
          <button className="btn-secondaire" onClick={arreter}>
            ⏹ Arrêt
          </button>
          {voices.length > 1 && (
            <label className="ml-auto flex items-center gap-2 text-sm">
              Voix :
              <select
                className="champ w-auto py-1"
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      ) : (
        <p className="text-sm text-magique-texteClair">
          La lecture à voix haute n'est pas disponible sur ce navigateur.
        </p>
      )}

      {/* Mode projection murale */}
      <button className="btn-secondaire w-full" onClick={() => setProjection(true)}>
        🔆 Projeter sur le mur / la TV
      </button>

      {projection && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0922] text-white">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-white/60">
              🌙 Projection —{" "}
              {index === 0 ? "Couverture" : `Page ${index} / ${story.pages.length}`}
            </span>
            <div className="flex items-center gap-3">
              <button
                className="rounded-full border border-white/30 px-4 py-1.5 text-sm"
                onClick={() => setAutoDefile((a) => !a)}
              >
                {autoDefile ? "⏸ Défilement auto" : "▶ Défilement auto"}
              </button>
              <button
                className="rounded-full border border-white/30 px-4 py-1.5 text-sm"
                onClick={() => setProjection(false)}
              >
                ✕ Quitter
              </button>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            {imageCourante && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageCourante}
                alt=""
                className="mb-8 max-h-[55vh] w-auto rounded-2xl object-contain"
              />
            )}
            {index === 0 ? (
              <h2 className="text-4xl font-bold sm:text-6xl">{story.titre}</h2>
            ) : (
              <p className="max-w-4xl text-2xl leading-relaxed sm:text-4xl">
                {texteCourant}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between px-8 py-6">
            <button
              className="rounded-full border border-white/30 px-6 py-3 text-lg disabled:opacity-30"
              onClick={precedent}
              disabled={index === 0}
              aria-label="Page précédente"
            >
              ←
            </button>
            <button
              className="rounded-full bg-white/10 px-6 py-3 text-lg"
              onClick={lire}
            >
              🔊 Lire
            </button>
            <button
              className="rounded-full border border-white/30 px-6 py-3 text-lg disabled:opacity-30"
              onClick={suivant}
              disabled={index === totalEcrans - 1}
              aria-label="Page suivante"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
