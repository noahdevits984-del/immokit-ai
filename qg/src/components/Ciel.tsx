import type { Phase } from "@/lib/temps";

const NUAGES = [
  { top: 6, echelle: 1.2, duree: 140, delai: -20 },
  { top: 18, echelle: 0.8, duree: 180, delai: -95 },
  { top: 32, echelle: 1.5, duree: 210, delai: -150 },
  { top: 48, echelle: 0.9, duree: 160, delai: -60 },
  { top: 64, echelle: 1.3, duree: 230, delai: -180 },
  { top: 80, echelle: 1, duree: 190, delai: -10 },
];

const OISEAUX = [
  { top: 14, duree: 48, delai: -5, echelle: 1 },
  { top: 16, duree: 48, delai: -6.2, echelle: 0.8 },
  { top: 38, duree: 64, delai: -30, echelle: 0.9 },
];

/** Étoiles à positions fixes (pas d'aléatoire, pour un rendu identique serveur/client). */
const ETOILES = Array.from({ length: 48 }, (_, i) => ({
  x: (i * 37.7) % 100,
  y: (i * 23.3) % 70,
  t: 1 + (i % 3),
  d: (i % 7) * 0.6,
}));

export function Ciel({ phase }: { phase: Phase }) {
  return (
    <div className={`ciel ciel--${phase}`} aria-hidden="true">
      {phase === "nuit" && (
        <div className="etoiles">
          {ETOILES.map((e, i) => (
            <span key={i} style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.t, height: e.t, animationDelay: `${e.d}s` }} />
          ))}
        </div>
      )}
      <div className={`astre astre--${phase === "nuit" ? "lune" : "soleil"}`} />
      {NUAGES.map((n, i) => (
        <div
          key={i}
          className="nuage"
          style={{ top: `${n.top}%`, animationDuration: `${n.duree}s`, animationDelay: `${n.delai}s`, ["--e" as string]: n.echelle }}
        />
      ))}
      {phase !== "nuit" &&
        OISEAUX.map((o, i) => (
          <div key={i} className="oiseau" style={{ top: `${o.top}%`, animationDuration: `${o.duree}s`, animationDelay: `${o.delai}s` }}>
            <svg viewBox="0 0 24 10" width={22 * o.echelle} height={10 * o.echelle}>
              <path className="oiseau__ailes" d="M1 5 Q6 0 12 6 Q18 0 23 5" stroke="#2a3345" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            </svg>
          </div>
        ))}
    </div>
  );
}
