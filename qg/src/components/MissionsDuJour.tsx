"use client";

import automatisations from "@/data/automatisations.json";
import { ORDRE_ETAGES, POLES, agentsDuPole, type Agent, type PoleId } from "@/lib/qg";
import { Dialogue } from "./Dialogue";

export function MissionsDuJour({ ouvert, onFermer, onAgent }: { ouvert: boolean; onFermer: () => void; onAgent: (a: Agent) => void }) {
  return (
    <Dialogue ouvert={ouvert} onFermer={onFermer} titreId="missions-titre" className="missions">
      <h2 id="missions-titre">Missions du jour</h2>
      <p className="discret">Chaque agent et sa tâche en cours, étage par étage. Touchez un nom pour ouvrir sa fiche.</p>
      {ORDRE_ETAGES.map((pid) => (
        <section key={pid} className="missions__pole" style={{ ["--c" as string]: POLES[pid].couleur }} aria-label={POLES[pid].nom}>
          <h3>
            <span className="pastille" aria-hidden="true" />
            {POLES[pid].nom}
          </h3>
          <ul>
            {agentsDuPole(pid).map((a) => (
              <li key={a.id}>
                <button type="button" className="lien-bouton" onClick={() => onAgent(a)}>
                  {a.prenom}
                </button>{" "}
                — {a.tache}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <h3 className="missions__auto">Horaires des automatisations</h3>
      <ul className="auto">
        {automatisations.map((x) => (
          <li key={x.nom}>
            <strong>{x.horaire}</strong> · {POLES[x.pole as PoleId].nom} : {x.nom}
          </li>
        ))}
      </ul>
      <p className="discret">Ce site affiche seulement : il n&apos;envoie rien, ne publie rien et ne passe aucun ordre.</p>
    </Dialogue>
  );
}
