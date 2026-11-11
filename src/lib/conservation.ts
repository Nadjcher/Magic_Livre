/**
 * Conservation des données (RGPD) : durées limitées et suppression automatique.
 * Ces durées sont aussi affichées dans la politique de confidentialité
 * (une seule source : DUREES_CONSERVATION).
 *
 * La purge tourne chaque nuit (/api/cron/purge). Les images des livres effacés
 * sont aussi supprimées du stockage (Vercel Blob).
 */

import "server-only";
import { del } from "@vercel/blob";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { emailAvecBouton } from "./mailer";
import { reserver } from "./idempotence";
import { storySchema } from "./storySchema";
import { migrateBookImagesToBlob } from "./bookImages";

export const DUREES_CONSERVATION: { donnee: string; duree: string }[] = [
  { donnee: "Photo de l'enfant", duree: "Jamais conservée : utilisée le temps de dessiner le héros, puis oubliée." },
  { donnee: "Compte, enfants (prénom, âge) et livres", duree: "Tant que le compte est utilisé. Après 2 ans sans connexion, le compte est supprimé (un email vous prévient 30 jours avant)." },
  { donnee: "Fiche de l'enfant pour les histoires (doudou, goûts, proches)", duree: "Tant que l'enfant est dans votre compte ; effacée avec lui, avec le compte, ou dès que vous videz la fiche." },
  { donnee: "Livre que vous supprimez", duree: "Effacé définitivement sous 30 jours, avec ses illustrations." },
  { donnee: "Livre dont la création a échoué", duree: "Effacé sous 30 jours." },
  { donnee: "Commandes et factures", duree: "10 ans, obligation comptable (article L123-22 du Code de commerce). Le contenu du livre n'y est pas conservé." },
  { donnee: "Email laissé sur la liste d'attente (sans compte)", duree: "6 mois." },
  { donnee: "Historique des emails d'information envoyés", duree: "12 mois." },
  { donnee: "Désinscription des emails", duree: "3 ans, pour ne plus vous écrire (recommandation de la CNIL)." },
  { donnee: "Liens de confirmation et de réinitialisation", duree: "1 à 24 heures, puis effacés." },
];

const MOIS_INACTIVITE = 24;
const JOURS_PREAVIS = 30;

/* ─── Dernière activité d'un compte ─── */

let colonnePrete: Promise<void> | null = null;
function assurerColonne(): Promise<void> {
  colonnePrete ??= prisma
    .$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMPTZ`)
    .then(() => undefined)
    .catch((e) => {
      colonnePrete = null;
      throw e;
    });
  return colonnePrete;
}

/** Note l'activité d'un compte (au plus une écriture par jour). */
export async function noterActivite(userId: string): Promise<void> {
  try {
    await assurerColonne();
    await prisma.$executeRaw`
      UPDATE "User" SET "lastSeenAt" = NOW()
      WHERE id = ${userId} AND ("lastSeenAt" IS NULL OR "lastSeenAt" < NOW() - INTERVAL '1 day')`;
  } catch {
    /* best-effort */
  }
}

/* ─── Images des livres dans le stockage ─── */

/** Toutes les références d'images stockées chez nous dans le contenu d'un livre. */
function referencesImages(pages: unknown): string[] {
  const refs = new Set<string>();
  const parcourir = (v: unknown) => {
    if (typeof v === "string") {
      if (v.startsWith("vblob:")) refs.add(v.slice("vblob:".length));
      else if (/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(v)) refs.add(v);
    } else if (Array.isArray(v)) v.forEach(parcourir);
    else if (v && typeof v === "object") Object.values(v).forEach(parcourir);
  };
  parcourir(pages);
  return [...refs];
}

/** Supprime du stockage les images de ces livres (best-effort). */
export async function supprimerImages(livres: { pages: unknown }[]): Promise<number> {
  const refs = livres.flatMap((l) => referencesImages(l.pages));
  let n = 0;
  for (let i = 0; i < refs.length; i += 100) {
    try {
      await del(refs.slice(i, i + 100));
      n += Math.min(100, refs.length - i);
    } catch (e) {
      console.error("[conservation] suppression d'images :", String(e).slice(0, 160));
    }
  }
  return n;
}

/** Supprime un compte et toutes ses données, images comprises. */
export async function supprimerCompte(userId: string): Promise<void> {
  const livres = await prisma.book.findMany({ where: { userId }, select: { pages: true } });
  await prisma.user.delete({ where: { id: userId } });
  await supprimerImages(livres);
}

/* ─── Purge quotidienne ─── */

export async function purger(): Promise<Record<string, number>> {
  const bilan: Record<string, number> = {};
  const compter = async (nom: string, f: () => Promise<number>) => {
    try {
      bilan[nom] = await f();
    } catch (e) {
      bilan[nom] = -1;
      console.error(`[conservation] ${nom} :`, String(e).slice(0, 200));
    }
  };

  // Anciens livres dont les images sont encore dans la base (jusqu'à 10 Mo chacun) :
  // déplacées vers le stockage, 5 par nuit. Accélère leur ouverture et leurs PDF.
  await compter("livresAlleges", async () => {
    const lourds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Book" WHERE "deletedAt" IS NULL AND octet_length(pages::text) > 500000 LIMIT 5`;
    for (const { id } of lourds) {
      const b = await prisma.book.findUnique({ where: { id }, select: { pages: true } });
      const st = storySchema.safeParse(b?.pages);
      if (st.success) await migrateBookImagesToBlob(id, st.data);
    }
    return lourds.length;
  });

  await compter("jetonsExpires", async () => (await prisma.verificationToken.deleteMany({ where: { expires: { lt: new Date() } } })).count);

  // Livres supprimés depuis 30 jours, ou dont la création a échoué depuis 30 jours.
  await compter("livresEffaces", async () => {
    const limite = new Date(Date.now() - 30 * 86400_000);
    const cibles = await prisma.book.findMany({
      where: {
        OR: [{ deletedAt: { lt: limite } }, { status: "failed", createdAt: { lt: limite } }],
      },
      select: { id: true, pages: true, orders: { where: { status: "paid" }, select: { id: true }, take: 1 } },
      take: 200,
    });
    const sansCommande = cibles.filter((b) => b.orders.length === 0);
    const avecCommande = cibles.filter((b) => b.orders.length > 0 && b.pages !== null);
    await supprimerImages(cibles);
    if (sansCommande.length) await prisma.book.deleteMany({ where: { id: { in: sansCommande.map((b) => b.id) } } });
    // Livre payé puis supprimé : on garde la commande (comptabilité) mais plus le contenu.
    for (const b of avecCommande) {
      await prisma.$executeRaw`UPDATE "Book" SET pages = NULL, title = 'Livre supprimé' WHERE id = ${b.id}`;
    }
    return cibles.length;
  });

  await compter("listeAttente", async () =>
    prisma.$executeRaw`
      DELETE FROM "Waitlist" w
      WHERE w."createdAt" < NOW() - INTERVAL '6 months'
        AND NOT EXISTS (SELECT 1 FROM "User" u WHERE lower(u.email) = lower(w.email))`.catch(() => 0),
  );
  await compter("historiqueEmails", async () => prisma.$executeRaw`DELETE FROM "EnvoiCampagne" WHERE "envoyeLe" < NOW() - INTERVAL '12 months'`.catch(() => 0));
  await compter("desinscriptions", async () => prisma.$executeRaw`DELETE FROM "Desinscrit" WHERE "le" < NOW() - INTERVAL '3 years'`.catch(() => 0));
  await compter("jetonsTraitement", async () => prisma.$executeRaw`DELETE FROM "Traitement" WHERE "creeLe" < NOW() - INTERVAL '90 days'`.catch(() => 0));
  await compter("demandesAvis", async () => prisma.$executeRaw`DELETE FROM "ReviewRequest" WHERE "sentAt" < NOW() - INTERVAL '12 months'`.catch(() => 0));

  // Comptes inactifs : préavis à 23 mois, suppression 30 jours après le préavis.
  await assurerColonne();
  await compter("preavisInactivite", async () => {
    const cibles = await prisma.$queryRaw<{ id: string; email: string }[]>`
      SELECT id, email FROM "User"
      WHERE COALESCE("lastSeenAt", "createdAt") < NOW() - make_interval(months => ${MOIS_INACTIVITE}) + make_interval(days => ${JOURS_PREAVIS})
      LIMIT 50`;
    let n = 0;
    for (const u of cibles) {
      if (!(await reserver(`preavis-inactivite:${u.id}`))) continue;
      await emailAvecBouton(
        u.email,
        "Votre compte Encore une histoire sera supprimé dans 30 jours",
        "On garde la bibliothèque de votre enfant ?",
        "Vous ne vous êtes pas connecté(e) depuis près de 2 ans. Pour protéger vos données, votre compte et vos livres seront supprimés dans 30 jours. Pour les garder, il suffit de vous reconnecter.",
        `${getAppUrl()}/connexion`,
        "Garder mon compte",
      );
      n++;
    }
    return n;
  });
  await compter("comptesInactifsSupprimes", async () => {
    const cibles = await prisma.$queryRaw<{ id: string }[]>`
      SELECT u.id FROM "User" u
      JOIN "Traitement" t ON t.cle = 'preavis-inactivite:' || u.id
      WHERE COALESCE(u."lastSeenAt", u."createdAt") < NOW() - make_interval(months => ${MOIS_INACTIVITE})
        AND t."creeLe" < NOW() - make_interval(days => ${JOURS_PREAVIS})
      LIMIT 20`;
    for (const u of cibles) await supprimerCompte(u.id);
    return cibles.length;
  });
  // Un compte revenu après le préavis : on efface le préavis (il en recevra un nouveau dans 2 ans).
  await compter("preavisAnnules", async () =>
    prisma.$executeRaw`
      DELETE FROM "Traitement" t USING "User" u
      WHERE t.cle = 'preavis-inactivite:' || u.id
        AND COALESCE(u."lastSeenAt", u."createdAt") > t."creeLe"`.catch(() => 0),
  );

  return bilan;
}
