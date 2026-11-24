import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION, DUREE_SESSION_S, creerJeton, motDePasseConfigure, verifierMotDePasse } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const saisi = typeof form?.get("motdepasse") === "string" ? (form!.get("motdepasse") as string) : "";

  if (!motDePasseConfigure() || !verifierMotDePasse(saisi)) {
    // Petit délai pour freiner les essais en série.
    await new Promise((r) => setTimeout(r, 600));
    const code = motDePasseConfigure() ? "1" : "config";
    return NextResponse.redirect(new URL(`/connexion?erreur=${code}`, req.url), 303);
  }

  const rep = NextResponse.redirect(new URL("/direct", req.url), 303);
  rep.cookies.set(COOKIE_SESSION, creerJeton(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DUREE_SESSION_S,
  });
  return rep;
}
