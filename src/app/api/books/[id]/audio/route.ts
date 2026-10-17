/**
 * Téléchargement de l'histoire en audio (MP3), via ElevenLabs.
 * Réservé aux livres payés. Nécessite VOICE_PROVIDER=elevenlabs + ELEVENLABS_API_KEY.
 * (La lecture à voix haute gratuite reste disponible dans le navigateur.)
 */

import { NextResponse } from "next/server";
import { getPaidBookStory, safeFileName } from "@/lib/bookAccess";
import { fetchWithTimeout } from "@/lib/imageFetch";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const acc = await getPaidBookStory(params.id);
  if (!acc.ok) return NextResponse.json({ error: acc.error }, { status: acc.status });

  const key = env.elevenLabsApiKey();
  if (env.voiceProvider() !== "elevenlabs" || !key) {
    return NextResponse.json(
      {
        error:
          "L'audio téléchargeable nécessite un fournisseur de voix configuré (ElevenLabs). " +
          "La lecture à voix haute reste disponible dans le lecteur.",
      },
      { status: 501 },
    );
  }

  // Concatène le texte (limité pour rester dans les quotas de synthèse).
  const texte = [acc.story.titre, ...acc.story.pages.map((p) => p.texte)]
    .join("\n\n")
    .slice(0, 2500);

  try {
    const res = await fetchWithTimeout(
      `https://api.elevenlabs.io/v1/text-to-speech/${env.elevenLabsVoiceId()}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: texte,
          model_id: "eleven_multilingual_v2",
        }),
      },
      45_000,
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "La génération audio a échoué. Réessayez plus tard." },
        { status: 502 },
      );
    }
    const audio = Buffer.from(await res.arrayBuffer());
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${safeFileName(acc.title)}.mp3"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "La génération audio est momentanément indisponible." },
      { status: 502 },
    );
  }
}
