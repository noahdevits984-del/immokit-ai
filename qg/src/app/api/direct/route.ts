import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSION, jetonValide } from "@/lib/auth";
import { lireTout } from "@/lib/sources";

export const dynamic = "force-dynamic";

/** Privé : dernières lignes des feuilles, en lecture seule. */
export async function GET() {
  const jar = await cookies();
  if (!jetonValide(jar.get(COOKIE_SESSION)?.value)) {
    return NextResponse.json({ erreur: "Connexion requise" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(await lireTout(), { headers: { "Cache-Control": "no-store" } });
}
