# ImmoKit AI

Générateur de contenus marketing immobiliers propulsé par Claude d'Anthropic.

## Stack technique

- **Framework** : Next.js 14 (App Router, TypeScript)
- **Base de données** : Supabase (PostgreSQL + Auth)
- **IA** : Claude claude-opus-4-6 (Anthropic)
- **Déploiement** : Vercel

## Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et remplir les variables d'environnement
cp .env.local.example .env.local
# → Éditez .env.local avec vos clés

# 3. Lancer en développement
npm run dev
```

L'app est disponible sur [http://localhost:3000](http://localhost:3000).

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Ouvrez l'**Éditeur SQL** dans le dashboard
3. Copiez et exécutez le contenu de `supabase-schema.sql`
4. Récupérez l'URL et la clé anon dans **Settings → API**
5. Ajoutez-les dans `.env.local`

## Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (jamais exposée côté client) |

## Déploiement sur Vercel

1. Connectez votre repo GitHub à Vercel
2. Ajoutez les variables d'environnement dans **Settings → Environment Variables**
3. Déployez — chaque `git push` sur `main` déclenche un déploiement automatique

## Structure du projet

```
app/
  layout.tsx          Layout racine
  page.tsx            Redirection auth/dashboard
  auth/page.tsx       Connexion & inscription
  dashboard/page.tsx  Tableau de bord (stats, profil, plans)
  generator/page.tsx  Générateur de kit marketing
  api/generate/route.ts  API Route → appel Claude
components/
  Navbar.tsx          Barre de navigation
lib/
  supabase.ts         Client Supabase (browser)
styles/
  globals.css         Design system complet
supabase-schema.sql   Schéma SQL à exécuter
```

## Fonctionnalités

- Authentification complète (inscription / connexion / déconnexion)
- Profil utilisateur avec agence
- Système de crédits (10 crédits offerts à l'inscription)
- Générateur de 4 types de contenus :
  - Post Instagram avec hashtags
  - Fiche de présentation PDF
  - Email professionnel
  - Annonce optimisée portails
- 4 tons de communication (Élégant, Dynamique, Chaleureux, Luxe)
- Support Français / Anglais / Les deux
- Tableau de bord avec statistiques
- Historique des kits générés
