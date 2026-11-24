"use client";

import { LIENS_OUTILS, LIENS_PRIVES, POLES, SOURCES_PAR_POLE, niveauEtage, type Agent } from "@/lib/qg";
import { formatDateHeure } from "@/lib/temps";
import { Avatar } from "./Personnage";
import { Dialogue } from "./Dialogue";
import type { InfoPole } from "./QG";

export function FicheAgent({ agent, info, onFermer }: { agent: Agent | null; info?: InfoPole; onFermer: () => void }) {
  const pole = agent ? POLES[agent.pole] : null;
  const sources = agent ? SOURCES_PAR_POLE[agent.pole] : undefined;
  return (
    <Dialogue ouvert={Boolean(agent)} onFermer={onFermer} titreId="fiche-titre" className="fiche">
      {agent && pole && (
        <article style={{ ["--c" as string]: pole.couleur }}>
          <header className="fiche__entete">
            <Avatar agent={agent} couleur={pole.couleur} />
            <div>
              <h2 id="fiche-titre" className="fiche__nom">
                {agent.prenom}
              </h2>
              <p className="fiche__poste">{agent.poste}</p>
              <p className="fiche__pole">
                <span className="pastille" aria-hidden="true" />
                {pole.nom} · {niveauEtage(agent.pole)}
                {pole.chef === agent.id && " · chef du pôle"}
              </p>
            </div>
          </header>

          <dl className="fiche__liste">
            <dt>Spécialité</dt>
            <dd>{agent.specialite}</dd>
            <dt>Tâche en cours</dt>
            <dd className="fiche__tache">{agent.tache}</dd>
            <dt>Activité en direct</dt>
            <dd>
              {!sources
                ? "Ce pôle n'a pas encore de feuille reliée au QG."
                : !info || info.statut === "chargement"
                  ? "Lecture en cours…"
                  : info.statut === "indisponible"
                    ? "Donnée indisponible."
                    : info.statut === "sans-date"
                      ? "La feuille de ce pôle n'a pas de colonne de date : impossible de savoir quand la dernière ligne a été ajoutée."
                    : info.actif
                      ? `Actif : dernière ligne ajoutée le ${formatDateHeure(info.dernier)}.`
                      : `Calme : dernière ligne ajoutée le ${formatDateHeure(info.dernier)}.`}
              {sources && <span className="fiche__sources"> Sources suivies : {sources.join(", ")}.</span>}
            </dd>
            <dt>Compétences</dt>
            <dd>
              <ul className="puces">
                {agent.competences.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </dd>
            <dt>Outils</dt>
            <dd>
              <ul className="puces">
                {agent.outils.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </dd>
            <dt>Mission du pôle</dt>
            <dd>{pole.mission}</dd>
          </dl>

          {agent.pole === "tr" && (
            <p className="avertissement">Test à blanc, compte fictif, aucun argent réel. Aucun gain n&apos;est promis.</p>
          )}

          <h3 className="fiche__sous-titre">Liens utiles</h3>
          <ul className="liens">
            {agent.outils
              .filter((o) => LIENS_OUTILS[o])
              .map((o) => (
                <li key={o}>
                  <a href={LIENS_OUTILS[o]} target="_blank" rel="noopener noreferrer">
                    {o} <span className="sr-only">(nouvel onglet)</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            {(LIENS_PRIVES[agent.pole] ?? []).map((l) => (
              <li key={l.href}>
                <a href={l.href} className="lien-prive">
                  <span aria-hidden="true">🔒 </span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </article>
      )}
    </Dialogue>
  );
}
