"use client";

/**
 * Formulaire de création de livre : choix de l'enfant, thème du catalogue (ou
 * idée libre), style, apparence, longueur. Affiche les refus liés aux
 * personnages protégés et un indicateur de progression pendant la génération.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBook } from "@/app/actions/books";
import { THEMES, THEME_CATEGORIES, findThemeById, type ThemeCategory } from "@/lib/themes";
import type { ChildView } from "./ChildrenManager";
import { ILLUSTRATION_STYLES, type IllustrationStyle } from "@/lib/style_config";
import Notice from "./Notice";
import GenerationOverlay from "./GenerationOverlay";
import Link from "next/link";

const STYLE_KEYS = Object.keys(ILLUSTRATION_STYLES) as IllustrationStyle[];

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
}: {
  enfants: ChildView[];
  /** Thème présélectionné (lien « Créer ce livre » du catalogue). */
  initialThemeId?: string;
  prixStandard: string;
  prixPremium: string;
}) {
  const router = useRouter();
  const themeInitial = findThemeById(initialThemeId) ?? THEMES[0]!;
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

  /**
   * Lit une photo, la redimensionne (max 512 px) et la convertit en data URL
   * JPEG légère. L'image reste dans le navigateur : elle n'est envoyée au
   * serveur qu'à la création, pour en extraire une description, puis oubliée.
   */
  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhoto("");
      return;
    }
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
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

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
      {/* Choix de l'enfant */}
      <div data-tilt className="carte">
        <Etape n="1">
          <label htmlFor="childId">Pour quel enfant&nbsp;?</label>
        </Etape>
        <select id="childId" name="childId" required className="champ">
          {enfants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} ({c.age} ans)
            </option>
          ))}
        </select>
      </div>

      {/* Thème : catalogue ou idée libre */}
      <div data-tilt className="carte space-y-4">
        <Etape n="2">Quelle histoire&nbsp;?</Etape>
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
                  ? "border-magique-primaire bg-magique-primaire text-white"
                  : "border-magique-trait bg-white/70 hover:border-magique-primaire"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMode("libre")}
            className={`flex-none rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              mode === "libre"
                ? "border-magique-primaire bg-magique-primaire text-white"
                : "border-magique-trait bg-white/70 hover:border-magique-primaire"
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
                      ? "border-magique-primaire bg-magique-primaire/5 shadow-or"
                      : "border-magique-trait hover:border-magique-primaire"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {t.titre}
                      {t.saison && (
                        <span className="rounded-full bg-magique-rose/15 px-2 py-0.5 text-xs font-bold text-magique-rose">
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
        <Etape n="3">Le style des illustrations</Etape>
        <input type="hidden" name="style" value={style} />
        <p className="-mt-1 mb-3 text-sm text-magique-texteClair">
          La même scène dessinée dans chaque style : choisissez celui qui vous plaît.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Styles d'illustration">
          {STYLE_KEYS.map((s) => {
            const actif = style === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setStyle(s)}
                className={`overflow-hidden rounded-xl border-2 text-left transition ${
                  actif
                    ? "border-magique-primaire bg-magique-primaire/5 shadow-or"
                    : "border-magique-trait hover:border-magique-primaire"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/styles/${s}.webp`}
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
        <Etape n="4">
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

      {/* Longueur */}
      <div data-tilt className="carte">
        <Etape n="5">
          <label htmlFor="longueur">La longueur de l'histoire</label>
        </Etape>
        <select id="longueur" name="longueur" defaultValue="moyenne" className="champ">
          <option value="courte">Courte (8-9 pages)</option>
          <option value="moyenne">Moyenne (10-11 pages)</option>
          <option value="longue">Longue (11-12 pages)</option>
        </select>
      </div>

      {/* Édition premium : illustrations haute qualité (payante au téléchargement) */}
      <label className="carte flex cursor-pointer items-start gap-3">
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

      {erreur && <Notice kind="erreur">{erreur}</Notice>}

      <button type="submit" className="btn-primaire w-full text-lg" disabled={pending}>
        {pending ? "Création de l'histoire en cours…" : "✦ Créer le livre"}
      </button>

      {pending && <GenerationOverlay />}
    </form>
  );
}
