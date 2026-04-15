'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  const stats = [
    { value: '30s', label: 'Temps moyen de génération' },
    { value: '8', label: 'Types de contenus par kit' },
    { value: '8', label: 'Formats de contenu disponibles' },
    { value: '100%', label: 'Propulsé par l\'IA' },
  ]

  const features = [
    { icon: '📸', title: 'Post Instagram', desc: 'Accroches percutantes, emojis, hashtags et CTA optimisés pour maximiser l\'engagement.' },
    { icon: '📄', title: 'Fiche PDF', desc: 'Description complète, points forts, quartier et infos techniques structurées professionnellement.' },
    { icon: '✉️', title: 'Email client', desc: 'Email de présentation avec objet accrocheur, corps professionnel et invitation à visiter.' },
    { icon: '🏷️', title: 'Annonce portail', desc: 'Titre et description optimisés SEO pour SeLoger, LeBonCoin, PAP et tous les portails.' },
    { icon: '📱', title: 'Story Instagram', desc: '3 slides visuels courts et percutants pour les stories verticales Instagram et Facebook.' },
    { icon: '🎬', title: 'Script vidéo', desc: 'Narration complète pour vos visites vidéo ou reels avec plan et timing inclus.' },
    { icon: '💬', title: 'Message WhatsApp', desc: 'Message court et efficace pour votre base de contacts et fichier acheteurs.' },
    { icon: '💼', title: 'Post LinkedIn', desc: 'Contenu B2B adapté pour les investisseurs et les professionnels de l\'immobilier.' },
  ]

  const steps = [
    { num: '01', title: 'Décrivez votre bien', desc: 'Type, surface, prix, localisation et points forts. Importez jusqu\'à 5 photos pour une analyse visuelle par l\'IA.' },
    { num: '02', title: 'Personnalisez le style', desc: 'Choisissez le ton (Élégant, Dynamique, Chaleureux, Luxe), la langue et les contenus à générer.' },
    { num: '03', title: 'Copiez et publiez', desc: 'Vos contenus sont prêts en 30 secondes. Copiez, téléchargez en PDF ou envoyez par email en un clic.' },
  ]

  const plans = [
    {
      name: 'STARTER',
      price: '29',
      features: ['10 kits / mois', '8 types de contenus', 'Français + Anglais', 'Export PDF', 'Support email'],
      cta: 'Commencer',
      popular: false,
      priceId: 'starter',
    },
    {
      name: 'PRO',
      price: '49',
      features: ['50 kits / mois', '8 types de contenus', 'FR + EN + ES', 'Analyse photos IA', 'Export PDF', 'Email automatique', 'Support prioritaire'],
      cta: 'Choisir Pro',
      popular: true,
      priceId: 'pro',
    },
    {
      name: 'AGENCE',
      price: '99',
      features: ['Kits illimités', 'Marque blanche', '5 utilisateurs', 'Accès API', 'Parrainage 10%', 'Manager dédié'],
      cta: 'Nous contacter',
      popular: false,
      priceId: 'agency',
    },
  ]

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        background: 'rgba(250,248,244,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 600, textDecoration: 'none', color: 'var(--ink)' }}>
            Immo<span style={{ color: 'var(--gold)' }}>Kit</span>{' '}
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)', fontWeight: 600, verticalAlign: 'super' }}>AI</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLoggedIn ? (
              <a href="/dashboard" className="btn btn-gold btn-sm">Tableau de bord →</a>
            ) : (
              <>
                <a href="/auth" className="btn btn-ghost btn-sm" style={{ fontSize: 13 }}>Se connecter</a>
                <a href="/auth" className="btn btn-primary btn-sm">Commencer gratuitement</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{
        background: 'var(--ink)', paddingTop: 120, paddingBottom: 100,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(201,169,110,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 28px', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 99, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Propulsé par l'Intelligence Artificielle</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', fontWeight: 500, color: 'var(--white)', lineHeight: 1.1, marginBottom: 20 }}>
            Vos contenus immobiliers,<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>générés en 30 secondes.</em>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Posts Instagram, fiches PDF, emails et annonces portails — rédigés par l'IA pour chaque bien, dans votre ton, en français et en anglais.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href="/auth" className="btn btn-gold btn-lg">
              ✦ Commencer gratuitement →
            </a>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>3 kits offerts · Sans carte bancaire</span>
          </div>
        </div>

        {/* Mock UI preview */}
        <div style={{ maxWidth: 900, margin: '64px auto 0', padding: '0 28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {['📸 Post Instagram', '📄 Fiche PDF', '✉️ Email client', '🏷️ Annonce SEO', '📱 Story', '🎬 Script vidéo', '💬 WhatsApp', '💼 LinkedIn'].map(f => (
              <span key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '5px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 28px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 6, letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PHOTO AI ===== */}
      <section style={{ padding: '80px 28px', background: 'var(--cream)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>NOUVEAUTÉ — ANALYSE VISUELLE</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.6rem', fontWeight: 500, marginBottom: 20, lineHeight: 1.2 }}>
              L'IA analyse vos photos<br />
              <em style={{ color: 'var(--gold)' }}>et enrichit vos contenus</em>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-light)', lineHeight: 1.8, marginBottom: 24 }}>
              Importez jusqu'à 5 photos du bien. Notre IA identifie automatiquement les éléments visuels — parquet ancien, luminosité, volumes, finitions — et les intègre dans vos contenus avec une précision inégalée.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Détection automatique des matériaux et finitions', 'Analyse de la luminosité et des volumes', 'Identification des atouts visuels cachés', 'Contenus enrichis sans effort supplémentaire'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--ink-mid)' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>✦</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: 'var(--ink)', borderRadius: 4, padding: 32, border: '1px solid rgba(201,169,110,0.2)' }}>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Photos importées</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {['🛋️ Salon', '🍳 Cuisine', '🛏️ Chambre', '🛁 SDB', '🌿 Terrasse'].map(room => (
                  <div key={room} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, padding: '10px 8px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{room}</div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Analyse IA</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "Le salon baigne dans une lumière naturelle exceptionnelle grâce à ses baies vitrées double exposition. Le parquet chevrons point de Hongrie et les moulures d'époque témoignent d'un soin particulier apporté aux finitions…"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section style={{ padding: '80px 28px', background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>8 FORMATS DE CONTENU</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.6rem', fontWeight: 500 }}>
              Tout ce dont vous avez besoin,<br />
              <em style={{ color: 'var(--gold)' }}>en un seul kit.</em>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {features.map(f => (
              <div key={f.title} style={{ padding: '22px 20px', border: '1px solid var(--border)', borderRadius: 2, background: 'var(--cream)', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 8, color: 'var(--ink)' }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '80px 28px', background: 'var(--cream)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>COMMENT ÇA MARCHE</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.6rem', fontWeight: 500 }}>Simple. Rapide. Efficace.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ position: 'relative' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 22, left: '60%', right: -20, height: 1, background: 'var(--border)', zIndex: 0 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>
                    {step.num}
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 10 }}>{step.title}</h4>
                  <p style={{ fontSize: 14, color: 'var(--ink-light)', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REFERRAL BANNER ===== */}
      <section style={{ padding: '48px 28px', background: 'var(--gold-bg)', borderTop: '1px solid var(--gold-light)', borderBottom: '1px solid var(--gold-light)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🤝</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: 12 }}>
            Programme de parrainage — <em style={{ color: 'var(--gold-dark)' }}>10% de réduction</em>
          </h3>
          <p style={{ fontSize: 15, color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto' }}>
            Partagez ImmoKit AI avec d'autres agences. Si elles souscrivent à un abonnement, vous bénéficiez de <strong>10% de réduction</strong> sur votre prochain renouvellement — sans limite de parrainages.
          </p>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section style={{ padding: '80px 28px', background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>TARIFS</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.6rem', fontWeight: 500, marginBottom: 10 }}>
              Transparent et sans surprise.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-light)' }}>Commencez gratuitement avec 3 kits offerts. Passez à un plan payant quand vous êtes prêt.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                padding: '28px 24px',
                border: plan.popular ? '2px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 2,
                background: plan.popular ? 'var(--ink)' : 'var(--white)',
                position: 'relative',
                boxShadow: plan.popular ? 'var(--shadow-lg)' : 'none',
              }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--ink)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                    POPULAIRE
                  </div>
                )}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: plan.popular ? 'var(--gold)' : 'var(--ink-light)', marginBottom: 8 }}>{plan.name}</p>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 600, color: plan.popular ? 'var(--white)' : 'var(--ink)', lineHeight: 1 }}>{plan.price}€</span>
                  <span style={{ fontSize: 14, color: plan.popular ? 'rgba(255,255,255,0.5)' : 'var(--ink-light)' }}>/mois</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,0.75)' : 'var(--ink-mid)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="/auth" style={{
                  display: 'block', textAlign: 'center', padding: '11px 24px',
                  background: plan.popular ? 'var(--gold)' : 'transparent',
                  color: plan.popular ? 'var(--ink)' : 'var(--ink)',
                  border: plan.popular ? '1px solid var(--gold)' : '1px solid var(--border-dark)',
                  borderRadius: 2, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{ padding: '90px 28px', background: 'var(--ink)', textAlign: 'center' }}>
        <p className="section-label" style={{ color: 'var(--gold)', marginBottom: 16 }}>COMMENCEZ MAINTENANT</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', color: 'var(--white)', marginBottom: 16, fontWeight: 500 }}>
          Rejoignez les agents qui font<br />
          <em style={{ color: 'var(--gold)' }}>la différence avec l'IA.</em>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 36 }}>
          3 kits offerts. Sans carte bancaire. Prêt en 2 minutes.
        </p>
        <a href="/auth" className="btn btn-gold btn-lg">
          ✦ Créer mon compte gratuitement →
        </a>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#111009', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)' }}>
            Immo<span style={{ color: 'var(--gold)' }}>Kit</span> AI
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Se connecter', '/auth'], ['Créer un compte', '/auth'], ['Contact', 'mailto:hello@immokit.ai']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 ImmoKit AI · Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}
