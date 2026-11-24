"use client";

import type { Agent, PoleId } from "@/lib/qg";
import { apparence } from "@/lib/qg";
import { Personnage, type Etat } from "./Personnage";

/** Objet mural propre au métier du pôle. */
function ObjetMetier({ pole, couleur }: { pole: PoleId; couleur: string }) {
  switch (pole) {
    case "dir":
      return (
        <g>
          <circle cx={16} cy={22} r={9} fill="#7ec3e6" stroke="#2c4a63" strokeWidth={1.5} />
          <path d="M8 20 q8 4 16 0 M16 13 q-5 9 0 18 M16 13 q5 9 0 18" stroke="#2c4a63" strokeWidth={1.2} fill="none" />
          <path d="M16 31 v4 M10 36 h12" stroke="#2c4a63" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case "gw":
      return (
        <g>
          <rect x={6} y={12} width={18} height={23} rx={2} fill="#fff" stroke="#2c3550" strokeWidth={1.5} />
          <path d="M10 18 h10 M10 22 h10 M10 26 h7" stroke={couleur} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M22 30 l6 -12" stroke="#2c3550" strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );
    case "pf":
      return (
        <g>
          <rect x={5} y={16} width={22} height={18} rx={2} fill="#f3d27a" stroke="#6b5420" strokeWidth={1.3} />
          <rect x={7} y={12} width={18} height={6} rx={1.5} fill="#fff" stroke="#6b5420" strokeWidth={1} />
          <path d="M11 25 l3 3 l6 -6" stroke="#1f7a4e" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      );
    case "tr":
      return (
        <g>
          <rect x={4} y={11} width={24} height={22} rx={2} fill="#fff" stroke="#3a3f4f" strokeWidth={1.3} />
          <path d="M9 16 v12 M15 19 v10 M21 14 v9" stroke="#3a3f4f" strokeWidth={1} />
          <rect x={7.5} y={19} width={3} height={6} fill="#2f9e6a" />
          <rect x={13.5} y={21} width={3} height={5} fill="#d2553a" />
          <rect x={19.5} y={16} width={3} height={5} fill="#2f9e6a" />
        </g>
      );
    case "lg":
      return (
        <g>
          <rect x={4} y={11} width={24} height={22} rx={2} fill="#e8f1e4" stroke="#3a3f4f" strokeWidth={1.3} />
          <path d="M7 29 q6 -10 10 -4 t8 -10" stroke={couleur} strokeWidth={2} fill="none" strokeDasharray="3 2" />
          <path d="M23 13 a3 3 0 1 1 0.1 0 M23 19 l-2.5 -3.5 h5 z" fill="#d2553a" />
        </g>
      );
    case "gr":
      return (
        <g>
          <path d="M7 19 h5 l11 -7 v20 l-11 -7 h-5 z" fill={couleur} stroke="#5a2140" strokeWidth={1.3} strokeLinejoin="round" />
          <path d="M10 25 l2 7" stroke="#5a2140" strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );
    case "ts":
      return (
        <g>
          <circle cx={16} cy={20} r={9} fill="none" stroke="#fff4dc" strokeWidth={3.5} />
          <circle cx={16} cy={20} r={9} fill="none" stroke="#c98a2a" strokeWidth={1} />
          <rect x={13} y={15} width={6} height={10} rx={1.2} fill="#1b2130" />
          <path d="M16 29 v7 M11 37 l5 -2 l5 2" stroke="#3a3f4f" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </g>
      );
    case "fa":
      return (
        <g>
          <rect x={7} y={11} width={18} height={24} rx={2.5} fill="#e8edf3" stroke="#3a3f4f" strokeWidth={1.3} />
          <rect x={10} y={14} width={12} height={5} rx={1} fill="#9fd9c4" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={10 + c * 4.2} y={22 + r * 4} width={3} height={2.6} rx={0.6} fill="#5b6475" />),
          )}
        </g>
      );
  }
}

function Ecran({ pole, couleur }: { pole: PoleId; couleur: string }) {
  return (
    <g>
      <rect x={90} y={30} width={42} height={32} rx={3.5} fill="#1b2130" />
      <rect className="ecran__fond" x={93} y={33} width={36} height={26} rx={1.5} fill={couleur} />
      {pole === "tr" ? (
        <g className="ecran__lignes">
          <path d="M96 52 l6 -5 l5 3 l6 -9 l5 4 l7 -8" stroke="#0f1420" strokeWidth={1.6} fill="none" />
        </g>
      ) : (
        <g className="ecran__lignes" fill="#0f1420" opacity={0.75}>
          <rect x={96} y={37} width={22} height={2.4} rx={1} />
          <rect x={96} y={42} width={28} height={2.4} rx={1} />
          <rect x={96} y={47} width={16} height={2.4} rx={1} />
          <rect className="ecran__curseur" x={96} y={52} width={10} height={2.4} rx={1} />
        </g>
      )}
      <rect x={108} y={62} width={5} height={11} fill="#3a4152" />
      <rect x={101} y={72} width={19} height={2.4} rx={1} fill="#3a4152" />
    </g>
  );
}

export interface BureauProps {
  agent: Agent;
  couleur: string;
  etat: Etat;
  bulle?: string;
  estChef: boolean;
  actif: boolean;
  nomPole: string;
  onOuvrir: (a: Agent) => void;
}

export function Bureau({ agent, couleur, etat, bulle, estChef, actif, nomPole, onOuvrir }: BureauProps) {
  const ap = apparence(agent.id);
  const label = `Bureau de ${agent.prenom}, ${agent.poste}${estChef ? ", chef du pôle" : ""}, ${nomPole}. Ouvrir la fiche.`;
  return (
    <button
      type="button"
      className={`bureau bureau--${etat}${actif ? " bureau--actif" : ""}`}
      aria-label={label}
      data-agent={agent.id}
      onClick={() => onOuvrir(agent)}
    >
      {bulle && (
        <span className={`bulle${etat === "debout" ? " bulle--mission" : ""}`} aria-hidden="true">
          {bulle}
        </span>
      )}
      <svg className="bureau__scene" viewBox="0 0 160 116" aria-hidden="true" focusable="false">
        <ellipse cx={86} cy={110} rx={70} ry={4} fill="#0f1420" opacity={0.08} />
        <ObjetMetier pole={agent.pole} couleur={couleur} />
        {/* chaise */}
        <g fill="#3b4252">
          <rect x={29} y={50} width={6} height={36} rx={3} />
          <rect x={28} y={82} width={36} height={6} rx={3} />
          <rect x={43} y={88} width={4} height={15} />
          <rect x={31} y={102} width={28} height={3.5} rx={1.7} />
          <circle cx={33} cy={107} r={2.2} />
          <circle cx={57} cy={107} r={2.2} />
        </g>
        <Personnage agent={agent} etat={etat} />
        {/* bureau */}
        <rect x={62} y={74} width={92} height={6} rx={2} fill="#e8dcc4" stroke="#b9a782" strokeWidth={0.8} />
        <rect x={120} y={80} width={30} height={28} rx={2} fill="#ddd0b4" stroke="#b9a782" strokeWidth={0.8} />
        <path d="M124 89 h22 M124 98 h22" stroke="#b9a782" strokeWidth={1} />
        <rect x={74} y={80} width={3.5} height={28} fill="#b9a782" />
        <rect x={78} y={71} width={22} height={3} rx={1} fill="#c9ced8" />
        <Ecran pole={agent.pole} couleur={couleur} />
        {ap.plante ? (
          <g>
            <rect x={137} y={63} width={11} height={11} rx={2} fill="#c46a43" />
            <ellipse cx={139} cy={57} rx={3.5} ry={6.5} fill="#3e9a5b" transform="rotate(-25 139 57)" />
            <ellipse cx={146} cy={56} rx={3.5} ry={7} fill="#2f7d48" transform="rotate(22 146 56)" />
            <ellipse cx={142.5} cy={54} rx={3} ry={7.5} fill="#4cb06b" />
          </g>
        ) : (
          <g>
            <rect x={138} y={64} width={10} height={10} rx={2} fill="#fff" stroke="#8a93a6" strokeWidth={1} />
            <path d="M148 67 q4 0 4 3 t-4 3" stroke="#8a93a6" strokeWidth={1.4} fill="none" />
            <path className="vapeur" d="M141 61 q-2 -3 0 -6 M145 61 q-2 -3 0 -6" stroke="#8a93a6" strokeWidth={1} fill="none" />
          </g>
        )}
        {etat === "reflechit" && (
          <g className="pensee">
            <circle cx={62} cy={31} r={2} fill="#fff" stroke="#9aa3b5" />
            <circle cx={67} cy={24} r={3} fill="#fff" stroke="#9aa3b5" />
            <ellipse cx={78} cy={13} rx={13} ry={8} fill="#fff" stroke="#9aa3b5" />
            <circle className="pensee__point" cx={72} cy={13} r={1.6} fill="#5b6475" />
            <circle className="pensee__point" cx={78} cy={13} r={1.6} fill="#5b6475" />
            <circle className="pensee__point" cx={84} cy={13} r={1.6} fill="#5b6475" />
          </g>
        )}
      </svg>
      <span className="bureau__nom">
        {agent.prenom}
        {estChef && (
          <span className="bureau__chef" aria-hidden="true">
            {" "}
            ★
          </span>
        )}
      </span>
      <span className="bureau__poste">{agent.poste}</span>
    </button>
  );
}
