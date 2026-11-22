import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_SESSION, jetonValide } from "@/lib/auth";
import { lireTout } from "@/lib/sources";
import { PanneauDirect } from "./PanneauDirect";

export const metadata: Metadata = { title: "En direct · QG des agents IA" };
export const dynamic = "force-dynamic";

export default async function Direct() {
  const jar = await cookies();
  if (!jetonValide(jar.get(COOKIE_SESSION)?.value)) redirect("/connexion");
  const lecture = await lireTout();
  return <PanneauDirect initiale={lecture} />;
}
