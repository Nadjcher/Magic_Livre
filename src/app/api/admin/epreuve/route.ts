/** Jeu d'épreuve de la relectrice d'images (administrateurs) : POST, environ 0,30 $. */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { estAdmin } from "@/lib/rateLimit";
import { lancerEpreuve } from "@/lib/epreuveRelectrice";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || !estAdmin(user.email)) return new NextResponse("Non.", { status: 404 });
  return NextResponse.json(await lancerEpreuve());
}
