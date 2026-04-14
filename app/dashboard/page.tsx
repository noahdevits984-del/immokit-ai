'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, type Profile, type Kit } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type DashboardTab = 'overview' | 'profile' | 'plans' | 'referral'

const PLAN_LIMITS: Record<string, number> = { free: 10, starter: 10, pro: 50, agency: 9999 }
const PLAN_LABELS: Record<string, string> = { free: 'Gratuit', starter: 'Starter', pro: 'Pro', agency: 'Agence' }

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editAgency, setEditAgency] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [referralStats, setReferralStats] = useState({ total: 0, rewarded: 0 })
  const [copiedRef, setCopiedRef] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [paymentMsg, setPaymentMsg] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }

    const [profileRes, kitsRes, referralRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('kits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('referrals').select('status').eq('referrer_id', user.id),
    ])

    if (profileRes.data) {
      const p = profileRes.data as Profile & { referral_code?: string }
      setProfile(p)
      setEditName(p.full_name ?? '')
      setEditAgency(p.agency ?? '')
      const code = p.referral_code ?? user.id.slice(0, 8).toUpperCase()
      setReferralLink(`${window.location.origin}/ref/${code}`)
    }
    if (kitsRes.data) setKits(kitsRes.data as Kit[])
    if (referralRes.data) {
      setReferralStats({
        total: referralRes.data.length,
        rewarded: referralRes.data.filter(r => r.status === 'rewarded').length,
      })
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadData()
    if (searchParams.get('success') === 'true') setPaymentMsg('✦ Abonnement activé avec succès ! Vos crédits ont été mis à jour.')
    if (searchParams.get('cancelled') === 'true') setPaymentMsg('')
  }, [loadData, searchParams])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ full_name: editName.trim(), agency: editAgency.trim() }).eq('id', user.id)
    setSaveMsg(error ? 'Erreur lors de la sauvegarde.' : '✦ Profil mis à jour.')
    if (!error && profile) setProfile({ ...profile, full_name: editName.trim(), agency: editAgency.trim() })
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwMsg('')
    if (newPassword.length < 6) { setPwError('Minimum 6 caractères.'); return }
    if (newPassword !== confirmPassword) { setPwError('Les mots de passe ne correspondent pas.'); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwError(error.message)
    else { setPwMsg('✦ Mot de passe mis à jour.'); setNewPassword(''); setConfirmPassword('') }
    setPwSaving(false)
  }

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setPaymentMsg(data.error ?? 'Erreur lors de la création du paiement.')
    } catch {
      setPaymentMsg('Erreur réseau.')
    }
    setCheckoutLoading(null)
  }

  const handleCopyRef = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const creditsUsed = profile ? Math.max(0, PLAN_LIMITS[profile.plan] - profile.credits) : 0
  const creditTotal = profile ? PLAN_LIMITS[profile.plan] : 10
  const creditProgress = creditTotal === 9999 ? 0 : Math.min((creditsUsed / creditTotal) * 100, 100)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'vous'

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-with-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    )
  }

  const plans = [
    { id: 'starter', name: 'STARTER', price: '29', features: ['10 kits / mois', '8 types de contenus', 'FR + EN', 'Export PDF', 'Support email'], popular: false },
    { id: 'pro', name: 'PRO', price: '49', features: ['50 kits / mois', '8 types de contenus', 'FR + EN + ES', 'Analyse photos IA', 'Export PDF', 'Email automatique', 'Support prioritaire'], popular: true },
    { id: 'agency', name: 'AGENCE', price: '99', features: ['Kits illimités', 'Marque blanche', '5 utilisateurs', 'Accès API', 'Parrainage 10%', 'Manager dédié'], popular: false },
  ]

  return (
    <div className="page page-with-nav">
      <Navbar />
      <div className="container section">

        {paymentMsg && <div className="alert alert-success" style={{ marginBottom: 20 }}>{paymentMsg}</div>}

        {/* Header */}
        <div className="dashboard-header">
          <p className="section-label">TABLEAU DE BORD</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: '3rem', marginBottom: 4 }}>
                BONJOUR &nbsp;<em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Bienvenue, {firstName} 👋</em>
              </h1>
              <p style={{ color: 'var(--ink-light)', fontSize: 14 }}>{profile?.agency ? `${profile.agency} · ` : ''}{profile?.email}</p>
            </div>
            <a href="/generator" className="btn btn-gold btn-lg">✦ Nouveau kit →</a>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-nav">
          {([['overview', 'Tableau de bord'], ['profile', 'Mon profil'], ['plans', 'Plans'], ['referral', '🤝 Parrainage']] as const).map(([id, label]) => (
            <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ====== OVERVIEW ====== */}
        {tab === 'overview' && (
          <div>
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-value">{profile?.kits_generated ?? 0}</div><div className="stat-label">Kits générés</div></div>
              <div className="stat-card"><div className="stat-icon">✦</div><div className="stat-value" style={{ color: 'var(--gold)' }}>{profile?.credits ?? 0}</div><div className="stat-label">Crédits restants</div></div>
              <div className="stat-card"><div className="stat-icon">⏱️</div><div className="stat-value">{((profile?.kits_generated ?? 0) * 0.5).toFixed(1)}h</div><div className="stat-label">Temps économisé</div></div>
              <div className="stat-card"><div className="stat-icon">🤝</div><div className="stat-value">{referralStats.rewarded}</div><div className="stat-label">Parrainages actifs</div></div>
            </div>

            <div className="card card-body" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 2 }}>Crédits ce mois</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-mid)' }}>{creditsUsed} sur {creditTotal === 9999 ? '∞' : creditTotal} ({PLAN_LABELS[profile?.plan ?? 'free']})</p>
                </div>
                <span className={`plan-badge plan-badge-${profile?.plan ?? 'free'}`}>{PLAN_LABELS[profile?.plan ?? 'free']}</span>
              </div>
              {creditTotal !== 9999 && <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: `${creditProgress}%` }} /></div>}
              {(profile?.credits ?? 0) === 0 && (
                <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>
                  Crédits épuisés — <button style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setTab('plans')}>Mettre à niveau →</button>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>Derniers kits générés</h3>
                {kits.length > 0 && <a href="/generator" className="btn btn-outline btn-sm">+ Nouveau kit</a>}
              </div>
              {kits.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏠</div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 6 }}>Aucun kit généré</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>Créez votre premier kit en quelques secondes.</p>
                  <a href="/generator" className="btn btn-gold">✦ Créer mon premier kit →</a>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="kits-table">
                    <thead><tr><th>Type</th><th>Ville</th><th>Ton</th><th>Photos</th><th>Date</th><th>Contenus</th></tr></thead>
                    <tbody>
                      {kits.map(kit => (
                        <tr key={kit.id}>
                          <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{kit.property_type}</td>
                          <td>{kit.city || '—'}</td>
                          <td><span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 2 }}>{kit.tone}</span></td>
                          <td>{(kit as Kit & { has_photos?: boolean }).has_photos ? '📸' : '—'}</td>
                          <td style={{ fontSize: 13, color: 'var(--ink-light)' }}>{formatDate(kit.created_at)}</td>
                          <td style={{ fontSize: 12, color: 'var(--ink-light)' }}>{kit.contents ? Object.keys(kit.contents).length : 0} contenu(s)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== PROFILE ====== */}
        {tab === 'profile' && (
          <div style={{ maxWidth: 600 }}>
            <div className="card card-body" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: 20 }}>Informations personnelles</h3>
              <form onSubmit={handleSaveProfile}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Nom complet</label><input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Agence</label><input type="text" className="form-input" value={editAgency} onChange={e => setEditAgency(e.target.value)} /></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={profile?.email ?? ''} disabled style={{ background: 'var(--cream)', color: 'var(--ink-light)', cursor: 'not-allowed' }} />
                </div>
                {saveMsg && <div className={`alert ${saveMsg.includes('Erreur') ? 'alert-error' : 'alert-success'}`}>{saveMsg}</div>}
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner" />Sauvegarde…</> : 'SAUVEGARDER'}</button>
              </form>
            </div>
            <div className="card card-body">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: 20 }}>Sécurité</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group"><label className="form-label">Nouveau mot de passe</label><input type="password" className="form-input" placeholder="Minimum 6 caractères" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Confirmer</label><input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
                {pwError && <div className="alert alert-error">{pwError}</div>}
                {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
                <button type="submit" className="btn btn-outline" disabled={pwSaving}>{pwSaving ? <><span className="spinner" />Mise à jour…</> : 'METTRE À JOUR'}</button>
              </form>
            </div>
          </div>
        )}

        {/* ====== PLANS ====== */}
        {tab === 'plans' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', marginBottom: 8 }}>Choisissez votre plan</h2>
              <p style={{ color: 'var(--ink-light)', fontSize: 15 }}>Générez plus de kits et accédez à plus de fonctionnalités.</p>
            </div>
            <div className="grid-3">
              {plans.map(plan => (
                <div key={plan.id} className={`plan-card${plan.popular ? ' plan-card-popular' : ''}`} style={plan.id === 'agency' ? { background: 'var(--ink)' } : {}}>
                  {plan.popular && <div className="popular-badge">POPULAIRE</div>}
                  <p className="section-label" style={{ marginBottom: 6, color: plan.id === 'agency' || plan.popular ? 'var(--gold)' : 'var(--ink-light)' }}>{plan.name}</p>
                  <div style={{ marginBottom: 16 }}>
                    <span className="plan-price" style={plan.id === 'agency' ? { color: 'var(--white)' } : {}}>{plan.price}€</span>
                    <span className="plan-price-period" style={plan.id === 'agency' ? { color: 'rgba(255,255,255,0.5)' } : {}}>/mois</span>
                  </div>
                  <ul className="plan-features" style={plan.id === 'agency' ? { color: 'rgba(255,255,255,0.75)' } : {}}>
                    {plan.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                  {profile?.plan === plan.id ? (
                    <div style={{ textAlign: 'center', padding: '11px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--gold)', textTransform: 'uppercase' }}>✦ Plan actuel</div>
                  ) : (
                    <button
                      className={`btn btn-full${plan.popular ? ' btn-gold' : ''}`}
                      style={plan.id === 'agency' ? { background: 'var(--gold)', color: 'var(--ink)', border: '1px solid var(--gold)' } : !plan.popular ? { background: 'transparent', border: '1px solid var(--border-dark)', color: 'var(--ink)' } : {}}
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkoutLoading === plan.id}
                    >
                      {checkoutLoading === plan.id ? <><span className="spinner" />Redirection…</> : `CHOISIR ${plan.name}`}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {paymentMsg && <div className="alert alert-error" style={{ marginTop: 20 }}>{paymentMsg}</div>}
          </div>
        )}

        {/* ====== REFERRAL ====== */}
        {tab === 'referral' && (
          <div style={{ maxWidth: 680 }}>
            <div className="card card-body" style={{ marginBottom: 20, background: 'var(--ink)', border: 'none' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--white)', marginBottom: 10 }}>
                Programme de parrainage
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                Recommandez ImmoKit AI à d'autres agences. Si elles souscrivent à un abonnement payant, vous recevez <strong style={{ color: 'var(--gold)' }}>10% de réduction</strong> sur votre prochain renouvellement.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 13, color: 'var(--gold)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{referralLink}</code>
                <button
                  className="btn btn-gold btn-sm"
                  onClick={handleCopyRef}
                  style={{ flexShrink: 0 }}
                >
                  {copiedRef ? '✓ Copié !' : '📋 Copier le lien'}
                </button>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-icon">📤</div>
                <div className="stat-value">{referralStats.total}</div>
                <div className="stat-label">Agences parrainées</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎁</div>
                <div className="stat-value" style={{ color: 'var(--gold)' }}>{referralStats.rewarded}</div>
                <div className="stat-label">Réductions obtenues</div>
              </div>
            </div>

            <div className="card card-body">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 16 }}>Comment ça marche</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['1', '📤 Partagez votre lien', 'Envoyez votre lien de parrainage à d\'autres agents ou agences immobilières.'],
                  ['2', '✅ Ils s\'inscrivent', 'L\'agence crée un compte ImmoKit AI via votre lien.'],
                  ['3', '💳 Ils souscrivent', 'Dès qu\'ils activent un abonnement Starter, Pro ou Agence, vous êtes récompensé.'],
                  ['4', '🎁 Vous économisez', 'Vous recevez automatiquement 10% de réduction sur votre prochain renouvellement.'],
                ].map(([num, title, desc]) => (
                  <div key={num} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, color: 'var(--ink)' }}>{num}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{title}</p>
                      <p style={{ fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner spinner-lg" /></div>}><DashboardContent /></Suspense>
}
