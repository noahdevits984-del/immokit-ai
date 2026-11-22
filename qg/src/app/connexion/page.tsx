import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_SESSION, jetonValide } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion · QG des agents IA" };
export const dynamic = "force-dynamic";

export default async function Connexion({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const jar = await cookies();
  if (jetonValide(jar.get(COOKIE_SESSION)?.value)) redirect("/direct");
  const { erreur } = await searchParams;
  return (
    <main className="page-simple" id="contenu">
      <form className="carte" method="post" action="/api/connexion">
        <h1>Espace privé</h1>
        <p className="discret">Les dernières lignes des feuilles du QG, en lecture seule.</p>
        {erreur && (
          <p className="erreur" role="alert">
            {erreur === "config"
              ? "L'espace privé n'est pas encore configuré (variable QG_PASSWORD absente)."
              : "Mot de passe incorrect."}
          </p>
        )}
        <label htmlFor="motdepasse">Mot de passe</label>
        <input id="motdepasse" name="motdepasse" type="password" autoComplete="current-password" required autoFocus />
        <button type="submit" className="bouton">
          Entrer
        </button>
        <a href="/" className="lien-retour">
          ← Retour à l&apos;immeuble
        </a>
      </form>
    </main>
  );
}
