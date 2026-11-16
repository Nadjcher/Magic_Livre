/** Image d'une planche (administrateurs) : ?h=<histoire>&s=<style>&c=<clé>. */
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { lirePlanches } from "@/lib/planches";
import { fetchAsDataUrl } from "@/lib/imageFetch";
import { STYLE_DEFAUT } from "@/lib/style_config";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return new NextResponse("Non.", { status: 404 });
  const u = new URL(req.url);
  const m = await lirePlanches(u.searchParams.get("h") ?? "", u.searchParams.get("s") || STYLE_DEFAUT);
  const url = m.get(u.searchParams.get("c") ?? "")?.url;
  const d = url ? await fetchAsDataUrl(url, { maxPx: 1024, quality: 85 }) : null;
  const b64 = d?.split(",")[1];
  if (!b64) return new NextResponse("Introuvable.", { status: 404 });
  const vignette = await sharp(Buffer.from(b64, "base64")).resize({ width: 480 }).jpeg({ quality: 80 }).toBuffer();
  return new NextResponse(new Uint8Array(vignette), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=60" } });
}
