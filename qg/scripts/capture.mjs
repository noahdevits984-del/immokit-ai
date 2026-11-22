// Capture d'écran de l'immeuble à 820 px de large (largeur d'un iPad Air en portrait).
// Utilisation : npm run build && npm run start, puis `npm run capture` (URL par défaut : http://localhost:3000).
import { chromium } from "playwright";

const url = process.argv[2] ?? process.env.QG_URL ?? "http://localhost:3000";
const sortie = process.argv[3] ?? "docs/capture-820.png";
const pleinePage = !process.argv.includes("--ecran");

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".etage");
await page.waitForTimeout(6000); // laisse l'ascenseur et les bulles se mettre en place
await page.screenshot({ path: sortie, fullPage: pleinePage });
await navigateur.close();
console.log(`Capture enregistrée : ${sortie}`);
