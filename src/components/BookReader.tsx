"use client";

/**
 * Lecteur de livre page par page, style « conte enchanté ».
 *
 * Fonctions : navigation précédent/suivant, navigation au clavier (flèches),
 * lecture à voix haute (Web Speech API) avec choix de la voix, pause et arrêt.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { separerChapitre } from "@/lib/chapitre";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Story } from "@/lib/storySchema";
import { redrawPage } from "@/app/actions/illustrations";

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

export default function BookReader({
  story,
  retouche,
  prenom,
}: {
  story: Story;
  /** Prénom du héros, imprimé en grand sur la couverture. */
  prenom?: string;
  /** Livre du parent : permet de redessiner une illustration ratée. */
  retouche?: { bookId: string; restantes: number };
}) {
  const router = useRouter();
  const [redessin, setRedessin] = useState<{ enCours: boolean; message?: string }>({ enCours: false });
  const [restantes, setRestantes] = useState(retouche?.restantes ?? 0);
  // Couverture + pages + une vraie page « Fin ».
  const totalEcrans = story.pages.length + 2;
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
  const estFin = index === totalEcrans - 1;

  return (
    <div className="space-y-5">
      {/* ─── La page du livre ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-magique-trait bg-gradient-to-b from-white/[0.12] to-white/[0.04] shadow-conte backdrop-blur-md">
        <div
          key={index}
          className="anim-page flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center sm:px-12"
        >
          {estFin ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/feerique/nuit.webp" alt="" className="mb-4 h-40 w-40 object-contain" />
              <p className="font-serif text-5xl italic text-or-clair">Fin</p>
              <p className="mt-3 max-w-[40ch] text-lg text-magique-texteClair">
                Et l'histoire se referme doucement… jusqu'à la prochaine.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => setIndex(0)} className="btn-secondaire">
                  Relire depuis le début
                </button>
                <Link href="/creer" className="btn-primaire">
                  Encore une histoire ?
                </Link>
              </div>
            </>
          ) : index === 0 ? (
            <>
              {story.couvertureUrl && (
                <div className="relative mb-6 w-full max-w-xl overflow-hidden rounded-2xl shadow-conte [container-type:inline-size]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.couvertureUrl} alt={`Couverture : ${story.titre}`} className="max-h-80 w-full object-cover" />
                  {prenom && (
                    <>
                      <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-[#0b1236]/70 to-transparent" aria-hidden="true" />
                      <p
                        className="absolute inset-x-4 top-[7%] text-center font-serif font-bold uppercase leading-none tracking-[0.06em] text-white [text-shadow:0_2px_10px_rgba(8,14,48,.75)]"
                        style={{ fontSize: `${Math.min(10, 80 / Math.max(prenom.length, 5))}cqw` }}
                      >
                        {prenom}
                      </p>
                    </>
                  )}
                </div>
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
              {(() => {
                const { chapitre, corps } = separerChapitre(texteCourant);
                return (
                  <>
                    {chapitre && <p className="mb-3 font-serif text-lg font-semibold text-magique-primaire">{chapitre}</p>}
                    <p className={`max-w-[46ch] leading-relaxed text-magique-texte ${corps.length > 450 ? "text-lg" : corps.length > 250 ? "text-xl" : "text-2xl"}`}>
                      {corps}
                    </p>
                  </>
                );
              })()}
              {!pageCourante?.imageUrl && (
                <p className="mt-6 text-xs italic text-magique-texteClair">
                  ✦ {pageCourante?.scene_illustration}
                </p>
              )}
            </>
          )}
        </div>
        <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-serif text-sm italic text-magique-texteClair">
          {index === 0 || estFin ? "✦" : `— ${index} —`}
        </span>
      </div>

      {retouche && (index === 0 ? story.couvertureUrl : story.pages[index - 1]?.imageUrl) && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={redessin.enCours || restantes <= 0}
            className="rounded-full border border-white/25 px-4 py-1.5 font-semibold text-magique-texte transition hover:border-white disabled:opacity-50"
            onClick={async () => {
              if (!confirm("Redessiner cette illustration ? (le texte ne change pas)")) return;
              setRedessin({ enCours: true });
              const r = await redrawPage(retouche.bookId, index === 0 ? -1 : index - 1);
              if (typeof r.restantes === "number") setRestantes(r.restantes);
              setRedessin({ enCours: false, message: r.message });
              if (r.ok) router.refresh();
            }}
          >
            {redessin.enCours ? "Nouveau dessin en cours… (≈ 30 s)" : "Redessiner cette illustration"}
          </button>
          <span className="text-magique-texteClair">
            {redessin.message ?? `${restantes} retouche${restantes > 1 ? "s" : ""} gratuite${restantes > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={precedent}
          disabled={index === 0}
          aria-label="Page précédente"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 text-white transition hover:-translate-y-0.5 hover:border-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <IChevron dir="g" />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: totalEcrans }).map((_, k) => (
            <span
              key={k}
              className={`h-2 rounded-full transition-[width,background-color] duration-200 ${
                k === index ? "w-6 bg-or" : "w-2 bg-magique-trait"
              }`}
            />
          ))}
        </div>
        <button
          onClick={suivant}
          disabled={index === totalEcrans - 1}
          aria-label="Page suivante"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 text-white transition hover:-translate-y-0.5 hover:border-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <IChevron dir="d" />
        </button>
      </div>
      <p className="text-center text-sm text-magique-texteClair">
        {index === 0 ? "Couverture" : estFin ? "Fin" : `Page ${index} sur ${story.pages.length}`}
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
