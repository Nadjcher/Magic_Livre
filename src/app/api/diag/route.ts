/** Diagnostic TEMPORAIRE : teste la clé Groq (génération de texte). */
import OpenAI from "openai";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  const key = env.groqApiKey();
  out.hasGroqKey = Boolean(key);
  out.groqKeyPrefix = key ? key.slice(0, 4) : null;
  out.groqModel = env.groqModel();
  out.imageProvider = process.env.IMAGE_PROVIDER ?? "none";
  out.hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  try {
    const client = new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
    try {
      const models = await client.models.list();
      out.availableModels = models.data.map((m) => m.id).sort();
    } catch (e) {
      out.modelsError = String((e as Error)?.message ?? e).slice(0, 200);
    }
    const r = await client.chat.completions.create({
      model: env.groqModel(),
      max_tokens: 50,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: 'Réponds en JSON: {"ok": true}' }],
    });
    out.groq = "ok";
    out.groqReply = (r.choices[0]?.message?.content ?? "").slice(0, 60);
  } catch (e) {
    out.groq = "error";
    out.groqStatus = (e as { status?: number })?.status ?? null;
    out.groqError = String((e as Error)?.message ?? e).slice(0, 300);
  }

  return Response.json(out);
}
