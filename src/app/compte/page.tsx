/**
 * Page « Mon compte » : informations, achats, sécurité (mot de passe,
 * confirmation d'email) et suppression du compte (RGPD).
 */

import type { Metadata } from "next";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasParentalConsent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatEuros, getDeluxeProduct, PACK_TOUT } from "@/lib/products";
import { libelleStatut, suiviGelato } from "@/lib/print";
import { getAbonnement } from "@/lib/subscription";
import Notice from "@/components/Notice";
import EnTetePage from "@/components/EnTetePage";
import {
  ChangePasswordForm,
  DeleteAccountForm,
  ResendVerificationButton,
} from "@/components/AccountForms";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Espace personnel Encore une histoire.",
  robots: { index: false, follow: false },
};


export const dynamic = "force-dynamic";

function libelleProduit(sku: string): string {
  if (sku === "book") return "Livre PDF + kit";
  if (sku === PACK_TOUT.sku) return PACK_TOUT.label;
  return getDeluxeProduct(sku)?.label ?? sku;
}

export default async function ComptePage({ searchParams }: { searchParams: { club?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/compte");

  const consent = hasParentalConsent(user);
  const [nbEnfants, nbLivres, achats] = await Promise.all([
    prisma.child.count({ where: { userId: user.id } }),
    prisma.book.count({ where: { userId: user.id, deletedAt: null } }),
    prisma.order.findMany({
      where: { userId: user.id, status: "paid" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sku: true,
        amount: true,
        createdAt: true,
        book: { select: { id: true, title: true, deletedAt: true } },
      },
    }),
  ]);
  const total = achats.reduce((n, a) => n + a.amount, 0);
  const ab = await getAbonnement(user.id);

  // Livres imprimés : statut et suivi de colis chez l'imprimeur.
  const lignesImpression = await prisma.$queryRaw<{ id: string; title: string; imp: unknown }[]>`
    SELECT id, title, pages->'impressions' AS imp FROM "Book"
    WHERE "userId" = ${user.id} AND "deletedAt" IS NULL AND pages ? 'impressions'`;
  const impressions = (
    await Promise.all(
      lignesImpression.flatMap((l) =>
        (Array.isArray(l.imp) ? (l.imp as { gelatoId: string; creeLe: number }[]) : []).map(async (i) => ({
          titre: l.title,
          date: new Date(i.creeLe),
          suivi: await suiviGelato(i.gelatoId),
        })),
      ),
    )
  ).sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EnTetePage surtitre="Vos informations" titre="Mon compte" />

      {/* Profil */}
      <section className="carte space-y-4">
        <h2 className="text-xl">Profil</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-magique-texteClair">Adresse email</dt>
            <dd className="break-all font-semibold">{user.email}</dd>
          </div>
          <div>
            <dt className="text-magique-texteClair">Membre depuis</dt>
            <dd className="font-semibold">{user.createdAt.toLocaleDateString("fr-FR")}</dd>
          </div>
          <div>
            <dt className="text-magique-texteClair">Enfants · Livres</dt>
            <dd className="font-semibold">
              <Link href="/enfants" className="underline-offset-2 hover:underline">
                {nbEnfants} enfant{nbEnfants > 1 ? "s" : ""}
              </Link>{" "}
              ·{" "}
              <Link href="/bibliotheque" className="underline-offset-2 hover:underline">
                {nbLivres} livre{nbLivres > 1 ? "s" : ""}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-magique-texteClair">Consentement parental</dt>
            <dd className="font-semibold">
              {consent
                ? `Enregistré le ${user.parentalConsentAt?.toLocaleDateString("fr-FR")}`
                : "Non enregistré"}
            </dd>
          </div>
        </dl>
        <div className="rounded-2xl border border-magique-trait p-4">
          {user.emailVerified ? (
            <p className="text-sm">✅ Adresse email confirmée.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                ✉️ Votre adresse n'est pas encore confirmée. Confirmez-la pour être
                sûr de recevoir vos reçus et de pouvoir récupérer votre compte.
              </p>
              <ResendVerificationButton />
            </div>
          )}
        </div>
      </section>

      {searchParams.club === "bienvenue" && ab.actif && (
        <Notice kind="succes">Bienvenue dans {ab.label} ! Vos {ab.quota} livres du mois vous attendent.</Notice>
      )}

      {/* Abonnement */}
      <section className="carte space-y-3">
        <h2 className="text-xl">Mon abonnement</h2>
        {ab.actif ? (
          <>
            <p>
              <strong>{ab.label}</strong> · {ab.restants} livre{ab.restants > 1 ? "s" : ""} restant{ab.restants > 1 ? "s" : ""} sur {ab.quota} ce mois-ci
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-magique-primaire" style={{ width: `${(ab.utilises / ab.quota) * 100}%` }} />
            </div>
            <p className="text-sm text-magique-texteClair">
              {ab.cancelAtPeriodEnd
                ? `Résilié : actif jusqu'au ${ab.periodEnd?.toLocaleDateString("fr-FR")}.`
                : `Prochain renouvellement le ${ab.periodEnd?.toLocaleDateString("fr-FR")} (le compteur repart à zéro).`}
            </p>
            <Link href="/club" className="btn-primaire w-fit px-5 py-2 text-sm">
              Ouvrir mon espace Club
            </Link>
          </>
        ) : (
          <p className="text-sm text-magique-texteClair">
            Pas d'abonnement.{" "}
            <Link href="/club" className="font-semibold text-magique-primaire underline">
              Découvrir le Club
            </Link>{" "}
            : un nouveau livre chaque semaine et les grands classiques revisités.
          </p>
        )}
      </section>

      {/* Achats */}
      <section className="carte space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Mes achats</h2>
          {achats.length > 0 && (
            <span className="text-sm text-magique-texteClair">Total : {formatEuros(total)}</span>
          )}
        </div>
        {achats.length === 0 ? (
          <p className="text-sm text-magique-texteClair">
            Aucun achat pour l'instant. La lecture à l'écran est gratuite ; vous
            ne payez que les téléchargements.
          </p>
        ) : (
          <ul className="divide-y divide-magique-trait">
            {achats.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold">{a.amount === 0 && a.sku === "book" ? "Livre inclus dans l'abonnement" : libelleProduit(a.sku)}</p>
                  <p className="text-magique-texteClair">
                    {a.book.title} · {a.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatEuros(a.amount)}</span>
                  {!a.book.deletedAt && (
                    <Link
                      href={`/bibliotheque/${a.book.id}/boutique`}
                      className="rounded-full border border-magique-trait px-3 py-1 font-semibold hover:border-magique-primaire"
                    >
                      Télécharger
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {impressions.length > 0 && (
        <section className="carte space-y-4">
          <h2 className="text-xl">Mes livres imprimés 📦</h2>
          <ul className="divide-y divide-magique-trait">
            {impressions.map((i, k) => (
              <li key={k} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-semibold">{i.titre}</p>
                  <p className="text-magique-texteClair">Commandé le {i.date.toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                    {i.suivi ? libelleStatut(i.suivi.statut) : "En préparation"}
                  </span>
                  {i.suivi?.suivi && (
                    <a href={i.suivi.suivi} target="_blank" rel="noopener" className="underline">
                      Suivre le colis
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sécurité */}
      <section className="carte space-y-4">
        <h2 className="text-xl">Mot de passe</h2>
        <ChangePasswordForm />
        <p className="text-xs text-magique-texteClair">
          Mot de passe oublié ?{" "}
          <Link href="/mot-de-passe-oublie" className="underline">
            Recevoir un lien de réinitialisation
          </Link>
          .
        </p>
      </section>

      {/* RGPD */}
      <section className="carte space-y-3">
        <h2 className="text-xl">Supprimer mon compte</h2>
        <p className="text-sm text-magique-texteClair">
          Conformément au RGPD, vous pouvez supprimer votre compte et toutes les
          données associées (enfants, livres, achats). Une question ? Écrivez-nous
          avant : nous pouvons souvent vous aider.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
