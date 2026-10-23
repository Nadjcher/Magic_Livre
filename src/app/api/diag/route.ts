/** Diagnostic TEMPORAIRE : appel image Gemini brut (voir pourquoi null). */
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  const key = env.geminiApiKey();
  const model = env.geminiImageModel();
  out.provider = env.imageProvider();
  out.model = model;
  out.hasKey = Boolean(key);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "A warm children's book illustration of a small fox in a green forest, soft colors. No text.",
              },
            ],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    out.httpStatus = r.status;
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    out.hasImage = parts.some((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
    out.finishReason = j?.candidates?.[0]?.finishReason ?? null;
    out.textParts = parts
      .map((p: { text?: string }) => p?.text)
      .filter(Boolean)
      .join(" ")
      .slice(0, 200);
    out.error = j?.error ? String(j.error.message).slice(0, 250) : null;
    out.promptFeedback = j?.promptFeedback ?? null;
  } catch (e) {
    out.exception = String((e as Error)?.message ?? e).slice(0, 200);
  }

  return Response.json(out);
}
