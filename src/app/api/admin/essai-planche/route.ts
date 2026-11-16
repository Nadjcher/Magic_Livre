/** Essai « planche validée + insertion de l'enfant » (administrateurs) : POST, environ 0,10 $. */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { essaiPlanche } from "@/lib/essaiPlanche";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return new NextResponse("Non.", { status: 404 });
  const corps = (await req.json().catch(() => ({}))) as { premium?: unknown; planche?: unknown };
  try {
    return NextResponse.json(
      await essaiPlanche({
        premium: corps.premium === true,
        plancheExistante: typeof corps.planche === "string" ? corps.planche : undefined,
      }),
    );
  } catch (e) {
    return NextResponse.json({ erreur: String(e).slice(0, 300) }, { status: 502 });
  }
}
