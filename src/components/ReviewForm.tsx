"use client";

/** Formulaire d'avis : note en étoiles, commentaire, prénom affiché. */

import { useState, useTransition } from "react";
import { deposerAvis } from "@/app/actions/reviews";
import Notice from "./Notice";

export default function ReviewForm({ bookId, age, initial }: { bookId: string; age: number; initial?: { note: number; texte: string } }) {
  const [note, setNote] = useState(initial?.note ?? 0);
  const [survol, setSurvol] = useState(0);
  const [etat, setEtat] = useState<{ ok: boolean; t: string } | null>(null);
  const [pending, start] = useTransition();

  if (etat?.ok) return <Notice kind="succes">{etat.t}</Notice>;

  return (
    <form
      className="space-y-4"
      action={(fd) =>
        start(async () => {
          fd.set("note", String(note));
          const r = await deposerAvis(fd);
          setEtat({ ok: r.ok, t: r.message });
        })
      }
    >
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="age" value={String(age)} />
      <fieldset>
        <legend className="mb-2 font-semibold">Votre note</legend>
        <div className="flex gap-1" onMouseLeave={() => setSurvol(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              aria-pressed={note === n}
              onMouseEnter={() => setSurvol(n)}
              onClick={() => setNote(n)}
              className={`text-4xl transition ${(survol || note) >= n ? "text-[#ffd36e]" : "text-white/25"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold">
        Votre avis
        <textarea
          name="texte"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          defaultValue={initial?.texte}
          placeholder="Ex : Mon fils s'est reconnu tout de suite, il veut la relire tous les soirs !"
          className="champ mt-1"
        />
      </label>
      <label className="block text-sm font-semibold">
        Votre prénom (affiché avec l'avis)
        <input name="prenom" required maxLength={30} className="champ mt-1" placeholder="Ex : Sarah" />
      </label>
      <p className="text-xs text-magique-texteClair">
        Affiché ainsi : « Sarah, parent d'un enfant de {age} ans ». Le prénom de votre enfant n'est jamais publié.
      </p>
      {etat && !etat.ok && <Notice kind="erreur">{etat.t}</Notice>}
      <button type="submit" className="btn-primaire" disabled={pending || note === 0}>
        {pending ? "Envoi…" : "Publier mon avis"}
      </button>
    </form>
  );
}
