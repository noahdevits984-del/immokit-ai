import { NextResponse } from "next/server";
import { activiteParPole, lireTout } from "@/lib/sources";

export const dynamic = "force-dynamic";

/** Public : seulement le dernier horodatage par pôle. Aucune ligne, aucun nom, aucun ID de feuille. */
export async function GET() {
  const lecture = await lireTout();
  return NextResponse.json(
    { genereLe: lecture.genereLe, poles: activiteParPole(lecture) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
