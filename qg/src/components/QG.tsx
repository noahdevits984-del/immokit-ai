"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AGENTS, ORDRE_ETAGES, POLES, apparence, agentsDuPole, type Agent, type PoleId } from "@/lib/qg";
import { formatHeure, phaseDuCiel, type Phase } from "@/lib/temps";
import { Ciel } from "./Ciel";
import { Immeuble } from "./Immeuble";
import { FicheAgent } from "./FicheAgent";
import { MissionsDuJour } from "./MissionsDuJour";
import type { Etat } from "./Personnage";

export type InfoPole =
  | { statut: "chargement" }
  | { statut: "indisponible" }
  | { statut: "sans-date" }
  | { statut: "ok"; dernier: string; actif: boolean };

type ReponseActivite = { genereLe: string; poles: Partial<Record<PoleId, { statut: string; dernier?: string }>> };

const UNE_HEURE = 60 * 60 * 1000;
const POLES_SUIVIS: PoleId[] = ["dir", "ts", "gw", "tr", "lg"];

function etatsInitiaux(): Record<string, Etat> {
  return Object.fromEntries(AGENTS.map((a) => [a.id, apparence(a.id).graine % 5 === 0 ? "reflechit" : "tape"]));
}

function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const maj = () => setReduit(mq.matches);
    maj();
    mq.addEventListener("change", maj);
    return () => mq.removeEventListener("change", maj);
  }, []);
  return reduit;
}

export function QG({ phaseInitiale, heureInitiale }: { phaseInitiale: Phase; heureInitiale: string }) {
  const [phase, setPhase] = useState<Phase>(phaseInitiale);
  const [heure, setHeure] = useState(heureInitiale);
  const [etats, setEtats] = useState<Record<string, Etat>>(etatsInitiaux);
  const [bulles, setBulles] = useState<Record<string, string>>({});
  const [mission, setMission] = useState<{ id: string; texte: string } | null>(null);
  const [ascenseur, setAscenseur] = useState<PoleId>("dir");
  const [trajet, setTrajet] = useState<string>("");
  const [activite, setActivite] = useState<ReponseActivite | null>(null);
  const [erreurActivite, setErreurActivite] = useState(false);
  const [ouvert, setOuvert] = useState<Agent | null>(null);
  const [missionsOuvertes, setMissionsOuvertes] = useState(false);
  const reduit = useMouvementReduit();
  const fileLive = useRef<PoleId[]>([]);
  const dejaVu = useRef<Partial<Record<PoleId, string>>>({});

  // Horloge de Paris et phase du ciel
  useEffect(() => {
    const t = setInterval(() => {
      setHeure(formatHeure());
      setPhase(phaseDuCiel());
    }, 10_000);
    return () => clearInterval(t);
  }, []);

  // Activité « en direct » (horodatages publics uniquement), toutes les 60 s
  useEffect(() => {
    let annule = false;
    const lire = async () => {
      try {
        const r = await fetch("/api/activite", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const json = (await r.json()) as ReponseActivite;
        if (annule) return;
        for (const p of POLES_SUIVIS) {
          const d = json.poles[p]?.dernier;
          const avant = dejaVu.current[p];
          if (d && avant && d > avant) fileLive.current.push(p);
          if (d) dejaVu.current[p] = d;
        }
        setActivite(json);
        setErreurActivite(false);
      } catch {
        if (!annule) setErreurActivite(true);
      }
    };
    lire();
    const t = setInterval(lire, 60_000);
    return () => {
      annule = true;
      clearInterval(t);
    };
  }, []);

  const infos = useMemo(() => {
    const res: Partial<Record<PoleId, InfoPole>> = {};
    const maintenant = Date.now();
    for (const p of POLES_SUIVIS) {
      if (erreurActivite) res[p] = { statut: "indisponible" };
      else if (!activite) res[p] = { statut: "chargement" };
      else {
        const s = activite.poles[p];
        if (s?.statut === "ok" && s.dernier) {
          res[p] = { statut: "ok", dernier: s.dernier, actif: maintenant - new Date(s.dernier).getTime() < UNE_HEURE };
        } else if (s?.statut === "sans-date") res[p] = { statut: "sans-date" };
        else res[p] = { statut: "indisponible" };
      }
    }
    return res;
  }, [activite, erreurActivite]);

  const compteur = useMemo(() => {
    const valeurs = Object.values(infos);
    if (valeurs.some((v) => v?.statut === "chargement")) return { texte: "…", dispo: true };
    if (!valeurs.some((v) => v?.statut === "ok" || v?.statut === "sans-date")) return { texte: "donnée indisponible", dispo: false };
    const n = POLES_SUIVIS.filter((p) => {
      const i = infos[p];
      return i?.statut === "ok" && i.actif;
    }).reduce((s, p) => s + agentsDuPole(p).length, 0);
    return { texte: `${n} / ${AGENTS.length}`, dispo: true };
  }, [infos]);

  // Vie des bureaux : chacun tape, réfléchit ou parle (un seul bavard par étage)
  useEffect(() => {
    if (reduit) return;
    const tic = () => {
      const nouveauxEtats: Record<string, Etat> = {};
      const nouvellesBulles: Record<string, string> = {};
      for (const p of ORDRE_ETAGES) {
        const agents = agentsDuPole(p);
        const bavard = Math.random() < 0.65 ? agents[Math.floor(Math.random() * agents.length)] : null;
        for (const a of agents) {
          if (bavard && a.id === bavard.id) {
            nouveauxEtats[a.id] = "parle";
            nouvellesBulles[a.id] = a.tache;
          } else nouveauxEtats[a.id] = Math.random() < 0.25 ? "reflechit" : "tape";
        }
      }
      setEtats(nouveauxEtats);
      setBulles(nouvellesBulles);
    };
    tic();
    const t = setInterval(tic, 6_500);
    return () => clearInterval(t);
  }, [reduit]);

  // Missions : l'ascenseur part de la Direction et monte/descend vers le pôle concerné
  useEffect(() => {
    const candidats = AGENTS.filter((a) => a.pole !== "dir");
    let i = 0;
    const minuteurs: ReturnType<typeof setTimeout>[] = [];
    const plus = (fn: () => void, ms: number) => minuteurs.push(setTimeout(fn, ms));
    const duree = reduit ? 0 : 2600;

    const cycle = () => {
      const pLive = fileLive.current.shift();
      if (reduit && !pLive) return; // sans animation : seulement les vraies nouveautés
      const agent = pLive ? AGENTS.find((a) => a.id === POLES[pLive].chef)! : candidats[i++ % candidats.length];
      const texte = pLive ? "Nouvelle ligne reçue dans la feuille du pôle" : `Mission : ${agent.tache}`;
      setAscenseur("dir");
      setTrajet(`Direction → ${POLES[agent.pole].nom}`);
      plus(() => setAscenseur(agent.pole), duree + 800);
      plus(() => setMission({ id: agent.id, texte }), duree * 2 + 900);
      plus(() => setMission(null), duree * 2 + 7000);
    };
    plus(cycle, 1500);
    const t = setInterval(cycle, reduit ? 60_000 : 15_000);
    return () => {
      clearInterval(t);
      minuteurs.forEach(clearTimeout);
    };
  }, [reduit]);

  const etatsAffiches = useMemo(() => (mission ? { ...etats, [mission.id]: "debout" as Etat } : etats), [etats, mission]);
  const bullesAffichees = useMemo(() => (mission ? { ...bulles, [mission.id]: mission.texte } : bulles), [bulles, mission]);

  const ouvrir = useCallback((a: Agent) => setOuvert(a), []);

  return (
    <>
      <Ciel phase={phase} />
      <header className="barre">
        <div className="barre__titre">
          <span className="barre__logo" aria-hidden="true" />
          <h1>QG des agents IA</h1>
        </div>
        <div className="barre__infos">
          <p className="barre__info">
            <span className="discret">Paris</span> <time>{heure}</time>
          </p>
          <p className="barre__info" aria-live="polite">
            <span className="discret">Agents actifs</span>{" "}
            <strong className={compteur.dispo ? "" : "indispo"}>{compteur.texte}</strong>
          </p>
        </div>
        <div className="barre__actions">
          <button type="button" className="bouton" onClick={() => setMissionsOuvertes(true)}>
            Missions du jour
          </button>
          <a className="bouton bouton--discret" href="/direct">
            <span aria-hidden="true">🔒 </span>Espace privé
          </a>
        </div>
      </header>

      <main className="scene" id="contenu">
        <p className="trajet" aria-hidden="true">
          <span className="trajet__icone">⇅</span> Ascenseur : {trajet || "à la Direction"}
        </p>
        <Immeuble etats={etatsAffiches} bulles={bullesAffichees} infos={infos} ascenseur={ascenseur} onOuvrir={ouvrir} />
        <footer className="pied">
          <p>
            Ce site affiche seulement : il n&apos;envoie rien, ne publie rien et ne passe aucun ordre. Les personnages sont des
            illustrations d&apos;agents IA.
          </p>
          <p>Trading : test à blanc, compte fictif, aucun argent réel. Aucun gain n&apos;est promis.</p>
          <p>Un pôle est « en activité » pendant l&apos;heure qui suit la dernière ligne ajoutée dans sa feuille.</p>
        </footer>
      </main>

      <FicheAgent agent={ouvert} info={ouvert ? infos[ouvert.pole] : undefined} onFermer={() => setOuvert(null)} />
      <MissionsDuJour
        ouvert={missionsOuvertes}
        onFermer={() => setMissionsOuvertes(false)}
        onAgent={(a) => {
          setMissionsOuvertes(false);
          setOuvert(a);
        }}
      />
    </>
  );
}
