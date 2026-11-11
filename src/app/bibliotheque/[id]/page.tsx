/**
 * Page d'un livre : lecteur page par page, achat et téléchargement du PDF.
 */

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { failStaleBooks } from "@/lib/bookMaintenance";
import { storySchema } from "@/lib/storySchema";
import { lightenStory, migrateBookImagesToBlob } from "@/lib/bookImages";
import BookReader from "@/components/BookReader";
import DeleteBookButton from "@/components/DeleteBookButton";
import AutoRefresh from "@/components/AutoRefresh";
import Notice from "@/components/Notice";
import GenerationOverlay from "@/components/GenerationOverlay";
import { THEMES } from "@/lib/themes";
import CompleteIllustrationsButton from "@/components/CompleteIllustrationsButton";
import { EN_COURS, EN_RELECTURE, EN_RELECTURE_IMAGES } from "@/lib/illustrationStatus";
import { peutDebloquer } from "@/lib/apercu";
import { serieDe } from "@/lib/serie";
import EtDemain from "@/components/EtDemain";
import { PAGES_APERCU } from "@/lib/storyGenerator";

// La complétion des illustrations tourne en arrière-plan depuis cette page.
export const maxDuration = 300;

export default async function LivrePage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ paiement?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  // Libère ce livre s'il est resté bloqué en génération trop longtemps.
  await failStaleBooks(user.id);

  const book = await prisma.book.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: { child: { select: { firstName: true } } },
  });
  if (!book) notFound();

  const premium = book.tier === "premium";

  // Histoire prête à afficher : images déplacées vers Vercel Blob si possible,
  // et jamais embarquées dans la page (elle resterait trop lourde pour Vercel).
  const parsed =
    book.status === "ready" && book.pages ? storySchema.safeParse(book.pages) : null;
  const story =
    parsed?.success
      ? lightenStory(await migrateBookImagesToBlob(book.id, parsed.data), book.id)
      : null;

  // Illustrations absentes (service de dessin indisponible au moment de la création) ?
  // Les pages d'un aperçu gratuit ne comptent pas : elles attendent le déblocage.
  const imagesManquantes = story
    ? (story.couvertureUrl ? 0 : 1) +
      (story.serie ? 0 : story.pages.filter((p, i) => !p.imageUrl && !(story.apercu && i >= PAGES_APERCU)).length)
    : 0;
  const pagesVerrouillees = story?.apercu ? story.pages.filter((p) => !p.imageUrl).length : 0;
  const deblocable = pagesVerrouillees > 0 && (await peutDebloquer(user.id, book.id));
  // Série : numéro de cet épisode et épisode suivant déjà écrit, s'il existe.
  const numero = story?.serie?.numero ?? 1;
  const serie = story ? await serieDe(user.id, book.id) : null;
  const suivant = serie?.episodes.find((e) => e.numero === numero + 1);
  const depart = book.errorMessage?.startsWith(EN_COURS)
    ? Number(book.errorMessage.slice(EN_COURS.length))
    : 0;
  const completionEnCours = depart > 0 && Date.now() - depart < 6 * 60 * 1000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/bibliotheque" className="text-sm text-magique-texteClair hover:underline">
            ← Ma bibliothèque
          </Link>
          <h1 className="mt-1 text-3xl sm:text-4xl">{book.title}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-magique-texteClair">
            Pour {book.child.firstName}
            {story?.serie && (
              <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold">Épisode {story.serie.numero}</span>
            )}
            {premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-magique-primaire/10 px-2.5 py-0.5 text-xs font-semibold text-magique-primaire">
                ✦ Édition premium
              </span>
            )}
          </p>
        </div>
        <DeleteBookButton bookId={book.id} title={book.title} redirectAfter="/bibliotheque" />
      </div>

      {searchParams.paiement === "succes" && (
        <Notice kind="succes">
          Merci ! Votre paiement est en cours de validation. Le téléchargement
          sera disponible dès la confirmation.
        </Notice>
      )}
      {searchParams.paiement === "annule" && (
        <Notice kind="info">Paiement annulé. Vous pouvez réessayer quand vous voulez.</Notice>
      )}

      {book.status === "generating" && (
        <>
          <AutoRefresh seconds={5} />
          <GenerationOverlay inline prenom={book.child.firstName} themeId={THEMES.find((t) => t.titre === book.theme)?.id} />
        </>
      )}

      {(book.errorMessage === EN_RELECTURE || book.errorMessage === EN_RELECTURE_IMAGES) && (
        <Notice kind="info">
          Nous relisons chaque histoire avant de vous la confier. Celle de {book.child.firstName} est entre les mains de
          notre équipe : elle sera ici sous 24 heures, et nous vous préviendrons par email.
        </Notice>
      )}

      {book.status === "failed" && (
        <Notice kind="erreur">
          {book.errorMessage ??
            "La génération a échoué. Vous pouvez supprimer ce livre et réessayer."}
        </Notice>
      )}

      {parsed && !parsed.success && (
        <Notice kind="erreur">
          Le contenu de ce livre est illisible. Merci de le supprimer et d'en créer un
          nouveau.
        </Notice>
      )}

      {story && completionEnCours && (
        <>
          <AutoRefresh seconds={8} />
          <Notice kind="info">
            🎨 Les illustrations manquantes sont en cours de création (1 à 2 minutes).
            Cette page se met à jour toute seule.
          </Notice>
        </>
      )}
      {story && pagesVerrouillees > 0 && !completionEnCours && (
        <div className="carte space-y-3">
          <h2 className="font-serif text-xl">Votre aperçu gratuit</h2>
          <p className="text-sm text-magique-texteClair">
            Toute l'histoire se lit gratuitement, avec la couverture et les {PAGES_APERCU} premières
            pages illustrées. {deblocable
              ? `Les ${pagesVerrouillees} autres pages sont incluses : on les dessine maintenant, avec le même héros.`
              : `Les ${pagesVerrouillees} autres pages sont dessinées dès que vous gardez le livre (PDF, livre relié) ou avec le Club.`}
          </p>
          {deblocable ? (
            <CompleteIllustrationsButton bookId={book.id} />
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link href={`/bibliotheque/${book.id}/boutique`} className="btn-primaire">
                Garder le livre illustré
              </Link>
              <Link href="/club" className="btn-secondaire">
                Découvrir le Club
              </Link>
            </div>
          )}
        </div>
      )}
      {story && imagesManquantes > 0 && !completionEnCours && (
        <div className="carte space-y-3">
          <h2 className="font-serif text-xl">
            {imagesManquantes} illustration{imagesManquantes > 1 ? "s" : ""} manquante
            {imagesManquantes > 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-magique-texteClair">
            {/content_policy|flagged|checker/i.test(book.errorMessage ?? "")
              ? "Le filtre de sécurité automatique du service de dessin a refusé une ou plusieurs scènes. L'histoire est conservée : en relançant, nous reformulons la scène avec des mots plus doux."
              : "Le service de dessin n'a pas répondu pendant la création. L'histoire est conservée : seules les images absentes seront dessinées, dans le même style."}
          </p>
          <CompleteIllustrationsButton bookId={book.id} />
        </div>
      )}

      {story ? (
        (() => {
          return (
            <>
              <BookReader
                story={story}
                prenom={book.child.firstName}
                suite={
                  <EtDemain
                    bookId={book.id}
                    prenom={book.child.firstName}
                    suites={story.suites}
                    numero={numero}
                    autreEpisode={suivant ? `/bibliotheque/${suivant.id}` : undefined}
                  />
                }
                retouche={{ bookId: book.id, restantes: Math.max(0, 5 - (story.retouches ?? 0)) }} />
              <div className="carte flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-xl">🎁 La boutique de ce livre</h2>
                  <p className="mt-1 text-sm text-magique-texteClair">
                    Le livre à imprimer, le kit inclus (coloriage, affiche, invitation,
                    autocollants, marque-pages) et des cadeaux deluxe — tous créés à
                    partir de cette histoire.
                  </p>
                </div>
                <Link
                  href={`/bibliotheque/${book.id}/boutique`}
                  className="btn-primaire flex-none"
                >
                  Voir la boutique →
                </Link>
              </div>
            </>
          );
        })()
      ) : null}
    </div>
  );
}
