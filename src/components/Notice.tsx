/**
 * Encadré de message (information, succès, erreur). Sert à afficher des
 * messages clairs en français, sans jamais montrer de trace technique.
 */

type NoticeKind = "info" | "succes" | "erreur";

const styles: Record<NoticeKind, string> = {
  info: "border-magique-primaire/30 bg-magique-primaire/5 text-magique-texte",
  succes: "border-magique-accent/40 bg-magique-accent/10 text-emerald-800",
  erreur: "border-red-300 bg-red-50 text-red-800",
};

export default function Notice({
  kind = "info",
  children,
}: {
  kind?: NoticeKind;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[kind]}`} role="status">
      {children}
    </div>
  );
}
