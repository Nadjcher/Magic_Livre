/** Diagnostic TEMPORAIRE : teste la clé Anthropic (génération) + Gemini. */
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
  out.hasAnthropicKey = Boolean(key);
  out.anthropicKeyPrefix = key ? key.slice(0, 7) : null;
  out.anthropicModel = model;
  out.imageProvider = process.env.IMAGE_PROVIDER ?? "none";
  out.hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  try {
    const client = new Anthropic({ apiKey: key });
    const r = await client.messages.create({
      model,
      max_tokens: 8,
      messages: [{ role: "user", content: "ping" }],
    });
    out.anthropic = "ok";
    out.anthropicReply =
      r.content?.[0]?.type === "text" ? r.content[0].text.slice(0, 40) : "(non-text)";
  } catch (e) {
    out.anthropic = "error";
    out.anthropicStatus = (e as { status?: number })?.status ?? null;
    out.anthropicError = String((e as Error)?.message ?? e).slice(0, 300);
  }

  return Response.json(out);
}
