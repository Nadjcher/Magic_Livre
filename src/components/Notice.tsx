/**
 * Encadré de message (information, succès, erreur). Sert à afficher des
 * messages clairs en français, sans jamais montrer de trace technique.
 */

type NoticeKind = "info" | "succes" | "erreur";

const styles: Record<NoticeKind, string> = {
  info: "border-white/20 bg-white/[0.07] text-magique-texte",
  succes: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
  erreur: "border-red-300/50 bg-red-500/15 text-red-100",
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
