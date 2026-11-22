"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { POLES, ORDRE_ETAGES, agentsDuPole, niveauEtage, agentParId, type Agent, type PoleId } from "@/lib/qg";
import { Bureau } from "./Bureau";
import type { Etat } from "./Personnage";
import { formatDateHeure } from "@/lib/temps";
import type { InfoPole } from "./QG";

interface Props {
  etats: Record<string, Etat>;
  bulles: Record<string, string>;
  infos: Partial<Record<PoleId, InfoPole>>;
  ascenseur: PoleId;
  onOuvrir: (a: Agent) => void;
}

function Hall() {
  return (
    <div className="hall" role="img" aria-label="Hall d'accueil du QG, au rez-de-chaussée">
      <svg viewBox="0 0 160 116" aria-hidden="true" focusable="false">
        <rect x={20} y={20} width={84} height={88} rx={4} fill="#dfeaf3" stroke="#56657e" strokeWidth={2} />
        <path d="M62 20 v88" stroke="#56657e" strokeWidth={2} />
        <path className="hall__porte" d="M62 64 L30 50 M62 64 L94 78 M62 64 L48 92 M62 64 L76 36" stroke="#8aa0bd" strokeWidth={3} strokeLinecap="round" />
        <rect x={112} y={70} width={40} height={38} rx={3} fill="#e8dcc4" stroke="#b9a782" />
        <rect x={110} y={66} width={44} height={6} rx={2} fill="#5fd4d9" />
        <ellipse cx={86} cy={111} rx={70} ry={4} fill="#0f1420" opacity={0.08} />
      </svg>
      <span className="bureau__nom">Hall d&apos;accueil</span>
      <span className="bureau__poste">Entrée du QG</span>
    </div>
  );
}

function Statut({ info }: { info?: InfoPole }) {
  if (!info) return null;
  if (info.statut === "chargement") return <span className="statut">Lecture en cours…</span>;
  if (info.statut === "indisponible") return <span className="statut statut--off">Donnée indisponible</span>;
  if (info.statut === "sans-date") return <span className="statut">Feuille sans colonne de date</span>;
  return (
    <span className={`statut${info.actif ? " statut--on" : ""}`}>
      {info.actif ? "En activité · " : "Dernière ligne : "}
      {formatDateHeure(info.dernier)}
    </span>
  );
}

export function Immeuble({ etats, bulles, infos, ascenseur, onOuvrir }: Props) {
  const refs = useRef<Partial<Record<PoleId, HTMLElement | null>>>({});
  const corps = useRef<HTMLDivElement>(null);
  const [paliers, setPaliers] = useState<Partial<Record<PoleId, number>>>({});
  const [petit, setPetit] = useState(false);

  useLayoutEffect(() => {
    const mesurer = () => {
      const res: Partial<Record<PoleId, number>> = {};
      for (const p of ORDRE_ETAGES) {
        const el = refs.current[p];
        if (el) res[p] = el.offsetTop + el.offsetHeight;
      }
      setPaliers(res);
      setPetit(window.matchMedia("(max-width: 600px)").matches);
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    if (corps.current) ro.observe(corps.current);
    return () => ro.disconnect();
  }, []);

  const cible = paliers[ascenseur];

  return (
    <div className="tour">
      <div className="toit" aria-hidden="true">
        <div className="toit__antenne">
          <span className="toit__feu" />
        </div>
        <div className="toit__enseigne">QG</div>
      </div>
      <div className="corps" ref={corps}>
        <div className="etages">
          {ORDRE_ETAGES.map((pid) => {
            const pole = POLES[pid];
            const chef = agentParId(pole.chef);
            const info = infos[pid];
            const actif = info?.statut === "ok" && info.actif;
            return (
              <section
                key={pid}
                ref={(el) => {
                  refs.current[pid] = el;
                }}
                className={`etage${actif ? " etage--actif" : ""}`}
                style={{ ["--c" as string]: pole.couleur }}
                aria-label={`${niveauEtage(pid)} : ${pole.nom}, chef ${chef?.prenom ?? ""}`}
                data-pole={pid}
              >
                <header className="enseigne">
                  <span className="enseigne__niveau">{niveauEtage(pid)}</span>
                  <h2 className="enseigne__nom">{pole.nom}</h2>
                  <span className="enseigne__chef">Chef : {chef?.prenom}</span>
                  <Statut info={info} />
                </header>
                <div className="bureaux">
                  {agentsDuPole(pid).map((a) => (
                    <Bureau
                      key={a.id}
                      agent={a}
                      couleur={pole.couleur}
                      etat={etats[a.id] ?? "tape"}
                      bulle={bulles[a.id]}
                      estChef={a.id === pole.chef}
                      actif={Boolean(actif)}
                      nomPole={pole.nom}
                      onOuvrir={onOuvrir}
                    />
                  ))}
                  {pid === "fa" && <Hall />}
                </div>
              </section>
            );
          })}
        </div>
        <div className="gaine" aria-hidden="true">
          {ORDRE_ETAGES.map((p) =>
            paliers[p] !== undefined ? (
              <span key={p} className="gaine__palier" style={{ top: paliers[p], ["--c" as string]: POLES[p].couleur }} />
            ) : null,
          )}
          <div
            className="cabine"
            style={{
              transform: `translateY(${cible !== undefined ? cible - (petit ? 50 : 66) : 0}px)`,
              ["--c" as string]: POLES[ascenseur].couleur,
              opacity: cible === undefined ? 0 : 1,
            }}
          >
            <svg viewBox="0 0 40 56" width="100%" height="100%">
              <rect x={1} y={1} width={38} height={54} rx={4} fill="rgba(220,240,255,0.55)" stroke="#2a3242" strokeWidth={2} />
              <rect x={4} y={4} width={32} height={4} rx={1} fill="var(--c)" />
              <circle cx={20} cy={22} r={6} fill="#d9a27a" />
              <path d="M14 21 a6 6 0 0 1 12 -1 q-6 -3 -12 1z" fill="#2b1d14" />
              <rect x={13} y={29} width={14} height={18} rx={5} fill="#3f5f4a" />
              <rect x={24} y={34} width={10} height={8} rx={1} fill="#fff" stroke="#5b6475" />
              <path d="M2 50 h36" stroke="#2a3242" strokeWidth={1.5} />
            </svg>
          </div>
        </div>
      </div>
      <div className="socle" aria-hidden="true">
        <span className="socle__propulseur" />
        <span className="socle__propulseur" />
        <span className="socle__propulseur" />
      </div>
    </div>
  );
}
