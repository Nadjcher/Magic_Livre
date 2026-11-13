/**
 * Conditions générales de vente (CGV), vente en ligne aux consommateurs :
 * contenus numériques (PDF, kit, dessin animé) et livre imprimé personnalisé.
 * L'identité du vendeur est lue dans les variables d'environnement (lib/legal).
 */

import Link from "next/link";
import type { Metadata } from "next";
import { identiteLegale, VERSION_CGV } from "@/lib/legal";
import { DELUXE_PRODUCTS, LIVRE_IMPRIME, PACK_TOUT, PAYS_LIVRAISON, PLANS_CLUB, PRIX_IMPRIME_ABONNE, formatEuros, mentionLancementImprime, FORMAT_IMPRIME, DELAI_IMPRIME } from "@/lib/products";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente de Encore une histoire : livres personnalisés pour enfants en PDF, dessin animé et livre imprimé relié.",
  alternates: { canonical: "/cgv" },
};

const NOMS_PAYS: Record<string, string> = {
  FR: "France", BE: "Belgique", LU: "Luxembourg", CH: "Suisse", MC: "Monaco", DE: "Allemagne", ES: "Espagne",
  IT: "Italie", NL: "Pays-Bas", PT: "Portugal", AT: "Autriche", IE: "Irlande",
};

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 text-xl font-semibold">{children}</h2>;
}

export default function CgvPage() {
  const id = identiteLegale();
  return (
    <article className="mx-auto max-w-2xl space-y-3 leading-relaxed">
      <h1 className="text-3xl sm:text-4xl">Conditions générales de vente</h1>
      <p className="text-sm text-magique-texteClair">Version {VERSION_CGV} — en vigueur pour toute commande passée à compter de sa mise en ligne.</p>

      <H>1. Le vendeur</H>
      <p>
        Le site « Encore une histoire » est édité par {id.nom}, {id.statut}, SIREN {id.siren}, dont l'adresse est {id.adresse}.
        Contact : {id.email}. {id.tva}
      </p>

      <H>2. Objet</H>
      <p>
        Les présentes conditions régissent la vente, par le site « Encore une histoire », de livres illustrés personnalisés pour
        enfants et de produits associés, à des consommateurs. Toute commande suppose leur acceptation, matérialisée
        par une case à cocher avant le paiement. Elles prévalent sur tout autre document.
      </p>

      <H>3. Les produits</H>
      <p>
        Encore une histoire crée, à partir des informations que vous fournissez (prénom, âge, thème, photo facultative), une
        histoire et des illustrations originales grâce à des outils d'intelligence artificielle. La lecture du livre
        à l'écran est gratuite : vous voyez l'intégralité du livre avant tout achat. Sont proposés à la vente :
      </p>
      <ul className="list-disc space-y-1 pl-6">
        <li>le livre au format PDF à imprimer, avec son kit (coloriage, affiche, invitation, autocollants, marque-pages) : {formatEuros(env.bookPriceCents())} (édition premium : {formatEuros(env.bookPricePremiumCents())}) ;</li>
        {DELUXE_PRODUCTS.map((p) => (
          <li key={p.sku}>{p.label} : {formatEuros(p.priceCents)} ;</li>
        ))}
        <li>la {PACK_TOUT.label.toLowerCase()} (livre PDF, kit et produits ci-dessus) : {formatEuros(PACK_TOUT.priceCents)} ;</li>
        <li>
          le {LIVRE_IMPRIME.label.toLowerCase()} (carré {FORMAT_IMPRIME}, 30 pages), livraison incluse : {formatEuros(LIVRE_IMPRIME.priceCents)}
          {mentionLancementImprime() ? ` (${mentionLancementImprime()!.toLowerCase()})` : ""}.
        </li>
      </ul>
      <p>
        Les contenus étant générés automatiquement, de légères imperfections sont possibles. Vous pouvez faire
        redessiner gratuitement une illustration depuis la page du livre (dans la limite indiquée) avant tout achat.
      </p>

      <H>3 bis. Abonnement « Club »</H>
      <p>
        Le Club est un abonnement mensuel sans engagement : {PLANS_CLUB.club.label} ({formatEuros(PLANS_CLUB.club.priceCents)} par
        mois, {PLANS_CLUB.club.livres} livres inclus par période) et {PLANS_CLUB.clubplus.label} ({formatEuros(PLANS_CLUB.clubplus.priceCents)} par
        mois, {PLANS_CLUB.clubplus.livres} livres inclus par période, en édition premium). Il donne accès aux grands classiques
        revisités et au livre imprimé au prix membre de {formatEuros(PRIX_IMPRIME_ABONNE)}. Le prélèvement a lieu à la
        souscription puis à chaque date anniversaire mensuelle. Les livres non utilisés ne sont pas reportés sur la
        période suivante. L'abonnement est résiliable à tout moment depuis l'espace « Mon compte » : la résiliation prend
        effet à la fin de la période déjà payée, sans frais. Les livres créés pendant l'abonnement, et leurs fichiers,
        restent acquis. Conformément à l'article L221-28, 13° du Code de la consommation, l'abonné qui demande l'accès
        immédiat aux contenus renonce à son droit de rétractation.
      </p>

      <H>4. Prix</H>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises. {id.tva} Le prix du livre imprimé inclut la
        livraison dans les pays listés à l'article 7. Le prix applicable est celui affiché au moment de la commande.
      </p>

      <H>5. Commande</H>
      <p>
        La commande nécessite un compte et le consentement d'un parent ou responsable légal. Elle est passée depuis
        la boutique du livre : choix du produit, acceptation des présentes conditions, puis paiement. Un email de
        confirmation récapitulant la commande vous est envoyé.
      </p>

      <H>6. Paiement</H>
      <p>
        Le paiement s'effectue en ligne par carte bancaire, via le prestataire sécurisé Stripe. Nous n'avons jamais
        accès à vos coordonnées bancaires. Le montant est débité au moment de la commande.
      </p>

      <H>7. Livraison</H>
      <p>
        <strong>Contenus numériques</strong> : ils sont accessibles immédiatement après la validation du paiement,
        dans la boutique du livre et depuis l'espace « Mon compte », et restent téléchargeables tant que le compte existe.
      </p>
      <p>
        <strong>Livre imprimé</strong> : il est fabriqué et expédié par notre imprimeur partenaire, à l'adresse
        indiquée lors du paiement. Pays desservis : {PAYS_LIVRAISON.map((c) => NOMS_PAYS[c] ?? c).join(", ")}.
        Délai indicatif : {DELAI_IMPRIME}, après votre validation du livre. Le suivi est disponible dans « Mon compte ». À défaut de livraison
        dans un délai de 30 jours, vous pouvez, après une mise en demeure restée sans effet, résoudre la vente et
        obtenir le remboursement (articles L216-6 et suivants du Code de la consommation).
      </p>

      <H>8. Droit de rétractation</H>
      <p>
        <strong>Contenus numériques</strong> : conformément à l'article L221-28, 13° du Code de la consommation, le
        droit de rétractation ne peut être exercé pour un contenu numérique fourni sans support matériel dont
        l'exécution a commencé avec votre accord préalable exprès et votre renoncement exprès à ce droit. Cet accord
        et ce renoncement sont recueillis par la case à cocher précédant le paiement, et confirmés dans l'email de
        commande.
      </p>
      <p>
        <strong>Livre imprimé</strong> : conformément à l'article L221-28, 3° du Code de la consommation, le droit de
        rétractation ne s'applique pas aux biens confectionnés selon les spécifications du consommateur ou nettement
        personnalisés, ce qui est le cas d'un livre créé pour votre enfant.
      </p>

      <H>9. Garanties légales</H>
      <p>
        Vous bénéficiez de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation
        pour le livre imprimé, articles L224-25-12 et suivants pour les contenus numériques) et de la garantie des
        vices cachés (articles 1641 et suivants du Code civil). Le consommateur dispose d'un délai de deux ans à
        compter de la délivrance du bien pour agir au titre de la garantie de conformité, et de deux ans à compter
        de la découverte du vice pour la garantie des vices cachés.
      </p>
      <p>
        <strong>Livre abîmé ou défaut d'impression</strong> : écrivez-nous dans les 14 jours suivant la réception,
        avec une photo ; le livre est réimprimé et renvoyé gratuitement. Un fichier défectueux est corrigé ou
        remboursé.
      </p>

      <H>10. Propriété intellectuelle et utilisation</H>
      <p>
        Les livres achetés sont destinés à un usage privé et familial : vous pouvez les imprimer, les lire, les
        offrir et les partager avec vos proches. Toute exploitation commerciale ou revente est interdite. Les
        éléments du site (marque, textes, maquette) restent la propriété de l'éditeur.
      </p>

      <H>11. Données personnelles</H>
      <p>
        Les données nécessaires à la commande sont traitées conformément à notre{" "}
        <Link href="/confidentialite" className="underline">politique de confidentialité</Link>. La photo
        éventuellement fournie n'est jamais conservée.
      </p>

      <H>12. Service client</H>
      <p>Pour toute question ou réclamation : {id.email}. Nous répondons sous 48 heures ouvrées.</p>

      <H>13. Médiation</H>
      <p>
        En cas de litige non résolu avec notre service client, vous pouvez recourir gratuitement au médiateur de la
        consommation suivant (articles L611-1 et suivants du Code de la consommation) : {id.mediateur}.
      </p>

      <H>14. Droit applicable</H>
      <p>
        Les présentes conditions sont soumises au droit français. À défaut d'accord amiable, le litige relève des
        juridictions compétentes, le consommateur pouvant saisir la juridiction de son lieu de résidence.
      </p>
    </article>
  );
}
