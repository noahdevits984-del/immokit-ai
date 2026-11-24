import "server-only";
import { createSign } from "node:crypto";

/**
 * Accès Google en LECTURE SEULE via un compte de service.
 * Signature JWT faite à la main (aucune dépendance) ; les clés viennent des variables d'environnement.
 */
const PORTEES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
].join(" ");

let jetonEnCache: { valeur: string; expire: number } | null = null;

export function googleConfigure(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

function b64url(v: string | Buffer): string {
  return Buffer.from(v).toString("base64url");
}

async function jetonAcces(): Promise<string> {
  if (jetonEnCache && jetonEnCache.expire > Date.now() + 60_000) return jetonEnCache.valeur;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const cle = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !cle) throw new Error("Compte de service non configuré");

  const maintenant = Math.floor(Date.now() / 1000);
  const entete = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = b64url(
    JSON.stringify({ iss: email, scope: PORTEES, aud: "https://oauth2.googleapis.com/token", iat: maintenant, exp: maintenant + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${entete}.${corps}`).sign(cle);
  const assertion = `${entete}.${corps}.${b64url(signature)}`;

  const rep = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!rep.ok) throw new Error(`Jeton Google refusé (${rep.status})`);
  const json = (await rep.json()) as { access_token: string; expires_in: number };
  jetonEnCache = { valeur: json.access_token, expire: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function getGoogle<T>(url: string): Promise<T> {
  const jeton = await jetonAcces();
  const rep = await fetch(url, {
    headers: { Authorization: `Bearer ${jeton}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!rep.ok) throw new Error(`Lecture Google impossible (${rep.status})`);
  return (await rep.json()) as T;
}

/** Lit une plage (ex. « 'Vidéos'!A1:Z »). Sans nom d'onglet, Google lit le premier onglet. */
export async function lirePlage(idFeuille: string, plage: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(idFeuille)}/values/${encodeURIComponent(plage)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const json = await getGoogle<{ values?: unknown[][] }>(url);
  return (json.values ?? []).map((ligne) => ligne.map((c) => (c == null ? "" : String(c))));
}

export interface FichierDrive {
  id: string;
  nom: string;
  type: string;
  modifie: string;
  lien: string;
}

export async function listerDossier(idDossier: string, max = 20): Promise<FichierDrive[]> {
  const q = `'${idDossier.replace(/'/g, "")}' in parents and trashed = false`;
  const url =
    "https://www.googleapis.com/drive/v3/files?" +
    new URLSearchParams({
      q,
      orderBy: "modifiedTime desc",
      pageSize: String(max),
      fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
  const json = await getGoogle<{ files?: { id: string; name: string; mimeType: string; modifiedTime: string; webViewLink: string }[] }>(url);
  return (json.files ?? []).map((f) => ({ id: f.id, nom: f.name, type: f.mimeType, modifie: f.modifiedTime, lien: f.webViewLink }));
}
