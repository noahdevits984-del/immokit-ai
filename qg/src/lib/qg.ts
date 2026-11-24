import donnees from "@/data/qg.json";

export type PoleId = "dir" | "gw" | "pf" | "tr" | "lg" | "gr" | "fa" | "ts";

export interface Pole {
  nom: string;
  couleur: string;
  chef: string;
  mission: string;
}

export interface Agent {
  id: string;
  pole: PoleId;
  prenom: string;
  poste: string;
  specialite: string;
  competences: string[];
  outils: string[];
  tache: string;
}

export const POLES = donnees.poles as Record<PoleId, Pole>;
export const AGENTS = donnees.agents as Agent[];

/** Ordre des étages, du penthouse (haut) au rez-de-chaussée (bas). */
export const ORDRE_ETAGES: PoleId[] = ["dir", "gr", "ts", "gw", "pf", "tr", "lg", "fa"];

export function agentsDuPole(pole: PoleId): Agent[] {
  return AGENTS.filter((a) => a.pole === pole);
}

export function agentParId(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function niveauEtage(pole: PoleId): string {
  const i = ORDRE_ETAGES.indexOf(pole);
  const n = ORDRE_ETAGES.length - 1 - i;
  if (n === 0) return "Rez-de-chaussée";
  if (i === 0) return `Penthouse · ${n}e étage`;
  return n === 1 ? "1er étage" : `${n}e étage`;
}

/** Pôles dont l'activité est lue dans une feuille (pour le « en direct »). */
export const SOURCES_PAR_POLE: Partial<Record<PoleId, string[]>> = {
  dir: ["Journal d'actualités"],
  ts: ["Vidéos", "Produits", "Dossier « vidéo TikTok »"],
  gw: ["Prospects"],
  tr: ["Trades"],
  lg: ["Arrêts"],
};

/** Liens publics vers le site officiel de chaque outil. */
export const LIENS_OUTILS: Record<string, string> = {
  Claude: "https://claude.ai",
  Notion: "https://www.notion.so",
  Slack: "https://slack.com",
  Canva: "https://www.canva.com",
  Vercel: "https://vercel.com",
  Supabase: "https://supabase.com",
  Sheets: "https://docs.google.com/spreadsheets",
  Docs: "https://docs.google.com/document",
  Drive: "https://drive.google.com",
  Firecrawl: "https://www.firecrawl.dev",
  Parallel: "https://parallel.ai",
  LinkedIn: "https://www.linkedin.com",
  Zoom: "https://zoom.us",
  Figma: "https://www.figma.com",
  Calendly: "https://calendly.com",
  Gmail: "https://mail.google.com",
  Trello: "https://trello.com",
  GitHub: "https://github.com",
  Python: "https://www.python.org",
  WhatsApp: "https://www.whatsapp.com",
  MT5: "https://www.metatrader5.com",
  Telegram: "https://telegram.org",
  Maps: "https://www.google.com/maps",
  PostHog: "https://posthog.com",
  TikTok: "https://www.tiktok.com",
  n8n: "https://n8n.io",
  Zapier: "https://zapier.com",
  Make: "https://www.make.com",
  HeyGen: "https://www.heygen.com",
  Stripe: "https://stripe.com",
  PayPal: "https://www.paypal.com",
};

/** Liens vers l'espace privé utiles à certains pôles (protégés par mot de passe). */
export const LIENS_PRIVES: Partial<Record<PoleId, { label: string; href: string }[]>> = {
  dir: [{ label: "Journal d'actualités (espace privé)", href: "/direct#journal" }],
  ts: [
    { label: "Vidéos et produits (espace privé)", href: "/direct#videos" },
    { label: "Dossier Drive « vidéo TikTok » (espace privé)", href: "/direct#drive" },
  ],
  gw: [{ label: "Prospects (espace privé)", href: "/direct#prospects" }],
  tr: [{ label: "Journal des trades à blanc (espace privé)", href: "/direct#trades" }],
  lg: [{ label: "Arrêts de la tournée (espace privé)", href: "/direct#arrets" }],
};

/** Apparence stylisée et stable d'un personnage, dérivée de son identifiant. */
export function apparence(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const peaux = ["#f1c7a5", "#d9a27a", "#b97a52", "#8d5a3b", "#f5d6bd", "#6b4329"];
  const cheveux = ["#2b1d14", "#5a3a22", "#c48a3f", "#1d1d24", "#8b2f1f", "#e0c48a", "#6d6d78"];
  const hauts = ["#2f3b56", "#3f5f4a", "#6a3d5a", "#2d4f6e", "#5b4a3a", "#3a3a48", "#6b5a2e"];
  return {
    peau: peaux[h % peaux.length],
    cheveux: cheveux[(h >> 3) % cheveux.length],
    haut: hauts[(h >> 6) % hauts.length],
    coiffure: (h >> 9) % 4, // 0 court, 1 long, 2 chignon, 3 bouclé
    plante: (h >> 12) % 2 === 0,
    graine: h,
  };
}
