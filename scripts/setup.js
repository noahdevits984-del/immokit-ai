#!/usr/bin/env node
/**
 * ImmoKit AI — Script de configuration automatique
 * Usage : node scripts/setup.js
 *
 * Ce script configure automatiquement :
 *   1. Supabase  — exécute les schémas SQL + crée le bucket photos
 *   2. Stripe    — crée les 3 produits/prix + le webhook
 *   3. Vercel    — injecte toutes les variables d'environnement
 *
 * Aucune clé n'est sauvegardée sur disque.
 */

const readline = require('readline')
const https    = require('https')
const fs       = require('fs')
const path     = require('path')

// ─── Couleurs terminal ────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  gold:   '\x1b[33m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
}

function print(msg = '')      { process.stdout.write(msg + '\n') }
function ok(msg)              { print(`  ${C.green}✓${C.reset} ${msg}`) }
function fail(msg)            { print(`  ${C.red}✗${C.reset} ${msg}`) }
function info(msg)            { print(`  ${C.cyan}→${C.reset} ${msg}`) }
function warn(msg)            { print(`  ${C.gold}!${C.reset} ${msg}`) }
function title(msg)           { print(`\n${C.bold}${C.gold}${msg}${C.reset}`) }
function sep()                { print('─'.repeat(50)) }

// ─── Readline ─────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function ask(question, defaultVal = '') {
  return new Promise(resolve => {
    const hint = defaultVal ? ` ${C.dim}[${defaultVal}]${C.reset}` : ''
    rl.question(`  ${C.bold}?${C.reset} ${question}${hint} : `, answer => {
      const val = answer.trim() || defaultVal
      resolve(val)
    })
  })
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────
function request(url, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u   = new URL(url)
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method, headers },
      res => {
        let data = ''
        res.on('data', c => (data += c))
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
          catch { resolve({ status: res.statusCode, body: data }) }
        })
      }
    )
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function jsonPost(url, token, payload) {
  const body = JSON.stringify(payload)
  return request(url, {
    method: 'POST',
    headers: {
      Authorization:   `Bearer ${token}`,
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  })
}

function stripePost(path, params, secretKey) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach(val => p.append(`${k}[]`, val))
    else p.append(k, v)
  }
  const body = p.toString()
  return request(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization:   `Bearer ${secretKey}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  })
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
async function setupSupabase() {
  title('ÉTAPE 1/3 — Supabase')
  sep()
  print()
  print(`  Vous avez besoin de :`)
  print(`  ${C.dim}1. URL Supabase  → Supabase Dashboard > Settings > API${C.reset}`)
  print(`  ${C.dim}2. Personal Access Token → supabase.com/dashboard/account/tokens${C.reset}`)
  print()

  const supabaseUrl   = await ask('URL Supabase (https://xxxx.supabase.co)')
  const supabaseToken = await ask('Personal Access Token')

  const refMatch = supabaseUrl.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/)
  if (!refMatch) {
    fail('URL invalide. Format attendu : https://xxxx.supabase.co')
    process.exit(1)
  }
  const ref = refMatch[1]
  info(`Project ref : ${ref}`)

  // ── Lire les fichiers SQL ────────────────────────────────────────────────────
  const root    = path.join(__dirname, '..')
  const schema1 = fs.readFileSync(path.join(root, 'supabase-schema.sql'), 'utf8')
  const schema2 = fs.readFileSync(path.join(root, 'supabase-schema-v2.sql'), 'utf8')

  // ── Exécuter schema v1 ───────────────────────────────────────────────────────
  print()
  info('Exécution de supabase-schema.sql...')
  const r1 = await jsonPost(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    supabaseToken,
    { query: schema1 }
  )
  if (r1.status === 200 || r1.status === 201) {
    ok('Schema v1 appliqué')
  } else {
    const msg = typeof r1.body === 'object' ? (r1.body.message || JSON.stringify(r1.body)) : r1.body
    if (String(msg).includes('already exists')) {
      ok('Schema v1 : tables déjà présentes (OK)')
    } else {
      fail(`Schema v1 (${r1.status}) : ${msg}`)
      warn('Vous pouvez exécuter manuellement supabase-schema.sql dans Supabase > SQL Editor')
    }
  }

  // ── Exécuter schema v2 ───────────────────────────────────────────────────────
  info('Exécution de supabase-schema-v2.sql...')
  const r2 = await jsonPost(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    supabaseToken,
    { query: schema2 }
  )
  if (r2.status === 200 || r2.status === 201) {
    ok('Schema v2 appliqué')
  } else {
    const msg = typeof r2.body === 'object' ? (r2.body.message || JSON.stringify(r2.body)) : r2.body
    if (String(msg).includes('already exists')) {
      ok('Schema v2 : colonnes déjà présentes (OK)')
    } else {
      fail(`Schema v2 (${r2.status}) : ${msg}`)
      warn('Vous pouvez exécuter manuellement supabase-schema-v2.sql dans Supabase > SQL Editor')
    }
  }

  // ── Créer le bucket Storage ──────────────────────────────────────────────────
  info('Création du bucket "property-photos"...')
  const rb = await jsonPost(
    `https://api.supabase.com/v1/projects/${ref}/storage/buckets`,
    supabaseToken,
    { id: 'property-photos', name: 'property-photos', public: true }
  )
  if (rb.status === 200 || rb.status === 201) {
    ok('Bucket "property-photos" créé (public)')
  } else {
    const msg = typeof rb.body === 'object' ? (rb.body.message || JSON.stringify(rb.body)) : rb.body
    if (String(msg).toLowerCase().includes('already exists') || String(msg).toLowerCase().includes('duplicate')) {
      ok('Bucket "property-photos" existe déjà (OK)')
    } else {
      warn(`Bucket : ${msg}`)
      warn('Créez manuellement "property-photos" dans Supabase > Storage (Public: ON)')
    }
  }

  print()
  ok('Supabase configuré !')
  return { supabaseUrl, ref }
}

// ─── Stripe ───────────────────────────────────────────────────────────────────
async function setupStripe(vercelDomain) {
  title('ÉTAPE 2/3 — Stripe')
  sep()
  print()
  print(`  ${C.dim}Clés disponibles sur : dashboard.stripe.com/apikeys${C.reset}`)
  print()

  const stripeSecret      = await ask('Clé secrète Stripe (sk_live_... ou sk_test_...)')
  const stripePublishable = await ask('Clé publique Stripe (pk_live_... ou pk_test_...)')

  const products = [
    { name: 'ImmoKit AI — Starter', price: 2900, plan: 'starter', envKey: 'STRIPE_PRICE_STARTER' },
    { name: 'ImmoKit AI — Pro',     price: 4900, plan: 'pro',     envKey: 'STRIPE_PRICE_PRO'     },
    { name: 'ImmoKit AI — Agence',  price: 9900, plan: 'agency',  envKey: 'STRIPE_PRICE_AGENCY'  },
  ]

  const priceIds = {}
  print()

  for (const p of products) {
    info(`Création : ${p.name}...`)

    // Créer le produit
    const rp = await stripePost('/v1/products', {
      name: p.name,
      'metadata[plan]': p.plan,
    }, stripeSecret)

    if (rp.status !== 200) {
      fail(`Produit "${p.name}" : ${rp.body?.error?.message || JSON.stringify(rp.body)}`)
      continue
    }

    // Créer le prix mensuel
    const rprice = await stripePost('/v1/prices', {
      product:                rp.body.id,
      unit_amount:            p.price,
      currency:               'eur',
      'recurring[interval]':  'month',
      'metadata[plan]':       p.plan,
    }, stripeSecret)

    if (rprice.status !== 200) {
      fail(`Prix "${p.name}" : ${rprice.body?.error?.message || JSON.stringify(rprice.body)}`)
      continue
    }

    priceIds[p.envKey] = rprice.body.id
    ok(`${p.name} → ${C.dim}${rprice.body.id}${C.reset}`)
  }

  // ── Créer le webhook ─────────────────────────────────────────────────────────
  print()
  const domain     = vercelDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const webhookUrl = `https://${domain}/api/webhook`
  info(`Création du webhook → ${webhookUrl}`)

  const rw = await stripePost('/v1/webhook_endpoints', {
    url:              webhookUrl,
    enabled_events:   ['checkout.session.completed', 'customer.subscription.deleted'],
  }, stripeSecret)

  let webhookSecret = ''
  if (rw.status === 200) {
    webhookSecret = rw.body.secret
    ok(`Webhook créé`)
    ok(`Webhook secret : ${C.dim}${webhookSecret}${C.reset}`)
  } else {
    fail(`Webhook : ${rw.body?.error?.message || JSON.stringify(rw.body)}`)
    warn('Créez manuellement le webhook dans Stripe Dashboard → Developers → Webhooks')
  }

  print()
  ok('Stripe configuré !')

  return {
    STRIPE_SECRET_KEY:     stripeSecret,
    STRIPE_PUBLISHABLE_KEY: stripePublishable,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    ...priceIds,
  }
}

// ─── Vercel ───────────────────────────────────────────────────────────────────
async function setupVercel(stripeVars) {
  title('ÉTAPE 3/3 — Vercel (variables d\'environnement)')
  sep()
  print()
  print(`  ${C.dim}Token disponible sur : vercel.com/account/tokens${C.reset}`)
  print()

  const vercelToken   = await ask('Token Vercel')
  const projectName   = await ask('Nom du projet Vercel', 'immokit-ai')
  print()
  print(`  ${C.dim}Si votre projet est dans une équipe Vercel, entrez son slug (ex: mon-agence).${C.reset}`)
  print(`  ${C.dim}Pour un compte personnel, appuyez simplement sur Entrée.${C.reset}`)
  const teamSlug      = await ask('Slug de l\'équipe Vercel (Entrée si compte personnel)', '')
  const resendKey     = await ask('RESEND_API_KEY (Entrée pour passer)', '')

  // ── Construire le query string équipe ─────────────────────────────────────────
  const teamQuery = teamSlug ? `?teamId=${encodeURIComponent(teamSlug)}&slug=${encodeURIComponent(teamSlug)}` : ''
  const vercelHeaders = { Authorization: `Bearer ${vercelToken}` }

  // ── Trouver le projet ────────────────────────────────────────────────────────
  print()
  info(`Recherche du projet "${projectName}"...`)

  // Essayer d'abord avec le nom, puis lister tous les projets en cas d'échec
  let projectId = null

  const rproj = await request(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}${teamQuery}`, {
    headers: vercelHeaders,
  })

  if (rproj.status === 200) {
    projectId = rproj.body.id
    ok(`Projet trouvé : ${C.dim}${projectId}${C.reset}`)
  } else {
    // Lister tous les projets pour aider l'utilisateur
    warn(`Accès direct échoué (${rproj.status}). Récupération de la liste des projets...`)
    const rlist = await request(`https://api.vercel.com/v9/projects${teamQuery ? teamQuery : '?'}${teamQuery ? '&' : ''}limit=100`, {
      headers: vercelHeaders,
    })

    if (rlist.status === 200 && Array.isArray(rlist.body.projects)) {
      const names = rlist.body.projects.map(p => `${p.name} (${p.id})`).join('\n    ')
      print()
      print(`  Projets disponibles :`)
      print(`    ${names}`)
      print()
      const chosen = await ask('Entrez l\'ID exact du projet (ex: prj_xxxx)')
      if (!chosen) { fail('Aucun projet sélectionné.'); process.exit(1) }
      projectId = chosen.trim()
      ok(`Projet sélectionné : ${C.dim}${projectId}${C.reset}`)
    } else {
      fail(`Impossible d'accéder à Vercel (${rproj.status}).`)
      fail(`Vérifiez que votre token a le scope "Full Account" (pas "Specific Project").`)
      if (rproj.status === 403) {
        fail(`Token créé sur vercel.com/account/tokens — choisissez "Full Account" comme scope.`)
      }
      process.exit(1)
    }
  }

  // ── Récupérer les vars existantes ─────────────────────────────────────────────
  const renvs = await request(`https://api.vercel.com/v10/projects/${projectId}/env${teamQuery}`, {
    headers: vercelHeaders,
  })
  const existing = {}
  if (renvs.status === 200 && Array.isArray(renvs.body.envs)) {
    for (const e of renvs.body.envs) existing[e.key] = e.id
  }

  // ── Variables à injecter ───────────────────────────────────────────────────
  const vars = { ...stripeVars }
  if (resendKey) vars['RESEND_API_KEY'] = resendKey
  for (const k of Object.keys(vars)) { if (!vars[k]) delete vars[k] }

  print()
  info(`Injection de ${Object.keys(vars).length} variables...`)

  for (const [key, value] of Object.entries(vars)) {
    if (key in existing) {
      const r = await request(`https://api.vercel.com/v10/projects/${projectId}/env/${existing[key]}${teamQuery}`, {
        method: 'PATCH',
        headers: { ...vercelHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, target: ['production', 'preview'] }),
      })
      if (r.status === 200 || r.status === 201) ok(`${key} mis à jour`)
      else fail(`${key} : ${r.body?.error?.message || r.status}`)
    } else {
      const r = await request(`https://api.vercel.com/v10/projects/${projectId}/env${teamQuery}`, {
        method: 'POST',
        headers: { ...vercelHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, type: 'encrypted', target: ['production', 'preview'] }),
      })
      if (r.status === 200 || r.status === 201) ok(`${key} ajouté`)
      else fail(`${key} : ${r.body?.error?.message || r.status}`)
    }
  }

  print()
  ok('Variables Vercel injectées !')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  print()
  print(`${C.bold}${C.gold}╔══════════════════════════════════════════════╗${C.reset}`)
  print(`${C.bold}${C.gold}║   ImmoKit AI — Configuration automatique     ║${C.reset}`)
  print(`${C.bold}${C.gold}╚══════════════════════════════════════════════╝${C.reset}`)
  print()
  print(`  Ce script configure Supabase, Stripe et Vercel.`)
  print(`  ${C.dim}Aucune clé n'est écrite sur disque — tout reste en mémoire.${C.reset}`)
  print()
  print(`  ${C.dim}Avant de commencer, ayez ces onglets ouverts :${C.reset}`)
  print(`  ${C.dim}• supabase.com/dashboard/account/tokens${C.reset}`)
  print(`  ${C.dim}• dashboard.stripe.com/apikeys${C.reset}`)
  print(`  ${C.dim}• vercel.com/account/tokens${C.reset}`)
  print()

  const ready = await ask('Prêt à démarrer ? (o/n)', 'o')
  if (ready.toLowerCase() === 'n') { print('\nAbandon.'); rl.close(); return }

  // ── Domaine Vercel (nécessaire pour le webhook Stripe) ────────────────────
  print()
  info('URL de votre application Vercel')
  print(`  ${C.dim}Trouvez-la dans Vercel Dashboard > votre projet (ex: immokit-ai.vercel.app)${C.reset}`)
  const vercelDomain = await ask('Domaine Vercel', 'immokit-ai.vercel.app')

  // ── Étapes ────────────────────────────────────────────────────────────────
  await setupSupabase()
  const stripeVars = await setupStripe(vercelDomain)
  await setupVercel(stripeVars)

  // ── Résumé final ──────────────────────────────────────────────────────────
  print()
  print(`${C.bold}${C.green}╔══════════════════════════════════════════════╗${C.reset}`)
  print(`${C.bold}${C.green}║        Configuration terminée ! ✅           ║${C.reset}`)
  print(`${C.bold}${C.green}╚══════════════════════════════════════════════╝${C.reset}`)
  print()
  print(`  ${C.bold}Dernière étape :${C.reset} redéployer sur Vercel pour activer les nouvelles`)
  print(`  variables d'environnement.`)
  print()
  print(`  ${C.cyan}→${C.reset} Vercel Dashboard > votre projet > Deployments > ${C.bold}Redeploy${C.reset}`)
  print(`  ${C.dim}  OU poussez un commit vide :${C.reset}`)
  print(`  ${C.dim}  git commit --allow-empty -m "chore: trigger redeploy" && git push origin master:main${C.reset}`)
  print()
  print(`  Votre app sera prête sur : ${C.bold}https://${vercelDomain}${C.reset}`)
  print()

  rl.close()
}

main().catch(e => {
  print()
  fail(`Erreur inattendue : ${e.message}`)
  rl.close()
  process.exit(1)
})
