import "server-only";
import { googleConfigure, lirePlage, listerDossier, type FichierDrive } from "./google";
import { lireHorodatage } from "./temps";
import type { PoleId } from "./qg";

export type CleTableau = "videos" | "produits" | "trades" | "prospects" | "arrets" | "journal";

interface DefSource {
  cle: CleTableau;
  titre: string;
  feuille: "qg" | "journal";
  onglet: string | null;
  pole: PoleId;
}

export const SOURCES: DefSource[] = [
  { cle: "videos", titre: "Vidéos", feuille: "qg", onglet: "Vidéos", pole: "ts" },
  { cle: "produits", titre: "Produits", feuille: "qg", onglet: "Produits", pole: "ts" },
  { cle: "trades", titre: "Trades", feuille: "qg", onglet: "Trades", pole: "tr" },
  { cle: "prospects", titre: "Prospects", feuille: "qg", onglet: "Prospects", pole: "gw" },
  { cle: "arrets", titre: "Arrêts", feuille: "qg", onglet: "Arrêts", pole: "lg" },
  { cle: "journal", titre: "Journal d'actualités", feuille: "journal", onglet: null, pole: "dir" },
];

export type Tableau =
  | { ok: true; titre: string; entetes: string[]; lignes: string[][]; dernier: string | null; avecDate: boolean }
  | { ok: false; titre: string; raison: string };

export type Dossier = { ok: true; fichiers: FichierDrive[]; dernier: string | null } | { ok: false; raison: string };

export interface Lecture {
  genereLe: string;
  tableaux: Record<CleTableau, Tableau>;
  drive: Dossier;
}

const INDISPONIBLE = "donnée indisponible";
const COLONNE_DATE = /(horodat|timestamp|date|heure)/i;

function idFeuille(f: "qg" | "journal"): string | undefined {
  return f === "qg" ? process.env.QG_SHEET_ID : process.env.QG_JOURNAL_SHEET_ID;
}

/**
 * Horodatage le plus récent de la colonne de date (« Date », « date_utc », « Horodatage »…).
 * Sans colonne de date, on ne devine pas : `null`.
 */
function dernierHorodatage(entetes: string[], lignes: string[][]): string | null {
  const col = entetes.findIndex((e) => COLONNE_DATE.test(e));
  if (col < 0) return null;
  const utc = /utc/i.test(entetes[col]);
  let max: number | null = null;
  for (const ligne of lignes) {
    const d = lireHorodatage(ligne[col], utc);
    if (d && (max === null || d.getTime() > max)) max = d.getTime();
  }
  return max === null ? null : new Date(max).toISOString();
}

async function lireTableau(def: DefSource, n: number): Promise<Tableau> {
  const id = idFeuille(def.feuille);
  if (!googleConfigure() || !id) return { ok: false, titre: def.titre, raison: INDISPONIBLE };
  try {
    const plage = def.onglet ? `'${def.onglet.replace(/'/g, "''")}'!A1:Z` : "A1:Z";
    const valeurs = await lirePlage(id, plage);
    const [entetes = [], ...reste] = valeurs;
    const lignes = reste.filter((l) => l.some((c) => c.trim() !== ""));
    return {
      ok: true,
      titre: def.titre,
      entetes,
      lignes: lignes.slice(-n).reverse(),
      dernier: dernierHorodatage(entetes, lignes),
      avecDate: entetes.some((e) => COLONNE_DATE.test(e)),
    };
  } catch {
    return { ok: false, titre: def.titre, raison: INDISPONIBLE };
  }
}

async function lireDrive(): Promise<Dossier> {
  const id = process.env.QG_DRIVE_FOLDER_ID;
  if (!googleConfigure() || !id) return { ok: false, raison: INDISPONIBLE };
  try {
    const fichiers = await listerDossier(id);
    return { ok: true, fichiers, dernier: fichiers[0]?.modifie ?? null };
  } catch {
    return { ok: false, raison: INDISPONIBLE };
  }
}

let cache: { quand: number; lecture: Lecture } | null = null;
let enCours: Promise<Lecture> | null = null;

/** Lit toutes les sources (cache serveur de 55 s pour rester sous les quotas gratuits). */
export async function lireTout(): Promise<Lecture> {
  if (cache && Date.now() - cache.quand < 55_000) return cache.lecture;
  if (enCours) return enCours;
  enCours = (async () => {
    const [tabs, drive] = await Promise.all([Promise.all(SOURCES.map((s) => lireTableau(s, 10))), lireDrive()]);
    const tableaux = Object.fromEntries(SOURCES.map((s, i) => [s.cle, tabs[i]])) as Record<CleTableau, Tableau>;
    const lecture: Lecture = { genereLe: new Date().toISOString(), tableaux, drive };
    cache = { quand: Date.now(), lecture };
    return lecture;
  })().finally(() => {
    enCours = null;
  });
  return enCours;
}

export type StatutPole = { statut: "ok"; dernier: string } | { statut: "indisponible" } | { statut: "sans-date" };

/** Version publique : uniquement le dernier horodatage par pôle, aucune donnée de ligne. */
export function activiteParPole(l: Lecture): Partial<Record<PoleId, StatutPole>> {
  const res: Partial<Record<PoleId, StatutPole>> = {};
  const parPole = new Map<PoleId, { dates: string[]; lisible: boolean; sansDate: boolean }>();
  const noter = (pole: PoleId, ok: boolean, dernier: string | null, avecDate: boolean) => {
    const e = parPole.get(pole) ?? { dates: [], lisible: false, sansDate: true };
    if (ok) {
      e.lisible = true;
      if (avecDate) e.sansDate = false;
      if (dernier) e.dates.push(dernier);
    }
    parPole.set(pole, e);
  };
  for (const s of SOURCES) {
    const t = l.tableaux[s.cle];
    noter(s.pole, t.ok, t.ok ? t.dernier : null, t.ok && t.avecDate);
  }
  noter("ts", l.drive.ok, l.drive.ok ? l.drive.dernier : null, true);
  for (const [pole, e] of parPole) {
    if (e.dates.length > 0) res[pole] = { statut: "ok", dernier: e.dates.sort().at(-1)! };
    else if (e.lisible && e.sansDate) res[pole] = { statut: "sans-date" };
    else res[pole] = { statut: "indisponible" };
  }
  return res;
}
