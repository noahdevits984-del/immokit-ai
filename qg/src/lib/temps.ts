export const FUSEAU = "Europe/Paris";

export type Phase = "aube" | "jour" | "crepuscule" | "nuit";

export function heureParis(d = new Date()): { h: number; m: number } {
  const parts = new Intl.DateTimeFormat("fr-BE", {
    timeZone: FUSEAU,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { h, m };
}

export function phaseDuCiel(d = new Date()): Phase {
  const { h } = heureParis(d);
  if (h >= 6 && h < 9) return "aube";
  if (h >= 9 && h < 18) return "jour";
  if (h >= 18 && h < 21) return "crepuscule";
  return "nuit";
}

export function formatHeure(d = new Date()): string {
  return new Intl.DateTimeFormat("fr-BE", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}

export function formatDateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-BE", {
    timeZone: FUSEAU,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** Décalage (ms) du fuseau de Paris par rapport à UTC à un instant donné. */
function decalageParis(utcMs: number): number {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const local = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  return local - utcMs;
}

function heureLocaleVersDate(utc: boolean, y: number, mo: number, d: number, h: number, mi: number, s: number): Date | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null;
  const naif = Date.UTC(y, mo - 1, d, h, mi, s);
  if (utc) return new Date(naif);
  const premier = naif - decalageParis(naif);
  return new Date(naif - decalageParis(premier));
}

/**
 * Lit un horodatage tel qu'il apparaît dans une feuille Google :
 * ISO 8601, « 22/11/2026 14:05[:10] », « 2026-11-22 14:05:10 ».
 * Sans fuseau explicite, l'heure est lue comme l'heure de Paris, ou en UTC si `utc` est vrai
 * (colonne nommée par exemple « date_utc »).
 */
export function lireHorodatage(valeur: unknown, utc = false): Date | null {
  if (typeof valeur !== "string") return null;
  const v = valeur.trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/.test(v)) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return heureLocaleVersDate(utc, +m[1], +m[2], +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ ,à]+(\d{1,2})[:h](\d{2})(?::(\d{2}))?)?/);
  if (m) return heureLocaleVersDate(utc, +m[3], +m[2], +m[1], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  return null;
}
