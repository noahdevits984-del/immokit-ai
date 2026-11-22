import { QG } from "@/components/QG";
import { formatHeure, phaseDuCiel } from "@/lib/temps";

// Rendu à la demande pour que le ciel corresponde tout de suite à l'heure de Paris.
export const dynamic = "force-dynamic";

export default function Accueil() {
  return <QG phaseInitiale={phaseDuCiel()} heureInitiale={formatHeure()} />;
}
