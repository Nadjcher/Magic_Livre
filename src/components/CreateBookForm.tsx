"use client";

/**
 * Formulaire de création de livre, en 3 étapes courtes :
 *   1. Le héros : l'enfant (ou un nouvel enfant, prénom + âge), sa photo.
 *   2. L'histoire : un thème du catalogue (ou une idée libre), le type de livre.
 *   3. Les finitions : style, longueur, autres personnages, édition premium,
 *      consentement parental (si pas encore donné), puis « Créer le livre ».
 * Tout est réglé par défaut selon l'âge : on peut créer en 3 clics.
 * Tous les champs restent dans le formulaire (étapes masquées, pas retirées).
 */

import Picto from "@/components/Picto";
import { couvertureTheme } from "@/lib/couverturesThemes";
import CouvertureLivre from "@/components/CouvertureLivre";
import { useEffect, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { findFormat, formatParDefaut, formatsPourAge } from "@/lib/bookFormats";
import { ROLES_EXTRAS } from "@/lib/validation";
import { groupePourAge } from "@/lib/ageGroups";
import { useRouter } from "next/navigation";
import { createBook } from "@/app/actions/books";
import { preparerHeros, type PortraitResultat } from "@/app/actions/heros";
import { THEMES, THEME_CATEGORIES, estClassique, findThemeById, type ThemeCategory } from "@/lib/themes";
import type { ChildView } from "./ChildrenManager";
import { ILLUSTRATION_STYLES, stylesPourAge, type IllustrationStyle } from "@/lib/style_config";
import Notice from "./Notice";
import GenerationOverlay from "./GenerationOverlay";
import Link from "next/link";

/**
 * Lit une photo, la redimensionne (max 512 px) et la renvoie en data URL JPEG
 * légère. Elle reste dans le navigateur jusqu'à la création, puis n'est jamais
 * conservée côté serveur.
 */
function lirePhotoReduite(file: File | undefined, done: (dataUrl: string) => void) {
  if (!file) return done("");
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 512;
      const ratio = Math.min(max / img.width, max / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return done("");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      done(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

type Extra = { name: string; role: string; photo: string };

const ETAPES = ["Le héros", "L'histoire", "Les finitions"] as const;
const LONGUEURS = [
  { id: "courte", label: "Courte", detail: "8-9 pages" },
  { id: "moyenne", label: "Moyenne", detail: "10-11 pages" },
  { id: "longue", label: "Longue", detail: "11-12 pages" },
] as const;

/** Tuile sélectionnable (choix unique). */
function tuile(actif: boolean): string {
  return `rounded-xl border-2 text-left transition ${
    actif ? "border-magique-primaire bg-magique-primaire/10" : "border-magique-trait hover:border-magique-primaire"
  }`;
}

export default function CreateBookForm({
  enfants,
  initialThemeId,
  initialPrenom,
  prixStandard,
  prixPremium,
  abonnement,
  consentRequis,
  termsVersion,
}: {
  enfants: ChildView[];
  /** Thème présélectionné (lien « Créer ce livre » du catalogue). */
  initialThemeId?: string;
  /** Prénom tapé sur la page produit (aperçu de la couverture). */
  initialPrenom?: string;
  prixStandard: string;
  prixPremium: string;
  /** Abonnement Club (livres inclus restants, accès aux classiques). */
  abonnement: { actif: boolean; label: string; restants: number; quota: number; premium: boolean };
  /** Consentement parental pas encore donné : case à cocher avant de créer. */
  consentRequis: boolean;
  termsVersion: string;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState(0);

  // ─── Étape 1 : le héros ───
  const dejaConnu = initialPrenom ? enfants.find((c) => c.firstName.toLowerCase() === initialPrenom.toLowerCase()) : undefined;
  const [childId, setChildId] = useState(initialPrenom ? (dejaConnu?.id ?? "nouveau") : (enfants[0]?.id ?? "nouveau"));
  const [nouveauPrenom, setNouveauPrenom] = useState(dejaConnu ? "" : (initialPrenom ?? ""));
  const [nouvelAge, setNouvelAge] = useState(5);
  const [photo, setPhoto] = useState<string>("");
  const [appearance, setAppearance] = useState("");
  const nouveau = childId === "nouveau";
  const enfant = enfants.find((c) => c.id === childId);
  const age = nouveau ? nouvelAge : enfant?.age ?? 5;
  const prenom = nouveau ? nouveauPrenom.trim() : enfant?.firstName ?? "";

  // ─── Étape 2 : l'histoire ───
  // Sans abonnement, on n'ouvre jamais sur les grands classiques (réservés au Club).
  const initial = findThemeById(initialThemeId);
  const themeInitial =
    initial && (abonnement.actif || !estClassique(initial)) ? initial : THEMES.find((t) => t.saison) ?? THEMES.find((t) => !estClassique(t))!;
  const [mode, setMode] = useState<"theme" | "libre">("theme");
  const [themeId, setThemeId] = useState(themeInitial.id);
  const [categorie, setCategorie] = useState<ThemeCategory>(themeInitial.categorie);
  const [prompt, setPrompt] = useState("");
  const [formatId, setFormatId] = useState(formatParDefaut(age).id);
  const [voirFormats, setVoirFormats] = useState(false);
  const formats = formatsPourAge(age);
  const formatValide = formats.some((f) => f.id === formatId) ? formatId : formatParDefaut(age).id;
  const format = findFormat(formatValide);
  const classiqueVerrouille = mode === "theme" && estClassique(findThemeById(themeId)) && !abonnement.actif;

  // ─── Étape 3 : les finitions ───
  const [style, setStyle] = useState<IllustrationStyle>(themeInitial.style ?? "feerique");
  const [voirStyles, setVoirStyles] = useState(false);
  const [longueur, setLongueur] = useState<"courte" | "moyenne" | "longue">("moyenne");
  const [extras, setExtras] = useState<Extra[]>([]);
  const majExtra = (i: number, patch: Partial<Extra>) => setExtras((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const groupe = groupePourAge(age);
  const stylesAge = [...groupe.styles.filter((k) => stylesPourAge(age).includes(k)), ...stylesPourAge(age).filter((k) => !groupe.styles.includes(k))];
  const styleAffiche: IllustrationStyle = stylesAge.includes(style) ? style : stylesAge[0] ?? "feerique";
  const stylesVisibles = voirStyles ? stylesAge : [styleAffiche, ...stylesAge.filter((s) => s !== styleAffiche)].slice(0, 4);

  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ─── « Est-ce bien votre enfant ? » : le portrait du héros, validé avant les pages ───
  const formRef = useRef<HTMLFormElement>(null);
  const herosAccepte = useRef<{ cle: string; id: string; traits: string } | null>(null);
  const [accepte, setAccepte] = useState<{ cle: string; id: string; traits: string } | null>(null);
  const [heros, setHeros] = useState<(Extract<PortraitResultat, { ok: true }> & { cle: string }) | null>(null);
  const [herosTraits, setHerosTraits] = useState("");
  const [herosMessage, setHerosMessage] = useState<string | null>(null);
  const [herosEnCours, demarrerHeros] = useTransition();
  const cleHeros = `${photo.length}:${photo.slice(-24)}:${styleAffiche}:${childId}`;

  function demanderPortrait(formData: FormData, precedent?: string) {
    setHerosMessage(null);
    demarrerHeros(async () => {
      const fd = new FormData();
      fd.set("photo", photo);
      fd.set("style", String(formData.get("style") ?? styleAffiche));
      fd.set("childId", childId);
      if (precedent) {
        fd.set("herosId", precedent);
        fd.set("traits", herosTraits);
      }
      const r = await preparerHeros(fd);
      if (r.ok) {
        setHeros({ ...r, cle: cleHeros });
        setHerosTraits(r.traits);
      } else {
        setHerosMessage(r.message);
      }
    });
  }

  function choisirTheme(id: string) {
    setThemeId(id);
    const t = findThemeById(id);
    if (t?.style) setStyle(t.style);
  }

  // Ce qui manque pour passer à l'étape suivante (null = tout va bien).
  const bloque: string | null =
    etape === 0
      ? nouveau && !nouveauPrenom.trim()
        ? "Indiquez le prénom de l'enfant."
        : null
      : etape === 1
        ? classiqueVerrouille
          ? "Ce grand classique est réservé aux membres du Club."
          : mode === "libre" && prompt.trim().length < 10
            ? "Décrivez l'aventure en quelques mots."
            : null
        : null;

  return (
    <form
      ref={formRef}
      className="space-y-6 pb-24 sm:pb-0"
      action={(formData) => {
        // Avec une photo : d'abord le portrait, validé par le parent, puis le livre.
        if (photo && herosAccepte.current?.cle !== cleHeros) {
          if (heros?.cle === cleHeros) return; // le portrait attend la réponse du parent
          demanderPortrait(formData);
          return;
        }
        startTransition(async () => {
          setErreur(null);
          const res = await createBook(formData);
          if (res.ok && res.bookId) {
            router.push(`/bibliotheque/${res.bookId}`);
          } else {
            setErreur(res.message);
          }
        });
      }}
    >
      {accepte?.cle === cleHeros && (
        <>
          <input type="hidden" name="herosId" value={accepte.id} />
          <input type="hidden" name="herosTraits" value={accepte.traits} />
        </>
      )}
      {(herosEnCours || herosMessage || (heros && heros.cle === cleHeros && accepte?.cle !== cleHeros)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1236]/80 p-4" role="dialog" aria-modal="true" aria-label="Le portrait du héros">
          <div className="carte max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto">
            {herosEnCours ? (
              <AttentePortrait prenom={prenom || "votre enfant"} />
            ) : herosMessage ? (
              <>
                <p>{herosMessage}</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-secondaire" onClick={() => setHerosMessage(null)}>
                    Changer de photo
                  </button>
                  <button
                    type="button"
                    className="btn-primaire"
                    onClick={() => {
                      setHerosMessage(null);
                      setAppearance((a) => a || heros?.traits || "");
                      flushSync(() => setPhoto(""));
                      formRef.current?.requestSubmit();
                    }}
                  >
                    Continuer avec une description
                  </button>
                </div>
              </>
            ) : heros ? (
              <>
                <h2 className="font-serif text-2xl">Est-ce bien {prenom || "votre enfant"} ?</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heros.image} alt={`Portrait dessiné de ${prenom || "votre enfant"}`} className="w-full rounded-2xl shadow-conte" />
                {heros.lumiere === "chaude" && (
                  <p className="rounded-xl bg-or/15 p-3 text-sm">
                    La photo semble prise en lumière dorée (coucher de soleil, filtre) : les couleurs peuvent être faussées.
                    Vérifiez surtout la couleur des cheveux ci-dessous, ou choisissez une photo en plein jour.
                  </p>
                )}
                <label className="block text-sm">
                  <span className="font-semibold">Ses traits (corrigez si besoin : ils seront respectés sur chaque page)</span>
                  <textarea value={herosTraits} onChange={(e) => setHerosTraits(e.target.value)} rows={3} maxLength={240} className="champ mt-1" />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-primaire"
                    onClick={() => {
                      const choix = { cle: cleHeros, id: heros.herosId, traits: herosTraits };
                      herosAccepte.current = choix;
                      flushSync(() => setAccepte(choix));
                      formRef.current?.requestSubmit();
                    }}
                  >
                    Oui, c'est {prenom || "lui / elle"} !
                  </button>
                  {heros.essais < 2 && (
                    <button type="button" className="btn-secondaire" onClick={() => formRef.current && demanderPortrait(new FormData(formRef.current), heros.herosId)}>
                      Refaire une fois
                    </button>
                  )}
                  {heros.essais === 2 && (
                    <button
                      type="button"
                      className="btn-secondaire"
                      disabled={herosTraits.trim() === heros.traits.trim()}
                      title={herosTraits.trim() === heros.traits.trim() ? "Corrigez d'abord ses traits ci-dessus" : undefined}
                      onClick={() => formRef.current && demanderPortrait(new FormData(formRef.current), heros.herosId)}
                    >
                      Un dernier portrait avec ces traits
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondaire"
                    onClick={() => {
                      // Héros décrit, sans photo : les traits deviennent sa description.
                      flushSync(() => {
                        setAppearance(herosTraits.slice(0, 240));
                        setPhoto("");
                        setHeros(null);
                      });
                      formRef.current?.requestSubmit();
                    }}
                  >
                    Continuer sans photo, avec ces traits
                  </button>
                  <button type="button" className="text-sm underline" onClick={() => setHeros(null)}>
                    Annuler
                  </button>
                </div>
                <p className="text-xs text-magique-texteClair">
                  Ce portrait sera son héros dans tous ses livres de ce style. La photo n'est pas conservée.
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}
      {/* Progression */}
      <ol className="flex items-center gap-2 text-sm" aria-label="Étapes">
        {ETAPES.map((nom, k) => (
          <li key={nom} className={`flex items-center gap-2 ${k === etape ? "flex-[2]" : "flex-1"}`}>
            <button
              type="button"
              onClick={() => k < etape && setEtape(k)}
              disabled={k > etape}
              aria-current={k === etape ? "step" : undefined}
              className={`flex min-h-11 flex-1 items-center gap-2 rounded-full border px-3 font-semibold transition ${
                k === etape
                  ? "border-magique-primaire bg-magique-primaire text-nuit"
                  : k < etape
                    ? "border-magique-primaire/60 text-magique-texte hover:bg-white/[0.06]"
                    : "border-white/15 text-magique-texteClair"
              }`}
            >
              <span aria-hidden="true">{k < etape ? "✓" : k + 1}</span>
              <span className={k === etape ? "whitespace-nowrap" : "hidden sm:inline"}>{nom}</span>
            </button>
          </li>
        ))}
      </ol>

      {abonnement.actif && (
        <Notice kind="succes">
          {abonnement.label} :{" "}
          {abonnement.restants > 0
            ? `ce livre est inclus (${abonnement.restants} sur ${abonnement.quota} restant${abonnement.restants > 1 ? "s" : ""} ce mois-ci)${abonnement.premium ? ", en édition premium" : ""}.`
            : "vos livres du mois sont utilisés ; celui-ci sera lisible gratuitement, et téléchargeable à l'unité."}
        </Notice>
      )}

      {/* ═══ Étape 1 : le héros ═══ */}
      <section className={etape === 0 ? "space-y-6" : "hidden"} aria-label="Le héros">
        <div className="carte space-y-4">
          <h2 className="font-serif text-2xl">Qui est le héros&nbsp;?</h2>
          <input type="hidden" name="childId" value={childId} />
          {enfants.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Enfant">
              {enfants.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={childId === c.id} onClick={() => setChildId(c.id)} className={`${tuile(childId === c.id)} min-h-14 p-3`}>
                  <span className="block font-semibold">{c.firstName}</span>
                  <span className="text-sm text-magique-texteClair">{c.age} ans</span>
                </button>
              ))}
              <button type="button" role="radio" aria-checked={nouveau} onClick={() => setChildId("nouveau")} className={`${tuile(nouveau)} min-h-14 p-3`}>
                <span className="block font-semibold">+ Un autre enfant</span>
                <span className="text-sm text-magique-texteClair">prénom et âge</span>
              </button>
            </div>
          )}
          {nouveau && (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="block text-sm font-semibold">
                Son prénom
                <input
                  name="newChildName"
                  value={nouveauPrenom}
                  onChange={(e) => setNouveauPrenom(e.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  placeholder="Ex : Léo"
                  className="champ mt-1"
                />
              </label>
              <label className="block text-sm font-semibold">
                Son âge
                <select name="newChildAge" value={nouvelAge} onChange={(e) => setNouvelAge(Number(e.target.value))} className="champ mt-1 sm:w-36">
                  {Array.from({ length: 12 }, (_, k) => k + 1).map((a) => (
                    <option key={a} value={a}>
                      {a} an{a > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="carte space-y-4">
          <div>
            <h2 className="font-serif text-2xl">Sa photo, pour qu'il lui ressemble</h2>
            <p className="mt-1 text-sm text-magique-texteClair">
              Conseillé : de face, en lumière du jour, sans filtre (un coucher de soleil change la couleur des cheveux).
              Vous validerez son portrait avant le livre. La photo sert seulement à dessiner le héros et n'est{" "}
              <strong>jamais conservée</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Aperçu de la photo" className="h-24 w-24 rounded-2xl object-cover shadow-douce" />
            )}
            <label className="btn-secondaire cursor-pointer">
              {photo ? "Changer de photo" : "Ajouter une photo"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => lirePhotoReduite(e.target.files?.[0], setPhoto)} />
            </label>
            {photo && (
              <button type="button" onClick={() => setPhoto("")} className="text-sm text-magique-texteClair underline">
                Retirer
              </button>
            )}
          </div>
          <input type="hidden" name="photo" value={photo} />
          <details className="text-sm" open={appearance.length > 0}>
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-magique-primaire">
              Pas de photo&nbsp;? Décrivez-le
            </summary>
            <input
              name="appearance"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              maxLength={240}
              placeholder="Ex : cheveux bruns bouclés, yeux verts, lunettes"
              className="champ mt-2"
            />
          </details>
        </div>
      </section>

      {/* ═══ Étape 2 : l'histoire ═══ */}
      <section className={etape === 1 ? "space-y-6" : "hidden"} aria-label="L'histoire">
        <div className="carte space-y-4">
          <h2 className="font-serif text-2xl">{prenom ? `Quelle histoire pour ${prenom} ?` : "Quelle histoire ?"}</h2>
          <input type="hidden" name="mode" value={mode} />
          {mode === "theme" && <input type="hidden" name="themeId" value={themeId} />}

          <div className="sans-barre -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {[...THEME_CATEGORIES.filter((c) => c.id !== "classiques"), ...THEME_CATEGORIES.filter((c) => c.id === "classiques")].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setMode("theme");
                  setCategorie(c.id);
                }}
                className={`flex min-h-11 flex-none items-center rounded-full border px-3 text-sm font-semibold transition ${
                  mode === "theme" && categorie === c.id ? "border-magique-primaire bg-magique-primaire text-nuit" : "border-magique-trait bg-white/[0.06] hover:border-magique-primaire"
                }`}
              >
                <Picto cle={`categories/${c.id}`} secours={c.emoji} taille={22} className="mr-1.5" />
                {c.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMode("libre")}
              className={`flex min-h-11 flex-none items-center rounded-full border px-3 text-sm font-semibold transition ${
                mode === "libre" ? "border-magique-primaire bg-magique-primaire text-nuit" : "border-magique-trait bg-white/[0.06] hover:border-magique-primaire"
              }`}
            >
              Mon idée à moi
            </button>
          </div>

          {mode === "theme" ? (
            <>
              {categorie === "classiques" && !abonnement.actif && (
                <p className="text-sm text-magique-texteClair">
                  Les grands classiques sont réservés aux membres du{" "}
                  <Link href="/club" className="font-semibold text-magique-primaire underline">
                    Club
                  </Link>
                  .
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Thèmes">
                {THEMES.filter((t) => t.categorie === categorie).map((t) => {
                  const actif = t.id === themeId;
                  const verrou = estClassique(t) && !abonnement.actif;
                  return (
                    <button key={t.id} type="button" role="radio" aria-checked={actif} onClick={() => choisirTheme(t.id)} className={`${tuile(actif)} flex items-start gap-3 p-3 ${verrou ? "opacity-70" : ""}`}>
                      {couvertureTheme(t.id) ? (
                        <CouvertureLivre src={couvertureTheme(t.id)} prenom={prenom} compact className="w-16 shrink-0" />
                      ) : (
                        <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={48} />
                      )}
                      <span>
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {t.titre}
                          {verrou && <span className="rounded-full bg-or/15 px-2 py-0.5 text-xs font-bold text-or">Club</span>}
                          {t.saison && <span className="rounded-full bg-magique-rose/15 px-2 py-0.5 text-xs font-bold text-or-clair">De saison</span>}
                        </span>
                        <span className="block text-sm text-magique-texteClair">{t.accroche}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="prompt" className="block font-semibold">
                Décrivez l'aventure (300 caractères max)
              </label>
              <textarea
                id="prompt"
                name="prompt"
                maxLength={300}
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex : Sami part acheter le pain et vit plein d'aventures."
                className="champ mt-2"
              />
              <p className="mt-1 text-right text-xs text-magique-texteClair">{prompt.length}/300</p>
            </div>
          )}
        </div>

        {/* Type de livre : réglé selon l'âge, modifiable */}
        <div className="carte space-y-3">
          <input type="hidden" name="format" value={formatValide} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Picto cle={`formats/${formatValide}`} secours={format?.emoji} taille={44} />
              <div>
                <p className="text-sm text-magique-texteClair">Type de livre pour {age} ans</p>
                <p className="font-semibold">{format?.label}</p>
              </div>
            </div>
            <button type="button" onClick={() => setVoirFormats((v) => !v)} className="inline-flex min-h-11 items-center text-sm font-semibold text-magique-primaire underline-offset-4 hover:underline">
              {voirFormats ? "Fermer" : "Changer"}
            </button>
          </div>
          {voirFormats && (
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Types de livre">
              {formats.map((f) => {
                const actif = f.id === formatValide;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={actif}
                    onClick={() => {
                      setFormatId(f.id);
                      if (f.styleConseille && stylesPourAge(age).includes(f.styleConseille)) setStyle(f.styleConseille);
                      setVoirFormats(false);
                    }}
                    className={`${tuile(actif)} flex items-start gap-3 p-3`}
                  >
                    <Picto cle={`formats/${f.id}`} secours={f.emoji} taille={40} />
                    <span>
                      <span className="block font-semibold">{f.label}</span>
                      <span className="block text-sm text-magique-texteClair">{f.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══ Étape 3 : les finitions ═══ */}
      <section className={etape === 2 ? "space-y-6" : "hidden"} aria-label="Les finitions">
        <div className="carte space-y-4">
          <div>
            <h2 className="font-serif text-2xl">Le style des dessins</h2>
            <p className="mt-1 text-sm text-magique-texteClair">Le style conseillé est déjà choisi. Seuls les styles adaptés à {age} ans sont proposés.</p>
          </div>
          <input type="hidden" name="style" value={styleAffiche} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Styles d'illustration">
            {stylesVisibles.map((s) => {
              const actif = styleAffiche === s;
              return (
                <button key={s} type="button" role="radio" aria-checked={actif} onClick={() => setStyle(s)} className={`${tuile(actif)} overflow-hidden`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={groupe.styles.includes(s) ? `/styles/ages/${groupe.slug}/${s}.webp` : `/styles/${s}.webp`}
                    alt={`Exemple du style ${ILLUSTRATION_STYLES[s].label}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <span className="flex items-center gap-1.5 p-2.5 text-sm font-semibold">
                    {actif && <span className="text-magique-primaire" aria-hidden="true">✓</span>}
                    {ILLUSTRATION_STYLES[s].label}
                  </span>
                </button>
              );
            })}
          </div>
          {stylesAge.length > 4 && (
            <button type="button" onClick={() => setVoirStyles((v) => !v)} className="inline-flex min-h-11 items-center text-sm font-semibold text-magique-primaire underline-offset-4 hover:underline">
              {voirStyles ? "Moins de styles" : `Voir les ${stylesAge.length} styles`}
            </button>
          )}
        </div>

        {format?.pages ? (
          <input type="hidden" name="longueur" value="moyenne" />
        ) : (
          <div className="carte space-y-3">
            <h2 className="font-serif text-2xl">La longueur</h2>
            <input type="hidden" name="longueur" value={longueur} />
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Longueur">
              {LONGUEURS.map((l) => (
                <button key={l.id} type="button" role="radio" aria-checked={longueur === l.id} onClick={() => setLongueur(l.id)} className={`${tuile(longueur === l.id)} min-h-14 p-3 text-center`}>
                  <span className="block font-semibold">{l.label}</span>
                  <span className="text-xs text-magique-texteClair">{l.detail}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <details className="carte" open={extras.length > 0}>
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
            <span className="font-serif text-xl">D'autres personnages ? <span className="text-base text-magique-texteClair">(facultatif)</span></span>
            <span className="hidden text-sm text-magique-primaire sm:inline">Frère, sœur, parent, doudou…</span>
          </summary>
          <div className="mt-4 space-y-4">
            {extras.map((x, i) => (
              <div key={i} className="grid gap-3 rounded-2xl border border-magique-trait p-4 sm:grid-cols-[1fr_1fr_auto]">
                <label className="block text-sm font-semibold">
                  Prénom ou nom
                  <input
                    name={`extra_${i}_name`}
                    required
                    maxLength={30}
                    value={x.name}
                    onChange={(e) => majExtra(i, { name: e.target.value })}
                    placeholder="Ex : Inès, Papi, Caramel"
                    className="champ mt-1"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  C'est…
                  <select name={`extra_${i}_role`} value={x.role} onChange={(e) => majExtra(i, { role: e.target.value })} className="champ mt-1">
                    {ROLES_EXTRAS.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setExtras((xs) => xs.filter((_, k) => k !== i))}
                  className="self-end rounded-full border border-magique-trait px-3 py-2 text-sm hover:border-red-300"
                  aria-label={`Retirer ${x.name || "ce personnage"}`}
                >
                  Retirer
                </button>
                <div className="sm:col-span-3">
                  <label className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-magique-primaire underline-offset-4 hover:underline">
                    {x.photo ? "✓ Photo ajoutée (changer)" : "Ajouter sa photo (pour qu'il lui ressemble)"}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => lirePhotoReduite(e.target.files?.[0], (d) => majExtra(i, { photo: d }))} />
                  </label>
                  <input type="hidden" name={`extra_${i}_photo`} value={x.photo} />
                </div>
              </div>
            ))}
            {extras.length < 3 && (
              <button type="button" className="btn-secondaire px-4 py-2 text-sm" onClick={() => setExtras((xs) => [...xs, { name: "", role: "frère", photo: "" }])}>
                + Ajouter un personnage
              </button>
            )}
            <p className="text-xs text-magique-texteClair">Les photos servent seulement à dessiner les personnages et ne sont jamais conservées.</p>
          </div>
        </details>

        <label className={`carte flex cursor-pointer items-start gap-3 ${abonnement.premium ? "hidden" : ""}`}>
          <input type="checkbox" name="premium" className="mt-1 h-5 w-5 accent-magique-primaire" />
          <span>
            <span className="font-serif text-lg">Édition premium</span>
            <span className="block text-sm text-magique-texteClair">
              Illustrations haute qualité et ressemblance renforcée, idéal pour imprimer et offrir. La lecture à l'écran reste gratuite ; le PDF premium est à {prixPremium} (au lieu de {prixStandard}).
            </span>
          </span>
        </label>

        {consentRequis && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/[0.05] p-4 text-sm">
            <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 flex-none accent-magique-primaire" />
            <span>
              Je suis le parent ou le représentant légal de cet enfant et j'accepte les{" "}
              <a href="/cgu" className="text-magique-primaire underline">conditions générales d'utilisation</a> et la{" "}
              <a href="/confidentialite" className="text-magique-primaire underline">politique de confidentialité</a>.
              <span className="mt-1 block text-xs text-magique-texteClair">Version des CGU : {termsVersion}. Votre consentement est enregistré avec sa date.</span>
            </span>
          </label>
        )}
      </section>

      {erreur && <Notice kind="erreur">{erreur}</Notice>}
      {bloque && etape < 2 && <p className="text-sm text-or-clair" role="status">{bloque}</p>}

      {/* Navigation : collée en bas de l'écran sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-nuit/95 px-4 py-3 backdrop-blur sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {etape > 0 && (
            <button type="button" onClick={() => setEtape((e) => e - 1)} className="btn-secondaire px-5">
              Retour
            </button>
          )}
          {etape < 2 ? (
            <button
              type="button"
              disabled={Boolean(bloque)}
              onClick={() => {
                setEtape((e) => e + 1);
                window.scrollTo({ top: 0 });
              }}
              className="btn-primaire flex-1 text-lg"
            >
              Continuer
            </button>
          ) : (
            <button type="submit" className="btn-primaire flex-1 text-lg" disabled={pending || classiqueVerrouille}>
              {pending ? "Création en cours…" : prenom ? `Créer le livre de ${prenom}` : "Créer le livre"}
            </button>
          )}
        </div>
      </div>

      {pending && <GenerationOverlay prenom={prenom || undefined} themeId={mode === "theme" ? themeId : undefined} />}
    </form>
  );
}

/** Attente du portrait : un message qui évolue, le modèle de ressemblance pouvant être lent au démarrage. */
function AttentePortrait({ prenom }: { prenom: string }) {
  const [secondes, setSecondes] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecondes((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-2 py-8 text-center" aria-live="polite">
      <p className="font-serif text-xl">Nous dessinons le portrait de {prenom}…</p>
      <p className="text-sm text-magique-texteClair">
        {secondes < 30
          ? "Environ 30 secondes."
          : secondes < 75
            ? "Le dessinateur s'installe, c'est un peu plus long au premier portrait. Encore un instant…"
            : "Presque fini : nous peaufinons son visage."}
      </p>
    </div>
  );
}
