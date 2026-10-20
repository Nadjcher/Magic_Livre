"use client";

/**
 * Formulaire de création de livre : choix de l'enfant, héros original ou
 * aventure libre, longueur. Affiche les refus liés aux personnages protégés
 * et un indicateur de progression pendant la génération.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBook } from "@/app/actions/books";
import type { Hero } from "@/lib/heroes";
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
  heroes,
}: {
  enfants: ChildView[];
  heroes: readonly Hero[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"hero" | "libre">("hero");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<IllustrationStyle>("feerique");
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
      <div className="carte">
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

      {/* Mode : héros ou aventure libre */}
      <div className="carte space-y-4">
        <Etape n="2">Quel genre d'aventure&nbsp;?</Etape>
        <div className="flex gap-4">
          <button
            type="button"
            className={mode === "hero" ? "btn-primaire" : "btn-secondaire"}
            onClick={() => setMode("hero")}
          >
            Héros original
          </button>
          <button
            type="button"
            className={mode === "libre" ? "btn-primaire" : "btn-secondaire"}
            onClick={() => setMode("libre")}
          >
            Aventure libre
          </button>
        </div>
        <input type="hidden" name="mode" value={mode} />

        {mode === "hero" ? (
          <fieldset className="grid gap-3 sm:grid-cols-2">
            {heroes.map((h, i) => (
              <label
                key={h.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-magique-primaire has-[:checked]:border-magique-primaire has-[:checked]:bg-magique-primaire/5 has-[:checked]:shadow-or"
              >
                <input
                  type="radio"
                  name="heroId"
                  value={h.id}
                  defaultChecked={i === 0}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold">
                    {h.emoji} {h.nom}
                  </span>
                  <span className="block text-sm text-magique-texteClair">
                    {h.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
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
      <div className="carte">
        <Etape n="3">Le style des illustrations</Etape>
        <input type="hidden" name="style" value={style} />
        <div className="grid gap-3 sm:grid-cols-3">
          {STYLE_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`rounded-xl border-2 p-3 text-left transition ${
                style === s
                  ? "anim-pulse-or border-magique-primaire bg-magique-primaire/5"
                  : "border-gray-200 hover:border-magique-primaire"
              }`}
            >
              <span className="font-semibold">{ILLUSTRATION_STYLES[s].label}</span>
              <span className="block text-sm text-magique-texteClair">
                {ILLUSTRATION_STYLES[s].description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Apparence : description et/ou photo (optionnel) */}
      <div className="carte space-y-3">
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
            🔒 La photo ne quitte votre navigateur que pour en décrire l'apparence,
            n'est jamais stockée, et la vraie photo n'apparaît pas dans le livre
            (nous dessinons un héros inspiré).
          </p>
        </div>
      </div>

      {/* Longueur */}
      <div className="carte">
        <Etape n="5">
          <label htmlFor="longueur">La longueur de l'histoire</label>
        </Etape>
        <select id="longueur" name="longueur" defaultValue="moyenne" className="champ">
          <option value="courte">Courte (8-9 pages)</option>
          <option value="moyenne">Moyenne (10-11 pages)</option>
          <option value="longue">Longue (11-12 pages)</option>
        </select>
      </div>

      {erreur && <Notice kind="erreur">{erreur}</Notice>}

      <button type="submit" className="btn-primaire w-full text-lg" disabled={pending}>
        {pending ? "Création de l'histoire en cours…" : "✦ Créer le livre"}
      </button>

      {pending && <GenerationOverlay />}
    </form>
  );
}
