"use client";

/**
 * Gestion des enfants : ajout, modification et suppression, côté client.
 * Appelle les Server Actions et affiche des messages clairs en français.
 */

import { useState, useTransition } from "react";
import { addChild, updateChild, deleteChild } from "@/app/actions/children";
import Notice from "./Notice";

export interface ChildView {
  id: string;
  firstName: string;
  age: number;
}

export default function ChildrenManager({ initial }: { initial: ChildView[] }) {
  const [message, setMessage] = useState<{ kind: "succes" | "erreur"; texte: string } | null>(
    null,
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>, onOk?: () => void) {
    startTransition(async () => {
      const res = await action();
      setMessage({ kind: res.ok ? "succes" : "erreur", texte: res.message });
      if (res.ok && onOk) onOk();
    });
  }

  return (
    <div className="space-y-6">
      {message && <Notice kind={message.kind}>{message.texte}</Notice>}

      {/* Formulaire d'ajout */}
      <form
        className="carte-relief flex flex-wrap items-end gap-4 p-6"
        action={(formData) => run(() => addChild(formData), () => {
          // Réinitialise le formulaire après ajout réussi.
          (document.getElementById("form-ajout") as HTMLFormElement | null)?.reset();
        })}
        id="form-ajout"
      >
        <div className="flex-1">
          <label htmlFor="firstName" className="block text-sm font-semibold">
            Prénom de l'enfant
          </label>
          <input id="firstName" name="firstName" required maxLength={40} className="champ mt-1" />
        </div>
        <div className="w-24">
          <label htmlFor="age" className="block text-sm font-semibold">
            Âge
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={1}
            max={12}
            required
            className="champ mt-1"
          />
        </div>
        <button type="submit" className="btn-primaire" disabled={pending}>
          Ajouter
        </button>
      </form>

      {/* Liste des enfants */}
      <ul className="space-y-3">
        {initial.length === 0 && (
          <li className="carte-relief flex flex-col items-center gap-2 py-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/feerique/imagine.webp"
              alt="Un enfant qui rêve son histoire"
              className="h-40 w-40 object-contain"
            />
            <p className="text-magique-texteClair">
              Aucun enfant pour l'instant. Ajoutez-en un pour commencer la première histoire.
            </p>
          </li>
        )}
        {initial.map((child) => (
          <li
            key={child.id}
            {...(editId === child.id ? {} : { "data-tilt": true })}
            className="carte-relief p-5"
          >
            {editId === child.id ? (
              <form
                className="flex flex-wrap items-end gap-4"
                action={(formData) =>
                  run(() => updateChild(child.id, formData), () => setEditId(null))
                }
              >
                <div className="flex-1">
                  <label className="block text-sm font-semibold">Prénom</label>
                  <input
                    name="firstName"
                    defaultValue={child.firstName}
                    required
                    maxLength={40}
                    className="champ mt-1"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-semibold">Âge</label>
                  <input
                    name="age"
                    type="number"
                    min={1}
                    max={12}
                    defaultValue={child.age}
                    required
                    className="champ mt-1"
                  />
                </div>
                <button type="submit" className="btn-primaire" disabled={pending}>
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="btn-secondaire"
                  onClick={() => setEditId(null)}
                >
                  Annuler
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span
                    className="relief-avant flex h-11 w-11 flex-none items-center justify-center rounded-full font-serif text-lg text-white shadow-or"
                    style={{ backgroundImage: "linear-gradient(160deg,#5b9bff,#4f5fe0)" }}
                    aria-hidden="true"
                  >
                    {child.firstName.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="relief-milieu leading-tight">
                    <span className="block font-serif text-lg text-magique-texte">{child.firstName}</span>
                    <span className="block text-sm text-magique-texteClair">{child.age} ans</span>
                  </span>
                </span>
                <div className="flex gap-3">
                  <button
                    className="text-magique-primaire hover:underline"
                    onClick={() => setEditId(child.id)}
                  >
                    Modifier
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => {
                      if (
                        confirm(
                          `Supprimer ${child.firstName} ? Les livres liés seront aussi supprimés.`,
                        )
                      ) {
                        run(() => deleteChild(child.id));
                      }
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
