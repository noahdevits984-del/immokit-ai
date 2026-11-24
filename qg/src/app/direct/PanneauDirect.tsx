"use client";

import { useEffect, useState } from "react";
import type { CleTableau, Lecture, Tableau } from "@/lib/sources";
import { formatDateHeure } from "@/lib/temps";

const ORDRE: { cle: CleTableau; ancre: string; note?: string }[] = [
  { cle: "videos", ancre: "videos" },
  { cle: "produits", ancre: "produits" },
  { cle: "trades", ancre: "trades", note: "Test à blanc, compte fictif, aucun argent réel. Aucun gain n'est promis." },
  { cle: "prospects", ancre: "prospects", note: "Données personnelles : ne pas partager." },
  { cle: "arrets", ancre: "arrets", note: "Adresses de la tournée : ne pas partager." },
  { cle: "journal", ancre: "journal" },
];

function Cellule({ v }: { v: string }) {
  if (/^https:\/\/[^\s]+$/.test(v)) {
    return (
      <a href={v} target="_blank" rel="noopener noreferrer">
        Ouvrir le lien <span className="sr-only">(nouvel onglet)</span>↗
      </a>
    );
  }
  return <>{v}</>;
}

function BlocTableau({ t, ancre, note }: { t: Tableau; ancre: string; note?: string }) {
  return (
    <section className="carte bloc" id={ancre} aria-labelledby={`t-${ancre}`}>
      <h2 id={`t-${ancre}`}>{t.titre}</h2>
      {note && <p className="avertissement">{note}</p>}
      {!t.ok ? (
        <p className="indispo">{t.raison}</p>
      ) : t.lignes.length === 0 ? (
        <p className="discret">Aucune ligne pour le moment.</p>
      ) : (
        <>
          {t.dernier && <p className="discret">Dernière ligne datée : {formatDateHeure(t.dernier)}</p>}
          <div className="table-defile" tabIndex={0} role="region" aria-label={`Dernières lignes : ${t.titre}`}>
            <table>
              <thead>
                <tr>
                  {t.entetes.map((e, i) => (
                    <th key={i} scope="col">
                      {e || `Colonne ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.lignes.map((l, i) => (
                  <tr key={i}>
                    {t.entetes.map((_, j) => (
                      <td key={j}>
                        <Cellule v={l[j] ?? ""} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export function PanneauDirect({ initiale }: { initiale: Lecture }) {
  const [lecture, setLecture] = useState(initiale);
  const [horsLigne, setHorsLigne] = useState(false);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/direct", { cache: "no-store" });
        if (r.status === 401) {
          window.location.href = "/connexion";
          return;
        }
        if (!r.ok) throw new Error();
        setLecture((await r.json()) as Lecture);
        setHorsLigne(false);
      } catch {
        setHorsLigne(true);
      }
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="page-direct" id="contenu">
      <header className="barre barre--direct">
        <div className="barre__titre">
          <span className="barre__logo" aria-hidden="true" />
          <h1>QG en direct</h1>
        </div>
        <p className="barre__info" aria-live="polite">
          <span className="discret">Mis à jour</span> {formatDateHeure(lecture.genereLe)}
          {horsLigne && <span className="indispo"> · donnée indisponible (nouvel essai dans 60 s)</span>}
        </p>
        <div className="barre__actions">
          <a className="bouton bouton--discret" href="/">
            ← Immeuble
          </a>
          <form method="post" action="/api/deconnexion">
            <button type="submit" className="bouton">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <p className="discret centre">Lecture seule. Rafraîchi toutes les 60 secondes. Ce site n&apos;envoie rien et ne publie rien.</p>

      <div className="grille-direct">
        {ORDRE.map((o) => (
          <BlocTableau key={o.cle} t={lecture.tableaux[o.cle]} ancre={o.ancre} note={o.note} />
        ))}
        <section className="carte bloc" id="drive" aria-labelledby="t-drive">
          <h2 id="t-drive">Dossier Drive « vidéo TikTok »</h2>
          {!lecture.drive.ok ? (
            <p className="indispo">{lecture.drive.raison}</p>
          ) : lecture.drive.fichiers.length === 0 ? (
            <p className="discret">Le dossier est vide.</p>
          ) : (
            <ul className="liens">
              {lecture.drive.fichiers.map((f) => (
                <li key={f.id}>
                  <a href={f.lien} target="_blank" rel="noopener noreferrer">
                    {f.nom} <span className="sr-only">(nouvel onglet)</span>
                    <span aria-hidden="true">↗</span>
                  </a>{" "}
                  <span className="discret">· modifié le {formatDateHeure(f.modifie)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
