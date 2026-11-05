"use client";

/**
 * Formulaire de création de livre : choix de l'enfant, thème du catalogue (ou
 * idée libre), style, apparence, longueur. Affiche les refus liés aux
 * personnages protégés et un indicateur de progression pendant la génération.
 */

import Picto from "@/components/Picto";
import { useState, useTransition } from "react";
import { findFormat, formatParDefaut, formatsPourAge } from "@/lib/bookFormats";
import { ROLES_EXTRAS } from "@/lib/validation";
import { groupePourAge } from "@/lib/ageGroups";
import { useRouter } from "next/navigation";
import { createBook } from "@/app/actions/books";
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

/** En-tête d'étape : pastille dorée numérotée + intitulé en serif. */
function Etape({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-parch-2 font-serif font-semibold text-or-fonce">
        {n}
      </span>
      <span className="font-serif text-xl">{children}</span>
    </div>
  );
}

export default function CreateBookForm({
  enfants,
  initialThemeId,
  prixStandard,
  prixPremium,
  abonnement,
}: {
  enfants: ChildView[];
  /** Thème présélectionné (lien « Créer ce livre » du catalogue). */
  initialThemeId?: string;
  prixStandard: string;
  prixPremium: string;
  /** Abonnement Club (livres inclus restants, accès aux classiques). */
  abonnement: { actif: boolean; label: string; restants: number; quota: number; premium: boolean };
}) {
  const router = useRouter();
  const themeInitial = findThemeById(initialThemeId) ?? THEMES.find((t) => !estClassique(t))!;
  const [mode, setMode] = useState<"theme" | "libre">("theme");
  const [themeId, setThemeId] = useState(themeInitial.id);
  const [categorie, setCategorie] = useState<ThemeCategory>(themeInitial.categorie);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<IllustrationStyle>(themeInitial.style ?? "feerique");

  /** Choisit un thème et présélectionne son style d'illustration conseillé. */
  function choisirTheme(id: string) {
    setThemeId(id);
    const t = findThemeById(id);
    if (t?.style) setStyle(t.style);
  }
  const [photo, setPhoto] = useState<string>("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    lirePhotoReduite(e.target.files?.[0], setPhoto);
  }

  // Enfant choisi → types de livres adaptés à son âge.
  const [childId, setChildId] = useState(enfants[0]?.id ?? "");
  const age = enfants.find((c) => c.id === childId)?.age ?? 5;
  const formats = formatsPourAge(age);
  const [formatId, setFormatId] = useState(formatParDefaut(enfants[0]?.age ?? 5).id);
  const format = findFormat(formatId);

  // Styles de dessin adaptés à l'âge (pas de manga ni de BD pour un tout-petit).
  // Styles conseillés pour son âge d'abord, puis les autres styles autorisés.
  const groupe = groupePourAge(age);
  const stylesAge = [...groupe.styles.filter((k) => stylesPourAge(age).includes(k)), ...stylesPourAge(age).filter((k) => !groupe.styles.includes(k))];
  const styleAffiche: IllustrationStyle = stylesAge.includes(style) ? style : "feerique";

  function choisirEnfant(id: string) {
    setChildId(id);
    const a = enfants.find((c) => c.id === id)?.age ?? 5;
    if (!formatsPourAge(a).some((f) => f.id === formatId)) setFormatId(formatParDefaut(a).id);
    if (!stylesPourAge(a).includes(style)) setStyle("feerique");
  }

  const classiqueVerrouille = mode === "theme" && estClassique(findThemeById(themeId)) && !abonnement.actif;

  // Autres personnages (famille, doudou, animal) : jusqu'à 3.
  const [extras, setExtras] = useState<Extra[]>([]);
  const majExtra = (i: number, patch: Partial<Extra>) =>
    setExtras((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  if (enfants.length === 0) {
    return (
      <Notice kind="info">
        Vous devez d'abord ajouter un enfant.{" "}
        <Link href="/enfants" className="underline">
          Gérer mes enfants
        </Link>
        .
      </Notice>
    );
  }

  return (
    <form
      className="space-y-6"
      action={(formData) =>
        startTransition(async () => {
          setErreur(null);
          const res = await createBook(formData);
          if (res.ok && res.bookId) {
            router.push(`/bibliotheque/${res.bookId}`);
          } else {
            setErreur(res.message);
          }
        })
      }
    >
      {abonnement.actif ? (
        <Notice kind="succes">
          👑 {abonnement.label} : {abonnement.restants > 0
            ? `ce livre est inclus (${abonnement.restants} sur ${abonnement.quota} restant${abonnement.restants > 1 ? "s" : ""} ce mois-ci)${abonnement.premium ? ", en édition premium" : ""}.`
            : "vos livres du mois sont utilisés ; celui-ci sera lisible gratuitement, et téléchargeable à l'unité."}
        </Notice>
      ) : null}

      {/* Choix de l'enfant */}
      <div data-tilt className="carte">
        <Etape n="1">
          <label htmlFor="childId">Pour quel enfant&nbsp;?</label>
        </Etape>
        <select
          id="childId"
          name="childId"
          required
          className="champ"
          value={childId}
          onChange={(e) => choisirEnfant(e.target.value)}
        >
          {enfants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} ({c.age} ans)
            </option>
          ))}
        </select>
      </div>

      {/* Type de livre, selon l'âge */}
      <div data-tilt className="carte">
        <Etape n="2">Quel type de livre&nbsp;?</Etape>
        <input type="hidden" name="format" value={formatId} />
        <p className="-mt-1 mb-3 text-sm text-magique-texteClair">
          Les livres conçus pour {age} ans.
        </p>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Types de livre">
          {formats.map((f) => {
            const actif = f.id === formatId;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => {
                  setFormatId(f.id);
                  // Style conseillé pour ce type de livre (s'il convient à l'âge).
                  if (f.styleConseille && stylesPourAge(age).includes(f.styleConseille)) setStyle(f.styleConseille);
                }}
                className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                  actif
                    ? "border-magique-primaire bg-magique-primaire/10 shadow-douce"
                    : "border-magique-trait hover:border-magique-primaire"
                }`}
              >
                <Picto cle={`formats/${f.id}`} secours={f.emoji} taille={44} />
                <span>
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {f.label}
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-magique-texteClair">
                      {f.ageMin}–{f.ageMax} ans
                    </span>
                  </span>
                  <span className="block text-sm text-magique-texteClair">{f.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thème : catalogue ou idée libre */}
      <div data-tilt className="carte space-y-4">
        <Etape n="3">Quelle histoire&nbsp;?</Etape>
        <input type="hidden" name="mode" value={mode} />
        {mode === "theme" && <input type="hidden" name="themeId" value={themeId} />}

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {THEME_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setMode("theme");
                setCategorie(c.id);
              }}
              className={`flex-none rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                mode === "theme" && categorie === c.id
                  ? "border-magique-primaire bg-magique-primaire text-nuit"
                  : "border-magique-trait bg-white/[0.06] hover:border-magique-primaire"
              }`}
            >
              <Picto cle={`categories/${c.id}`} secours={c.emoji} taille={22} className="-my-1 mr-1 inline-block align-middle" />
              {c.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMode("libre")}
            className={`flex-none rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              mode === "libre"
                ? "border-magique-primaire bg-magique-primaire text-nuit"
                : "border-magique-trait bg-white/[0.06] hover:border-magique-primaire"
            }`}
          >
            ✏️ Mon idée à moi
          </button>
        </div>

        {mode === "theme" ? (
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Thèmes">
            {THEMES.filter((t) => t.categorie === categorie).map((t) => {
              const actif = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => choisirTheme(t.id)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                    actif
                      ? "border-magique-primaire bg-magique-primaire/5 shadow-douce"
                      : "border-magique-trait hover:border-magique-primaire"
                  }`}
                >
                  <Picto cle={`themes/${t.id}`} secours={t.emoji} taille={48} />
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {t.titre}
                      {estClassique(t) && !abonnement.actif && (
                        <span className="rounded-full bg-or/15 px-2 py-0.5 text-xs font-bold text-or">👑 Club</span>
                      )}
                      {t.saison && (
                        <span className="rounded-full bg-magique-rose/15 px-2 py-0.5 text-xs font-bold text-or-clair">
                          De saison
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-magique-texteClair">{t.accroche}</span>
                  </span>
                </button>
              );
            })}
          </div>
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
            <p className="mt-1 text-right text-xs text-magique-texteClair">
              {prompt.length}/300
            </p>
          </div>
        )}
      </div>

      {/* Style des illustrations */}
      <div data-tilt className="carte">
        <Etape n="4">Le style des illustrations</Etape>
        <input type="hidden" name="style" value={styleAffiche} />
        <p className="-mt-1 mb-3 text-sm text-magique-texteClair">
          La même scène dessinée dans chaque style. Seuls les styles adaptés à {age} ans sont proposés.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Styles d'illustration">
          {stylesAge.map((s) => {
            const actif = styleAffiche === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setStyle(s)}
                className={`overflow-hidden rounded-xl border-2 text-left transition ${
                  actif
                    ? "border-magique-primaire bg-magique-primaire/5 shadow-douce"
                    : "border-magique-trait hover:border-magique-primaire"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={groupe.styles.includes(s) ? `/styles/ages/${groupe.slug}/${s}.webp` : `/styles/${s}.webp`}
                  alt={`Exemple du style ${ILLUSTRATION_STYLES[s].label}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="block p-2.5">
                  <span className="flex items-center gap-1.5 font-semibold">
                    {actif && <span className="text-magique-primaire" aria-hidden="true">✓</span>}
                    {ILLUSTRATION_STYLES[s].label}
                  </span>
                  <span className="block text-xs text-magique-texteClair sm:text-sm">
                    {ILLUSTRATION_STYLES[s].description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Apparence : description et/ou photo (optionnel) */}
      <div data-tilt className="carte space-y-3">
        <Etape n="5">
          <label htmlFor="appearance">
            À quoi ressemble l'enfant&nbsp;?{" "}
            <span className="text-base font-normal not-italic text-magique-texteClair">(optionnel)</span>
          </label>
        </Etape>
        <input
          id="appearance"
          name="appearance"
          maxLength={160}
          placeholder="Ex : cheveux bruns bouclés, yeux verts, lunettes"
          className="champ"
        />
        <div>
          <label htmlFor="photo" className="block text-sm font-semibold">
            Ou ajouter une photo
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="mt-1 block w-full text-sm text-magique-texteClair"
          />
          <input type="hidden" name="photo" value={photo} />
          <p className="mt-1 text-xs text-magique-texteClair">
            🔒 La photo sert uniquement à dessiner un héros qui ressemble à votre
            enfant, au moment de la génération. Elle n'est <strong>jamais conservée</strong> :
            le livre contient une illustration, pas la vraie photo.
          </p>
        </div>
      </div>

      {/* Autres personnages */}
      <div data-tilt className="carte space-y-4">
        <Etape n="6">
          D'autres personnages&nbsp;?{" "}
          <span className="text-base font-normal not-italic text-magique-texteClair">(optionnel)</span>
        </Etape>
        <p className="-mt-2 text-sm text-magique-texteClair">
          Un frère, une sœur, un parent, le doudou ou le chat de la maison : ajoutez-les
          avec une photo, ils vivront l'aventure aux côtés de votre enfant (3 maximum).
        </p>
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
              <select
                name={`extra_${i}_role`}
                value={x.role}
                onChange={(e) => majExtra(i, { role: e.target.value })}
                className="champ mt-1"
              >
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
              <label className="block text-sm font-semibold">
                Photo (pour qu'il lui ressemble)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => lirePhotoReduite(e.target.files?.[0], (d) => majExtra(i, { photo: d }))}
                  className="mt-1 block w-full text-sm text-magique-texteClair"
                />
              </label>
              <input type="hidden" name={`extra_${i}_photo`} value={x.photo} />
              {x.photo && <p className="mt-1 text-xs text-magique-texteClair">✓ Photo ajoutée</p>}
            </div>
          </div>
        ))}
        {extras.length < 3 && (
          <button
            type="button"
            className="btn-secondaire px-4 py-2 text-sm"
            onClick={() => setExtras((xs) => [...xs, { name: "", role: "frère", photo: "" }])}
          >
            + Ajouter un personnage
          </button>
        )}
        <p className="text-xs text-magique-texteClair">
          🔒 Comme pour votre enfant, les photos servent seulement à dessiner les
          personnages et ne sont jamais conservées.
        </p>
      </div>

      {/* Longueur (sauf pour les formats à nombre de pages fixe) */}
      {format?.pages ? (
        <input type="hidden" name="longueur" value="moyenne" />
      ) : (
        <div data-tilt className="carte">
          <Etape n="7">
            <label htmlFor="longueur">La longueur de l'histoire</label>
          </Etape>
          <select id="longueur" name="longueur" defaultValue="moyenne" className="champ">
            <option value="courte">Courte (8-9 pages)</option>
            <option value="moyenne">Moyenne (10-11 pages)</option>
            <option value="longue">Longue (11-12 pages)</option>
          </select>
        </div>
      )}

      {/* Édition premium : illustrations haute qualité (payante au téléchargement) */}
      <label className={`carte flex cursor-pointer items-start gap-3 ${abonnement.premium ? "hidden" : ""}`}>
        <input type="checkbox" name="premium" className="mt-1 h-5 w-5 accent-magique-primaire" />
        <span>
          <span className="font-serif text-lg">✦ Édition premium</span>
          <span className="block text-sm text-magique-texteClair">
            Illustrations haute qualité et ressemblance renforcée (modèle avancé),
            idéal pour imprimer et offrir. La lecture à l'écran reste gratuite ;
            le PDF premium est à {prixPremium} au téléchargement (au lieu de {prixStandard}).
          </span>
        </span>
      </label>

      {classiqueVerrouille && (
        <Notice kind="info">
          « {findThemeById(themeId)?.titre} » fait partie des grands classiques revisités, réservés aux membres du Club.{" "}
          <Link href="/club" className="font-semibold underline">Découvrir le Club</Link>
        </Notice>
      )}

      {erreur && <Notice kind="erreur">{erreur}</Notice>}

      <button type="submit" className="btn-primaire w-full text-lg" disabled={pending || classiqueVerrouille}>
        {pending ? "Création de l'histoire en cours…" : "✦ Créer le livre"}
      </button>

      {pending && <GenerationOverlay />}
    </form>
  );
}
