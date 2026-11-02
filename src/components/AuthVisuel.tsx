/**
 * Visuel des pages de connexion / inscription : un livre de la maison, en
 * relief, avec une petite phrase d'accueil.
 */

export default function AuthVisuel({ titre, texte }: { titre: string; texte: string }) {
  return (
    <figure className="relative mx-auto w-full max-w-sm">
      <div className="[perspective:1400px]">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-l-md rounded-r-2xl shadow-conte"
          style={{ transform: "rotateY(-12deg) rotateX(3deg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/exemple/couverture.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a44]/90 via-transparent to-transparent" aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-3" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.4),rgba(255,255,255,.1))" }} aria-hidden="true" />
          <figcaption className="absolute inset-x-6 bottom-6">
            <p className="font-serif text-2xl leading-tight text-white">{titre}</p>
            <p className="mt-1 text-sm text-[#dce3ff]">{texte}</p>
          </figcaption>
        </div>
      </div>
    </figure>
  );
}
