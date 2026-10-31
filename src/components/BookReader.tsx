"use client";

/**
 * Lecteur de livre page par page, style « conte enchanté ».
 *
 * Fonctions : navigation précédent/suivant, navigation au clavier (flèches),
 * lecture à voix haute (Web Speech API) avec choix de la voix, pause et arrêt.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Story } from "@/lib/storySchema";

/* --- Petites icônes au trait (plus soignées que des emojis) --- */
const ico = "stroke-current";
function IChevron({ dir }: { dir: "g" | "d" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={ico} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "g" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}
function ISon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={ico} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4Z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>
  );
}
function IPause() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={ico} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>;
}
function IStop() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={ico} strokeWidth="2" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
}

export default function BookReader({ story }: { story: Story }) {
  const totalEcrans = story.pages.length + 1;
  const [index, setIndex] = useState(0);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [enLecture, setEnLecture] = useState(false);
  // Détectée APRÈS le montage : le serveur ne connaît pas la Web Speech API.
  // La calculer pendant le rendu ferait diverger le HTML serveur et client
  // (erreurs d'hydratation React #418/#423).
  const [voixDisponible, setVoixDisponible] = useState(false);
  useEffect(() => {
    setVoixDisponible("speechSynthesis" in window);
  }, []);

  const texteCourant = useMemo(() => {
    if (index === 0) return story.titre;
    return story.pages[index - 1]?.texte ?? "";
  }, [index, story]);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") precedent();
      else if (e.key === "ArrowRight") suivant();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [precedent, suivant]);

  useEffect(() => arreter, [arreter]);


  const imageCourante =
    index === 0 ? story.couvertureUrl : story.pages[index - 1]?.imageUrl;
  const pageCourante = index === 0 ? null : story.pages[index - 1];

  return (
    <div className="space-y-5">
      {/* ─── La page du livre ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-magique-trait bg-gradient-to-b from-white to-parch shadow-conte">
        <div
          key={index}
          className="anim-page flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center sm:px-12"
        >
          {index === 0 ? (
            <>
              {story.couvertureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={story.couvertureUrl}
                  alt={`Couverture : ${story.titre}`}
                  className="mb-6 max-h-80 w-full max-w-xl rounded-2xl object-cover shadow-conte"
                />
              )}
              <p className="font-serif text-lg italic text-or-fonce">Il était une fois…</p>
              <h2 className="mt-1 text-gradient text-3xl sm:text-4xl">{story.titre}</h2>
              <p className="mt-4 text-magique-texteClair">Tournez la page pour commencer</p>
            </>
          ) : (
            <>
              {pageCourante?.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pageCourante.imageUrl}
                  alt={pageCourante.scene_illustration}
                  className="mb-6 max-h-80 w-full max-w-2xl rounded-2xl object-cover shadow-conte"
                />
              )}
              <p className="max-w-[46ch] text-2xl leading-relaxed text-magique-texte">
                {texteCourant}
              </p>
              {!pageCourante?.imageUrl && (
                <p className="mt-6 text-xs italic text-magique-texteClair">
                  ✦ {pageCourante?.scene_illustration}
                </p>
              )}
            </>
          )}
        </div>
        <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-serif text-sm italic text-magique-texteClair">
          {index === 0 ? "✦" : `— ${index} —`}
        </span>
      </div>

      {/* ─── Navigation ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={precedent}
          disabled={index === 0}
          aria-label="Page précédente"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-magique-trait bg-white text-magique-primaire transition hover:-translate-y-0.5 hover:border-magique-primaire disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <IChevron dir="g" />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: totalEcrans }).map((_, k) => (
            <span
              key={k}
              className={`h-2 rounded-full transition-all ${
                k === index ? "w-6 bg-or" : "w-2 bg-magique-trait"
              }`}
            />
          ))}
        </div>
        <button
          onClick={suivant}
          disabled={index === totalEcrans - 1}
          aria-label="Page suivante"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-magique-trait bg-white text-magique-primaire transition hover:-translate-y-0.5 hover:border-magique-primaire disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <IChevron dir="d" />
        </button>
      </div>
      <p className="text-center text-sm text-magique-texteClair">
        {index === 0 ? "Couverture" : `Page ${index} sur ${story.pages.length}`}
      </p>

      {/* ─── Lecture à voix haute ─── */}
      {voixDisponible ? (
        <div className="carte flex flex-wrap items-center gap-3">
          <button className="btn-primaire" onClick={lire} disabled={enLecture}>
            <ISon /> Lire à voix haute
          </button>
          <button className="btn-secondaire" onClick={pause} disabled={!enLecture}>
            <IPause /> Pause
          </button>
          <button className="btn-secondaire" onClick={arreter}>
            <IStop /> Arrêt
          </button>
          {voices.length > 1 && (
            <label className="ml-auto flex items-center gap-2 text-sm text-magique-texteClair">
              Voix
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
    </div>
  );
}
