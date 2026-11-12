/**
 * Campagnes d'emails du lancement, conçues avec la méthode « Email Strategist » :
 * chaque campagne vise un SEGMENT précis (pas d'envoi identique à tout le monde),
 * a une condition de sortie (client, désinscrit, déjà reçu), un seul bouton, et
 * un lien de désinscription en un clic.
 *
 *   avant-premiere  J-3   tous les contacts        « créez-le maintenant, il sera prêt à l'ouverture »
 *   ouverture       J0    a déjà un livre / non    le livre de {prénom} peut rejoindre sa bibliothèque
 *   relance         J+3   pas encore client         réponses aux 3 hésitations
 *   noel            ~8/12 pas de livre imprimé      dernier délai pour une livraison avant Noël
 *
 * Tables créées au premier usage : EnvoiCampagne (qui a reçu quoi), Desinscrit.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { getAppUrl } from "./appUrl";
import { emailMarketing } from "./mailer";
import { DATE_OUVERTURE } from "./lancement";

export type Campagne = "avant-premiere" | "ouverture" | "relance" | "noel";

export const CAMPAGNES: { id: Campagne; quand: string; titre: string; cible: string }[] = [
  { id: "avant-premiere", quand: "19 novembre (J-3)", titre: "Avant-première", cible: "Tous les inscrits et comptes" },
  { id: "ouverture", quand: `${DATE_OUVERTURE}, à l'ouverture des ventes`, titre: "Ouverture", cible: "Tous (message différent si un livre est déjà créé)" },
  { id: "relance", quand: "25 novembre (J+3)", titre: "Relance", cible: "Ceux qui ont reçu l'ouverture il y a 2 jours ou plus et n'ont rien acheté" },
  { id: "noel", quand: "6 au 8 décembre", titre: "Dernier délai Noël", cible: "Ceux qui n'ont pas commandé de livre imprimé" },
];

const NOEL_LIMITE = process.env.NOEL_LIMITE || "10 décembre";
const echapper = (t: string) => t.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

let pret: Promise<void> | null = null;
function tables(): Promise<void> {
  pret ??= (async () => {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "EnvoiCampagne" (email TEXT NOT NULL, campagne TEXT NOT NULL, "envoyeLe" TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (email, campagne))`,
    );
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Desinscrit" (email TEXT PRIMARY KEY, "le" TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "Waitlist" (email TEXT PRIMARY KEY, source TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "notifiedAt" TIMESTAMPTZ)`,
    );
  })().catch((e) => {
    pret = null;
    throw e;
  });
  return pret;
}

/* ─── Désinscription (lien signé, sans connexion) ─── */

function secret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}
export function jetonDesinscription(email: string): string {
  return createHmac("sha256", secret()).update(`desinscription:${email.toLowerCase()}`).digest("hex").slice(0, 32);
}
export function jetonValide(email: string, jeton: string): boolean {
  const attendu = Buffer.from(jetonDesinscription(email));
  const recu = Buffer.from(jeton);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}
export function lienDesinscription(email: string): string {
  return `${getAppUrl()}/desinscription?e=${encodeURIComponent(email)}&t=${jetonDesinscription(email)}`;
}
export async function desinscrire(email: string): Promise<void> {
  await tables();
  await prisma.$executeRaw`INSERT INTO "Desinscrit" (email) VALUES (${email.toLowerCase()}) ON CONFLICT DO NOTHING`;
}
export async function estDesinscrit(email: string): Promise<boolean> {
  await tables();
  const r = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "Desinscrit" WHERE email = ${email.toLowerCase()}`;
  return Number(r[0]?.n ?? 0) > 0;
}

/* ─── Contacts et segments ─── */

interface Contact {
  email: string;
  compte: boolean;
  client: boolean;
  imprime: boolean;
  bookId: string | null;
  titre: string | null;
  prenom: string | null;
}

async function contacts(campagne: Campagne): Promise<Contact[]> {
  await tables();
  return prisma.$queryRaw<Contact[]>`
    WITH c AS (SELECT lower(email) AS email FROM "Waitlist" UNION SELECT lower(email) FROM "User")
    SELECT c.email,
      (u.id IS NOT NULL) AS compte,
      COALESCE((SELECT true FROM "Order" o WHERE o."userId" = u.id AND o.status = 'paid' AND o.amount > 0 LIMIT 1), false) AS client,
      COALESCE((SELECT true FROM "Order" o WHERE o."userId" = u.id AND o.status = 'paid' AND o.sku = 'imprime' LIMIT 1), false) AS imprime,
      lb.id AS "bookId", lb.title AS titre, lb."firstName" AS prenom
    FROM c
    LEFT JOIN "User" u ON lower(u.email) = c.email
    LEFT JOIN LATERAL (
      SELECT b.id, b.title, ch."firstName" FROM "Book" b JOIN "Child" ch ON ch.id = b."childId"
      WHERE b."userId" = u.id AND b.status = 'ready' AND b."deletedAt" IS NULL
      ORDER BY b."createdAt" DESC LIMIT 1
    ) lb ON true
    WHERE NOT EXISTS (SELECT 1 FROM "Desinscrit" d WHERE d.email = c.email)
      AND NOT EXISTS (SELECT 1 FROM "EnvoiCampagne" e WHERE e.email = c.email AND e.campagne = ${campagne})
      AND (${campagne} <> 'ouverture' OR NOT EXISTS (SELECT 1 FROM "Waitlist" w WHERE lower(w.email) = c.email AND w."notifiedAt" IS NOT NULL))
      AND (${campagne} <> 'relance' OR EXISTS (
        SELECT 1 FROM "EnvoiCampagne" e WHERE e.email = c.email AND e.campagne = 'ouverture' AND e."envoyeLe" < NOW() - INTERVAL '2 days'))`;
}

interface Message {
  sujet: string;
  titre: string;
  paragraphes: string[];
  url: string;
  libelle: string;
}

/** Le message d'une campagne pour un contact (null = ce contact n'est pas visé). */
function message(campagne: Campagne, c: Contact): Message | null {
  const base = getAppUrl();
  const prenom = c.prenom ? echapper(c.prenom) : null;
  const titre = c.titre ? echapper(c.titre) : null;
  switch (campagne) {
    case "avant-premiere":
      return prenom && titre
        ? {
            sujet: `Dans 3 jours, « ${c.titre} » pourra rejoindre sa bibliothèque`,
            titre: "Plus que 3 jours ✨",
            paragraphes: [
              `Le ${DATE_OUVERTURE}, les commandes ouvrent. Le livre de ${prenom}, « ${titre} », sera prêt à être gardé : en PDF à imprimer, ou en vrai livre relié, livré chez vous.`,
              "D'ici là, vous pouvez en créer un autre gratuitement, pour un frère, une sœur, ou juste pour le plaisir.",
            ],
            url: `${base}/bibliotheque/${c.bookId}`,
            libelle: `Relire le livre de ${c.prenom}`,
          }
        : {
            sujet: "Dans 3 jours, son histoire commence",
            titre: "Plus que 3 jours ✨",
            paragraphes: [
              `Le ${DATE_OUVERTURE}, les commandes ouvrent. Mais vous pouvez déjà créer son livre aujourd'hui : son prénom, son visage, une histoire écrite pour son âge, prête en quelques minutes.`,
              "Vous lisez toute l'histoire gratuitement. Le jour de l'ouverture, il sera prêt à être gardé ou imprimé pour Noël.",
            ],
            url: `${base}/creer`,
            libelle: "Créer son histoire maintenant",
          };
    case "ouverture":
      if (c.client) return null;
      return prenom && titre && c.bookId
        ? {
            sujet: `C'est ouvert : gardez « ${c.titre} » pour toujours`,
            titre: `Le livre de ${prenom} peut rejoindre sa bibliothèque`,
            paragraphes: [
              `Les commandes sont ouvertes. « ${titre} » peut devenir un vrai livre : en PDF à imprimer avec son kit (coloriage, affiche, marque-pages) dès 6,99 €, ou relié, couverture rigide, livré chez vous avant Noël.`,
              "Une histoire qu'il ou elle redemandera, encore et encore.",
            ],
            url: `${base}/bibliotheque/${c.bookId}/boutique`,
            libelle: "Garder son livre",
          }
        : {
            sujet: "C'est ouvert : offrez-lui le livre dont il est le héros ✨",
            titre: "Encore une histoire est ouvert !",
            paragraphes: [
              "Son prénom, son visage, une histoire écrite pour son âge, de 1 à 12 ans. Vous lisez toute son histoire gratuitement, et vous ne payez que si vous voulez garder le livre illustré.",
              "PDF à imprimer dès 6,99 €, ou vrai livre relié livré chez vous avant Noël.",
            ],
            url: `${base}/creer`,
            libelle: "Créer son histoire",
          };
    case "relance":
      if (c.client) return null;
      return {
        sujet: prenom ? `Avez-vous lu l'histoire de ${c.prenom} ensemble ?` : "Les 3 questions qu'on nous pose le plus",
        titre: "Vos questions, nos réponses",
        paragraphes: [
          "<strong>« Il va vraiment lui ressembler ? »</strong> Oui : le héros est dessiné d'après sa photo, le même à chaque page. Et la photo n'est jamais conservée.",
          "<strong>« Et si l'histoire ne me plaît pas ? »</strong> Vous lisez toute l'histoire avant de payer quoi que ce soit, et vous pouvez en créer une autre.",
          `<strong>« Ce sera là pour Noël ? »</strong> Le PDF est immédiat. Le livre relié est livré en 7 à 10 jours : commandez avant le ${NOEL_LIMITE}.`,
        ],
        url: c.bookId ? `${base}/bibliotheque/${c.bookId}/boutique` : `${base}/creer`,
        libelle: c.bookId ? "Voir les formules" : "Créer son histoire",
      };
    case "noel":
      if (c.imprime) return null;
      return {
        sujet: `Livre relié : commandez avant le ${NOEL_LIMITE} pour Noël 🎄`,
        titre: "Dernier délai pour le sapin",
        paragraphes: [
          `Pour recevoir le livre relié avant Noël, commandez avant le ${NOEL_LIMITE}. Couverture rigide, 28 × 21 cm, imprimé et livré chez vous.`,
          prenom && titre
            ? `« ${titre} » n'attend que ça. Et si vous préférez, le PDF reste disponible immédiatement, même le 24 au soir.`
            : "Il ne faut que quelques minutes pour créer son livre, et vous le lisez gratuitement avant de commander.",
        ],
        url: c.bookId ? `${base}/bibliotheque/${c.bookId}/boutique` : `${base}/creer`,
        libelle: c.bookId ? "Commander le livre relié" : "Créer son livre de Noël",
      };
  }
}

/** Nombre de personnes qui recevraient la campagne maintenant. */
export async function compterCampagne(campagne: Campagne): Promise<number> {
  const liste = await contacts(campagne);
  return liste.filter((c) => message(campagne, c)).length;
}

/** Envoie la campagne à un lot de destinataires (chacun ne la reçoit qu'une fois). */
export async function envoyerCampagne(campagne: Campagne, lot = 80): Promise<{ envoyes: number; reste: number }> {
  const liste = (await contacts(campagne)).filter((c) => message(campagne, c));
  let envoyes = 0;
  for (const c of liste.slice(0, lot)) {
    const m = message(campagne, c)!;
    // On réserve d'abord (idempotence) : pas de double envoi si deux clics se croisent.
    const n = await prisma.$executeRaw`INSERT INTO "EnvoiCampagne" (email, campagne) VALUES (${c.email}, ${campagne}) ON CONFLICT DO NOTHING`;
    if (n === 0) continue;
    const ok = await emailMarketing(c.email, m.sujet, m.titre, m.paragraphes, m.url, m.libelle, lienDesinscription(c.email));
    if (ok) envoyes++;
    else await prisma.$executeRaw`DELETE FROM "EnvoiCampagne" WHERE email = ${c.email} AND campagne = ${campagne}`;
  }
  return { envoyes, reste: await compterCampagne(campagne) };
}

/** Email de bienvenue à l'inscription sur la liste d'attente (une seule fois). */
export async function bienvenueListe(email: string): Promise<void> {
  if (await estDesinscrit(email)) return;
  await emailMarketing(
    email,
    `C'est noté ! On vous prévient le ${DATE_OUVERTURE} ✨`,
    "Bienvenue sur la liste",
    [
      `Merci ! Vous serez parmi les premiers prévenus à l'ouverture des commandes, le ${DATE_OUVERTURE}.`,
      "Bonne nouvelle : vous n'avez pas besoin d'attendre pour essayer. Créez son livre dès maintenant, avec son prénom et sa photo, et lisez toute son histoire gratuitement.",
    ],
    `${getAppUrl()}/creer`,
    "Créer son histoire gratuitement",
    lienDesinscription(email),
  );
}
