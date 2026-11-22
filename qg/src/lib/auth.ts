import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESSION = "qg_session";
export const DUREE_SESSION_S = 12 * 60 * 60; // 12 heures

function sha256(v: string): Buffer {
  return createHash("sha256").update(v, "utf8").digest();
}

export function motDePasseConfigure(): boolean {
  return typeof process.env.QG_PASSWORD === "string" && process.env.QG_PASSWORD.length > 0;
}

/** Comparaison à temps constant (les deux valeurs sont hachées pour avoir la même longueur). */
export function verifierMotDePasse(saisi: string): boolean {
  const attendu = process.env.QG_PASSWORD;
  if (!attendu) return false;
  return timingSafeEqual(sha256(saisi), sha256(attendu));
}

function cleSignature(): Buffer {
  // Changer QG_PASSWORD invalide automatiquement toutes les sessions ouvertes.
  return sha256(`qg-session|${process.env.QG_PASSWORD ?? ""}`);
}

function signer(charge: string): string {
  return createHmac("sha256", cleSignature()).update(charge).digest("base64url");
}

export function creerJeton(): string {
  const exp = Math.floor(Date.now() / 1000) + DUREE_SESSION_S;
  return `${exp}.${signer(`qg:${exp}`)}`;
}

export function jetonValide(jeton: string | undefined): boolean {
  if (!jeton || !motDePasseConfigure()) return false;
  const [expTxt, sig] = jeton.split(".");
  const exp = Number(expTxt);
  if (!sig || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(signer(`qg:${exp}`));
  return a.length === b.length && timingSafeEqual(a, b);
}
