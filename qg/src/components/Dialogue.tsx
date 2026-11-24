"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Fenêtre modale accessible basée sur <dialog> (piège du focus et touche Échap natifs). */
export function Dialogue({
  ouvert,
  onFermer,
  titreId,
  className,
  children,
}: {
  ouvert: boolean;
  onFermer: () => void;
  titreId: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);
  return (
    <dialog
      ref={ref}
      className={`dialogue ${className ?? ""}`}
      aria-labelledby={titreId}
      onClose={onFermer}
      onClick={(e) => {
        if (e.target === ref.current) onFermer();
      }}
    >
      <div className="dialogue__contenu">
        <button type="button" className="dialogue__fermer" onClick={onFermer} aria-label="Fermer">
          ×
        </button>
        {ouvert && children}
      </div>
    </dialog>
  );
}
