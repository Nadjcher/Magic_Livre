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
import Notice from "./Notice";
import Link from "next/link";

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
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        <label htmlFor="childId" className="block font-semibold">
          Pour quel enfant ?
        </label>
        <select id="childId" name="childId" required className="champ mt-2">
          {enfants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} ({c.age} ans)
            </option>
          ))}
        </select>
      </div>

      {/* Mode : héros ou aventure libre */}
      <div className="carte space-y-4">
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
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 hover:border-magique-primaire"
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

      {/* Longueur */}
      <div className="carte">
        <label htmlFor="longueur" className="block font-semibold">
          Longueur de l'histoire
        </label>
        <select id="longueur" name="longueur" defaultValue="moyenne" className="champ mt-2">
          <option value="courte">Courte (8-9 pages)</option>
          <option value="moyenne">Moyenne (10-11 pages)</option>
          <option value="longue">Longue (11-12 pages)</option>
        </select>
      </div>

      {erreur && <Notice kind="erreur">{erreur}</Notice>}

      <button type="submit" className="btn-primaire w-full" disabled={pending}>
        {pending ? "Création de l'histoire en cours…" : "Créer le livre"}
      </button>

      {pending && (
        <Notice kind="info">
          Nous écrivons l'histoire… Cela prend généralement moins d'une minute.
          Vous pouvez aussi{" "}
          <Link href="/bibliotheque" className="underline">
            revenir à votre bibliothèque
          </Link>
          .
        </Notice>
      )}
    </form>
  );
}
