import { test, expect } from "@playwright/test";

test("l'immeuble s'affiche avec ses 8 étages et ses 49 bureaux", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "QG des agents IA" })).toBeVisible();
  const etages = page.locator("section.etage");
  await expect(etages).toHaveCount(8);
  await expect(etages.first()).toHaveAttribute("data-pole", "dir");
  await expect(etages.last()).toHaveAttribute("data-pole", "fa");
  await expect(page.locator("button.bureau")).toHaveCount(49);
  await expect(page.getByRole("region", { name: /Direction, chef Gaspard/ })).toBeVisible();
  // Pas de défilement horizontal
  const largeur = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(largeur).toBeLessThanOrEqual(0);
});

test("un bureau ouvre la fiche de l'agent au clic", async ({ page }) => {
  // L'immeuble flotte doucement : on coupe les animations pour un clic stable (vérifie aussi prefers-reduced-motion).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".tour")).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: /Bureau de Sofia, Analyste backtests/ }).click();
  const fiche = page.getByRole("dialog", { name: "Sofia" });
  await expect(fiche).toBeVisible();
  await expect(fiche).toContainText("Lance un backtest sur deux ans");
  await expect(fiche).toContainText("Test à blanc, compte fictif, aucun argent réel");
  await page.keyboard.press("Escape");
  await expect(fiche).toBeHidden();
});

test("un bureau s'ouvre aussi au clavier, animations actives", async ({ page }) => {
  await page.goto("/");
  const bureau = page.getByRole("button", { name: /Bureau de Gaspard, CEO/ });
  await bureau.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Gaspard" })).toBeVisible();
  await page.getByRole("button", { name: "Fermer" }).click({ force: true });
  await expect(page.getByRole("dialog", { name: "Gaspard" })).toBeHidden();
});

test("/direct redirige vers la connexion sans mot de passe", async ({ page, request }) => {
  await page.goto("/direct");
  await expect(page).toHaveURL(/\/connexion$/);
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  const api = await request.get("/api/direct");
  expect(api.status()).toBe(401);
});

test("mauvais mot de passe refusé, bon mot de passe accepté, aucune fausse donnée", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Mot de passe").fill("faux");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page.locator(".erreur")).toContainText("Mot de passe incorrect");

  await page.getByLabel("Mot de passe").fill("mot-de-passe-de-test");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page).toHaveURL(/\/direct$/);
  // Sans compte Google configuré, chaque bloc doit dire « donnée indisponible ».
  await expect(page.getByText("donnée indisponible", { exact: true })).toHaveCount(7);
});
