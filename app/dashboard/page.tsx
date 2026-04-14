'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type Profile, type Kit } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type DashboardTab = 'overview' | 'profile' | 'plans'

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  starter: 10,
  pro: 50,
  agency: 999,
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agence',
}

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)

  // Profile edit
  const [editName, setEditName] = useState('')
  const [editAgency, setEditAgency] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/auth')
      return
    }

    const [profileRes, kitsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('kits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])

    if (profileRes.data) {
      setProfile(profileRes.data as Profile)
      setEditName(profileRes.data.full_name ?? '')
      setEditAgency(profileRes.data.agency ?? '')
    }
    if (kitsRes.data) setKits(kitsRes.data as Kit[])
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName.trim(), agency: editAgency.trim() })
      .eq('id', user.id)

    setSaveMsg(error ? 'Erreur lors de la sauvegarde.' : '✦ Profil mis à jour avec succès.')
    if (!error && profile) setProfile({ ...profile, full_name: editName.trim(), agency: editAgency.trim() })
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwMsg('')
    if (newPassword.length < 6) { setPwError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (newPassword !== confirmPassword) { setPwError('Les mots de passe ne correspondent pas.'); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwError(error.message)
    else { setPwMsg('✦ Mot de passe mis à jour.'); setNewPassword(''); setConfirmPassword('') }
    setPwSaving(false)
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const creditsUsed = profile ? (PLAN_LIMITS[profile.plan] - profile.credits) : 0
  const creditTotal = profile ? PLAN_LIMITS[profile.plan] : 10
  const creditProgress = Math.min((creditsUsed / creditTotal) * 100, 100)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'vous'

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-with-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="spinner spinner-lg" />
            <p style={{ fontSize: 13, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chargement…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-with-nav">
      <Navbar />
      <div className="container section">

        {/* Header */}
        <div className="dashboard-header">
          <p className="section-label">TABLEAU DE BORD</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: '3rem', marginBottom: 4 }}>
                BONJOUR &nbsp;
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Bienvenue, {firstName} 👋</em>
              </h1>
              <p style={{ color: 'var(--ink-light)', fontSize: 14 }}>
                {profile?.agency ? `${profile.agency} · ` : ''}{profile?.email}
              </p>
            </div>
            <a href="/generator" className="btn btn-gold btn-lg">
              ✦ Nouveau kit →
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-nav">
          <button className={`tab-btn${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
            Tableau de bord
          </button>
          <button className={`tab-btn${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>
            Mon profil
          </button>
          <button className={`tab-btn${tab === 'plans' ? ' active' : ''}`} onClick={() => setTab('plans')}>
            Plans
          </button>
        </div>

        {/* ====== Overview Tab ====== */}
        {tab === 'overview' && (
          <div>
            {/* Stats grid */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-value">{profile?.kits_generated ?? 0}</div>
                <div className="stat-label">Kits générés</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✦</div>
                <div className="stat-value" style={{ color: 'var(--gold)' }}>{profile?.credits ?? 0}</div>
                <div className="stat-label">Crédits restants</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{((profile?.kits_generated ?? 0) * 0.5).toFixed(1)}h</div>
                <div className="stat-label">Temps économisé</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>
                  {profile?.created_at ? formatDate(profile.created_at).split(' ')[2] : '—'}
                </div>
                <div className="stat-label">
                  Membre depuis {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>

            {/* Credits progress */}
            <div className="card card-body" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 2 }}>
                    Crédits utilisés ce mois
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ink-mid)' }}>
                    {creditsUsed} sur {creditTotal === 999 ? '∞' : creditTotal} crédits ({PLAN_LABELS[profile?.plan ?? 'free']})
                  </p>
                </div>
                <span className={`plan-badge plan-badge-${profile?.plan ?? 'free'}`}>
                  {PLAN_LABELS[profile?.plan ?? 'free']}
                </span>
              </div>
              {creditTotal !== 999 && (
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${creditProgress}%` }} />
                </div>
              )}
              {(profile?.credits ?? 0) === 0 && (
                <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>
                  Vos crédits sont épuisés.{' '}
                  <button className="btn-ghost" style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 14 }} onClick={() => setTab('plans')}>
                    Mettre à niveau →
                  </button>
                </div>
              )}
            </div>

            {/* Recent kits table */}
            <div className="card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>Derniers kits générés</h3>
                {kits.length > 0 && (
                  <a href="/generator" className="btn btn-outline btn-sm">+ Nouveau kit</a>
                )}
              </div>
              {kits.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏠</div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: 6 }}>Aucun kit généré</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: 20 }}>Créez votre premier kit marketing immobilier en quelques secondes.</p>
                  <a href="/generator" className="btn btn-gold">✦ Créer mon premier kit →</a>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="kits-table">
                    <thead>
                      <tr>
                        <th>Type de bien</th>
                        <th>Ville</th>
                        <th>Ton</th>
                        <th>Date</th>
                        <th>Contenus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kits.map((kit) => (
                        <tr key={kit.id}>
                          <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{kit.property_type}</td>
                          <td>{kit.city || '—'}</td>
                          <td>
                            <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 2 }}>
                              {kit.tone}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--ink-light)' }}>{formatDate(kit.created_at)}</td>
                          <td style={{ fontSize: 12, color: 'var(--ink-light)' }}>
                            {kit.contents ? Object.keys(kit.contents).length : 0} contenu(s)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== Profile Tab ====== */}
        {tab === 'profile' && (
          <div style={{ maxWidth: 600 }}>
            {/* Personal info */}
            <div className="card card-body" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: 20 }}>
                Informations personnelles
              </h3>
              <form onSubmit={handleSaveProfile}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nom complet</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Agence</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editAgency}
                      onChange={(e) => setEditAgency(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profile?.email ?? ''}
                    disabled
                    style={{ background: 'var(--cream)', color: 'var(--ink-light)', cursor: 'not-allowed' }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 4 }}>L'email ne peut pas être modifié.</p>
                </div>
                {saveMsg && (
                  <div className={`alert ${saveMsg.includes('Erreur') ? 'alert-error' : 'alert-success'}`}>
                    {saveMsg}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" />Sauvegarde…</> : 'SAUVEGARDER'}
                </button>
              </form>
            </div>

            {/* Security */}
            <div className="card card-body">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: 20 }}>
                Sécurité
              </h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimum 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {pwError && <div className="alert alert-error">{pwError}</div>}
                {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
                <button type="submit" className="btn btn-outline" disabled={pwSaving}>
                  {pwSaving ? <><span className="spinner" />Mise à jour…</> : 'METTRE À JOUR'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ====== Plans Tab ====== */}
        {tab === 'plans' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', marginBottom: 8 }}>
                Choisissez votre plan
              </h2>
              <p style={{ color: 'var(--ink-light)', fontSize: 15 }}>
                Générez plus de kits, accédez à plus de langues et de fonctionnalités.
              </p>
            </div>

            <div className="grid-3">
              {/* Starter */}
              <div className="plan-card">
                <p className="section-label" style={{ marginBottom: 6 }}>STARTER</p>
                <div style={{ marginBottom: 16 }}>
                  <span className="plan-price">29€</span>
                  <span className="plan-price-period">/mois</span>
                </div>
                <ul className="plan-features">
                  <li>10 kits / mois</li>
                  <li>4 contenus par kit</li>
                  <li>Français + Anglais</li>
                  <li>Support email</li>
                </ul>
                <button className="btn btn-outline btn-full" disabled style={{ opacity: 0.6 }}>
                  CHOISIR STARTER
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-light)', marginTop: 8 }}>Bientôt disponible</p>
              </div>

              {/* Pro */}
              <div className="plan-card plan-card-popular">
                <div className="popular-badge">POPULAIRE</div>
                <p className="section-label" style={{ marginBottom: 6, color: 'var(--gold)' }}>PRO</p>
                <div style={{ marginBottom: 16 }}>
                  <span className="plan-price">49€</span>
                  <span className="plan-price-period">/mois</span>
                </div>
                <ul className="plan-features">
                  <li>50 kits / mois</li>
                  <li>FR + EN + ES</li>
                  <li>PDF personnalisé</li>
                  <li>Support prioritaire</li>
                  <li>Statistiques avancées</li>
                </ul>
                <button className="btn btn-gold btn-full" disabled style={{ opacity: 0.6 }}>
                  CHOISIR PRO
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-light)', marginTop: 8 }}>Bientôt disponible</p>
              </div>

              {/* Agency */}
              <div className="plan-card" style={{ background: 'var(--ink)' }}>
                <p className="section-label" style={{ marginBottom: 6, color: 'var(--gold)' }}>AGENCE</p>
                <div style={{ marginBottom: 16 }}>
                  <span className="plan-price" style={{ color: 'var(--white)' }}>99€</span>
                  <span className="plan-price-period" style={{ color: 'rgba(255,255,255,0.5)' }}>/mois</span>
                </div>
                <ul className="plan-features" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <li>Kits illimités</li>
                  <li>Marque blanche</li>
                  <li>5 utilisateurs</li>
                  <li>Accès API</li>
                  <li>Manager dédié</li>
                </ul>
                <button
                  className="btn btn-full"
                  disabled
                  style={{ background: 'var(--gold)', color: 'var(--ink)', border: '1px solid var(--gold)', opacity: 0.7, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '11px 24px', borderRadius: 2, cursor: 'not-allowed' }}
                >
                  CHOISIR AGENCE
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Bientôt disponible</p>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--ink-light)' }}>
              Vous avez des questions ? Contactez-nous à{' '}
              <a href="mailto:hello@immokit.ai" style={{ color: 'var(--gold)' }}>hello@immokit.ai</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
