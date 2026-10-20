/**
 * En-tête de page cohérent dans tout le SaaS : surtitre en serif doré + titre
 * Fraunces, à l'image de la page d'accueil (fini le gros titre violet en gras).
 */

export default function EnTetePage({
  surtitre,
  titre,
  children,
}: {
  surtitre: string;
  titre: string;
  children?: React.ReactNode;
}) {
  return (
    <header>
      <p className="flex items-center gap-2 font-serif italic text-or-fonce">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-or" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" />
        </svg>
        {surtitre}
      </p>
      <h1 className="mt-1 text-3xl sm:text-4xl">{titre}</h1>
      {children && (
        <p className="mt-3 max-w-2xl leading-relaxed text-magique-texteClair">{children}</p>
      )}
    </header>
  );
}
