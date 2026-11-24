import type { Agent } from "@/lib/qg";
import { apparence } from "@/lib/qg";

export type Etat = "tape" | "parle" | "reflechit" | "debout";

const PANTALON = "#262b38";

function Cheveux({ coiffure, couleur, cx, cy }: { coiffure: number; couleur: string; cx: number; cy: number }) {
  const calotte = (
    <path d={`M${cx - 10.5} ${cy + 1} a10.5 10.5 0 0 1 21 -2 q-6 -3 -12 -2 q-5 1 -9 4 z`} fill={couleur} />
  );
  switch (coiffure) {
    case 1:
      return (
        <g>
          <rect x={cx - 11} y={cy - 4} width={9} height={20} rx={4} fill={couleur} />
          {calotte}
        </g>
      );
    case 2:
      return (
        <g>
          <circle cx={cx - 8} cy={cy - 9} r={5} fill={couleur} />
          {calotte}
        </g>
      );
    case 3:
      return (
        <g fill={couleur}>
          <circle cx={cx - 7} cy={cy - 6} r={5} />
          <circle cx={cx} cy={cy - 9} r={5.5} />
          <circle cx={cx + 6} cy={cy - 7} r={4.5} />
          <circle cx={cx - 9} cy={cy + 1} r={4} />
        </g>
      );
    default:
      return calotte;
  }
}

/** Petit personnage stylisé, vu de profil, tourné vers la droite. */
export function Personnage({ agent, etat }: { agent: Agent; etat: Etat }) {
  const a = apparence(agent.id);
  if (etat === "debout") {
    return (
      <g className="perso perso--debout">
        <rect x={43} y={70} width={7} height={36} rx={3.5} fill={PANTALON} />
        <rect x={51} y={70} width={7} height={36} rx={3.5} fill={PANTALON} />
        <ellipse cx={50} cy={107} rx={6} ry={2.6} fill="#151821" />
        <ellipse cx={59} cy={107} rx={6} ry={2.6} fill="#151821" />
        <rect x={40} y={40} width={21} height={34} rx={9} fill={a.haut} />
        <rect x={47} y={34} width={7} height={8} rx={3} fill={a.peau} />
        <circle cx={50} cy={27} r={10} fill={a.peau} />
        <Cheveux coiffure={a.coiffure} couleur={a.cheveux} cx={50} cy={27} />
        <circle cx={55.5} cy={27} r={1.4} fill="#1a1a1a" />
        <path className="perso__salut" d="M57 46 L66 36 L70 22" stroke={a.haut} strokeWidth={6} strokeLinecap="round" fill="none" />
        <circle className="perso__salut" cx={70} cy={20} r={3.4} fill={a.peau} />
      </g>
    );
  }
  return (
    <g className={`perso perso--${etat}`}>
      <rect x={46} y={79} width={30} height={9} rx={4.5} fill={PANTALON} />
      <rect x={68} y={84} width={8} height={22} rx={4} fill={PANTALON} />
      <ellipse cx={76} cy={107} rx={7} ry={2.8} fill="#151821" />
      <rect x={40} y={53} width={20} height={31} rx={8} fill={a.haut} />
      <rect x={47} y={47} width={7} height={8} rx={3} fill={a.peau} />
      <g className="perso__tete">
        <circle cx={50} cy={41} r={10} fill={a.peau} />
        <Cheveux coiffure={a.coiffure} couleur={a.cheveux} cx={50} cy={41} />
        <circle cx={55.5} cy={41} r={1.4} fill="#1a1a1a" />
        {etat === "parle" && <ellipse className="perso__bouche" cx={58} cy={46} rx={1.6} ry={1.2} fill="#7a2e2e" />}
      </g>
      {etat === "reflechit" ? (
        <g>
          <path d="M55 60 L62 66 L59 49" stroke={a.haut} strokeWidth={6} strokeLinecap="round" fill="none" />
          <circle cx={59} cy={48} r={3.2} fill={a.peau} />
        </g>
      ) : (
        <g className="perso__bras">
          <path d="M54 60 L64 71 L80 70" stroke={a.haut} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx={81} cy={70} r={3.2} fill={a.peau} />
        </g>
      )}
    </g>
  );
}

/** Tête seule, pour l'avatar de la fiche. */
export function Avatar({ agent, couleur }: { agent: Agent; couleur: string }) {
  const a = apparence(agent.id);
  return (
    <svg viewBox="0 0 100 100" width={72} height={72} aria-hidden="true" focusable="false">
      <circle cx={50} cy={50} r={48} fill={couleur} opacity={0.25} />
      <path d="M22 100 q0 -30 28 -30 q28 0 28 30 z" fill={a.haut} />
      <rect x={44} y={56} width={12} height={14} rx={5} fill={a.peau} />
      <g transform="translate(50 42) scale(2.1) translate(-50 -41)">
        <circle cx={50} cy={41} r={10} fill={a.peau} />
        <Cheveux coiffure={a.coiffure} couleur={a.cheveux} cx={50} cy={41} />
        <circle cx={55.5} cy={41} r={1.2} fill="#1a1a1a" />
      </g>
    </svg>
  );
}
