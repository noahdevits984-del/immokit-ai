# QG des agents IA — l'immeuble dans le ciel

Un site qui montre le QG d'agents IA comme une tour de verre suspendue dans le ciel : un étage par pôle, un bureau par agent. Les personnages tapent, parlent, réfléchissent et se lèvent quand une mission arrive. L'ascenseur vitré monte et descend entre les pôles.

- **Partie publique** (`/`) : l'immeuble, les étages, les 49 agents et leurs fiches, les missions du jour et les horaires des automatisations. Aucune donnée privée.
- **Espace privé** (`/direct`, protégé par mot de passe) : les dernières lignes des feuilles Google du QG (Vidéos, Produits, Trades, Prospects, Arrêts, journal d'actualités) et les fichiers du dossier Drive « vidéo TikTok ». Lecture seule, rafraîchie toutes les 60 secondes.

Le site **n'envoie rien, ne publie rien et ne passe aucun ordre**. Il affiche seulement.

Tout est gratuit : Next.js, hébergement Vercel (plan Hobby) et API Google Sheets/Drive (quota gratuit). Aucune dépendance payante.

---

## 1. Lancer le site sur ton ordinateur

Il faut Node.js 20 ou plus récent.

```bash
cd qg
npm install
cp .env.example .env.local   # puis remplis les valeurs (voir plus bas)
npm run dev
```

Ouvre ensuite http://localhost:3000.

Sans clés Google, l'immeuble fonctionne quand même : les étages reliés à une feuille affichent « Donnée indisponible ». Le site n'invente jamais de données.

## 2. Déployer sur Vercel (pas à pas)

1. Crée un compte gratuit sur https://vercel.com (« Continue with GitHub »).
2. Clique sur **Add New… → Project**, puis choisis le dépôt GitHub qui contient ce dossier.
3. Dans **Root Directory**, clique sur *Edit* et choisis **`qg`**. C'est important : le site vit dans ce sous-dossier.
4. Le *Framework Preset* doit indiquer **Next.js**. Laisse les autres réglages par défaut.
5. Ouvre **Environment Variables** et ajoute les variables du tableau ci-dessous.
6. Clique sur **Deploy**. Après une ou deux minutes, Vercel te donne l'adresse du site.
7. Pour modifier une variable plus tard : **Settings → Environment Variables**, puis **Deployments → … → Redeploy**.

| Variable | Contenu |
|---|---|
| `QG_PASSWORD` | Le mot de passe de la page `/direct` (choisis-en un long). |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | L'e-mail du compte de service (voir étape 3). |
| `GOOGLE_PRIVATE_KEY` | La clé privée du compte de service (le champ `private_key` du fichier JSON). |
| `QG_SHEET_ID` | L'ID de la feuille du QG (onglets Arrêts, Trades, Prospects, Vidéos, Produits). |
| `QG_JOURNAL_SHEET_ID` | L'ID de la feuille « journal d'actualités ». |
| `QG_DRIVE_FOLDER_ID` | L'ID du dossier Drive « vidéo TikTok ». |

L'ID d'une feuille, c'est la partie de l'adresse entre `/d/` et `/edit`. L'ID d'un dossier Drive, c'est la fin de l'adresse après `/folders/`. Ces ID restent **uniquement** dans les variables d'environnement : ils ne sont jamais envoyés au navigateur.

## 3. Créer le compte de service Google (lecture seule)

1. Va sur https://console.cloud.google.com et crée un projet (par exemple « qg-agents »). C'est gratuit, sans carte bancaire.
2. Menu **API et services → Bibliothèque**. Active **Google Sheets API**, puis **Google Drive API**.
3. Menu **API et services → Identifiants → Créer des identifiants → Compte de service**. Donne-lui un nom (par exemple « qg-lecture »). **N'attribue aucun rôle** au projet : il n'en a pas besoin.
4. Ouvre le compte de service créé, onglet **Clés → Ajouter une clé → Créer une clé → JSON**. Un fichier `.json` se télécharge.
5. Dans ce fichier, copie :
   - `client_email` → dans `GOOGLE_SERVICE_ACCOUNT_EMAIL` ;
   - `private_key` → dans `GOOGLE_PRIVATE_KEY`. Colle-la telle quelle, y compris `-----BEGIN PRIVATE KEY-----` et les `\n`. Dans `.env.local`, mets-la entre guillemets.
6. Range le fichier JSON en lieu sûr ou supprime-le. **Ne le mets jamais dans le dépôt.**

Le site demande seulement les autorisations `spreadsheets.readonly` et `drive.readonly` : il ne peut rien modifier.

## 4. Partager les feuilles avec le compte de service

Le compte de service ne voit que ce qu'on partage avec lui :

1. Ouvre la feuille du QG → **Partager** → colle l'e-mail du compte de service → rôle **Lecteur** → décoche « Envoyer une notification » → **Partager**.
2. Fais pareil pour la feuille « journal d'actualités ».
3. Fais pareil pour le dossier Drive « vidéo TikTok » (clic droit → Partager → **Lecteur**).

Si une feuille n'est pas partagée ou devient illisible, la page affiche « donnée indisponible » au lieu d'une fausse valeur.

## 5. Définir `QG_PASSWORD`

- Choisis une phrase longue (par exemple quatre mots au hasard et un chiffre).
- Sur Vercel : **Settings → Environment Variables → `QG_PASSWORD`**, puis redéploie.
- En local : dans `.env.local`.
- Changer le mot de passe déconnecte automatiquement toutes les sessions ouvertes.

La connexion pose un cookie `httpOnly`, `SameSite=Strict` et `Secure` en production, valable 12 heures. Le mot de passe est comparé à temps constant. Le bouton « Se déconnecter » efface le cookie.

## Comment marche le « en direct »

- Toutes les 60 secondes, l'immeuble appelle `/api/activite`. Cette route publique ne renvoie **que** la date de la dernière ligne de chaque pôle, jamais le contenu des lignes.
- Un pôle est « en activité » pendant l'heure qui suit la dernière ligne ajoutée dans sa feuille. Ses écrans s'allument et le compteur « Agents actifs » l'inclut.
- Quand une nouvelle ligne arrive, l'ascenseur part de la Direction vers le pôle concerné et son chef se lève.
- Correspondance entre pôles et sources :
  - Direction : journal d'actualités ;
  - TikTok Shop : Vidéos, Produits et dossier Drive ;
  - Ghostwriting LinkedIn : Prospects ;
  - Trading : Trades ;
  - Tournée & logistique : Arrêts.
- La date est lue dans la colonne dont l'en-tête contient « Date », « Horodatage », « Heure » ou « Timestamp ». Une colonne qui contient « utc » (comme `date_utc` dans le journal) est lue en temps universel ; les autres sont lues à l'heure de Paris.
- **À savoir :** aujourd'hui, les onglets **Prospects** et **Arrêts** n'ont pas de colonne de date. Leurs étages affichent donc « Feuille sans colonne de date ». Pour les rendre « actifs », ajoute une colonne `Date` remplie à chaque nouvelle ligne.
- Entre deux nouveautés, l'ascenseur fait la tournée des missions du jour (la tâche de chaque agent, tirée de `src/data/qg.json`). Ce n'est pas présenté comme une donnée en direct.
- Le serveur garde la lecture en cache 55 secondes, pour rester largement dans le quota gratuit de Google.

## Modifier le contenu

- Équipe : `src/data/qg.json` (pôles, agents, tâches).
- Horaires des automatisations affichés dans « Missions du jour » : `src/data/automatisations.json`. Ajoute une ligne par automatisation avec `pole`, `nom` et `horaire`.

## Tests et capture d'écran

```bash
npm test           # compile, démarre le site et lance les tests Playwright (iPad 820 px et téléphone 375 px)
npm run capture    # le site doit tourner sur http://localhost:3000 ; enregistre docs/capture-820.png
```

Ce que vérifient les tests :
- l'immeuble s'affiche avec ses 8 étages et ses 49 bureaux, sans défilement horizontal ;
- un bureau ouvre la fiche de l'agent, au clic (animations coupées) et au clavier ;
- `/direct` redirige vers la connexion sans mot de passe, et `/api/direct` répond 401 ;
- un mauvais mot de passe est refusé ; avec le bon, les blocs affichent « donnée indisponible » quand Google n'est pas configuré.

Si Playwright ne trouve pas de navigateur : `npx playwright install chromium`.

## Règles respectées

- Pas de promesse de gains. Trading : test à blanc, compte fictif, aucun argent réel.
- Pas de données personnelles de tiers sur la partie publique : prospects et arrêts restent dans `/direct`.
- Aucune clé, aucun mot de passe, aucun ID de feuille dans le code envoyé au navigateur.
- Animations coupées si l'appareil demande moins de mouvement (`prefers-reduced-motion`).
- Navigation au clavier, `aria-label` sur chaque étage et chaque bureau, cibles tactiles d'au moins 44 px, aucun texte sous 14 px.
