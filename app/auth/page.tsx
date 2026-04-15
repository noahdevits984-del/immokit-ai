'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Tab = 'login' | 'signup'

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup fields
  const [signupName, setSignupName] = useState('')
  const [signupAgency, setSignupAgency] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

    if (authError) {
      const msg =
        authError.message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : authError.message.includes('Email not confirmed')
          ? 'Veuillez confirmer votre email avant de vous connecter.'
          : authError.message
      setError(msg)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (signupPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: {
          full_name: signupName.trim(),
          agency: signupAgency.trim(),
        },
      },
    })

    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.'
        : authError.message
      setError(msg)
      setLoading(false)
      return
    }

    // Create profile manually in case trigger doesn't fire
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: signupEmail.trim(),
        full_name: signupName.trim(),
        agency: signupAgency.trim(),
        credits: 10,
        plan: 'free',
        kits_generated: 0,
        created_at: new Date().toISOString(),
      })
    }

    setSuccess(
      'Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte. Vous avez reçu 10 crédits offerts ✦'
    )
    setLoading(false)
  }

  const eyeIcon = showPassword ? '🙈' : '👁'

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left brand panel */}
        <div className="auth-brand">
          <div>
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 600, color: 'var(--white)', marginBottom: 8 }}>
                Immo<span style={{ color: 'var(--gold)' }}>Kit</span>{' '}
                <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', verticalAlign: 'super' }}>AI</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Marketing immobilier par l'IA
              </p>
            </div>

            <div style={{ marginBottom: 40 }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--white)', lineHeight: 1.3, marginBottom: 20 }}>
                "Vos contenus marketing,<br />
                <em style={{ color: 'var(--gold)' }}>en quelques secondes.</em>"
              </p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7 }}>
                Générez des posts Instagram, fiches PDF, emails et annonces optimisées pour chaque bien — en quelques secondes.
              </p>
            </div>

            {/* Features list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                '✦ Posts Instagram avec hashtags',
                '✦ Fiches de présentation PDF',
                '✦ Emails professionnels',
                '✦ Annonces SEO portails',
              ].map((f) => (
                <div key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              10 crédits offerts à l'inscription
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          {/* Tabs */}
          <div className="auth-tabs-nav">
            <button
              className={`auth-tab-btn${tab === 'login' ? ' active' : ''}`}
              onClick={() => { setTab('login'); setError(''); setSuccess('') }}
            >
              Connexion
            </button>
            <button
              className={`auth-tab-btn${tab === 'signup' ? ' active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); setSuccess('') }}
            >
              Inscription
            </button>
          </div>

          {/* Error / Success */}
          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>{success}</div>}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ flex: 1 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                  Bon retour,
                </h2>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--gold)' }}>
                  bienvenue.
                </h2>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="votre@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {eyeIcon}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--ink-light)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={async () => {
                    if (!loginEmail) { setError('Saisissez votre email pour réinitialiser votre mot de passe.'); return }
                    const supabase = createClient()
                    await supabase.auth.resetPasswordForEmail(loginEmail)
                    setSuccess('Un email de réinitialisation a été envoyé.')
                    setError('')
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading ? <><span className="spinner" />Connexion…</> : 'Se connecter →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--ink-light)' }}>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                  onClick={() => { setTab('signup'); setError('') }}
                >
                  S'inscrire gratuitement
                </button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} style={{ flex: 1 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                  Créez votre compte
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink-light)' }}>10 crédits offerts à l'inscription</p>
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">Nom complet</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jean Dupont"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Agence</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Agence Excellence"
                    value={signupAgency}
                    onChange={(e) => setSignupAgency(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="votre@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Minimum 6 caractères"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                  >
                    {eyeIcon}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold btn-full btn-lg"
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? <><span className="spinner" />Création…</> : 'Créer mon compte →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--ink-light)', lineHeight: 1.6 }}>
                En créant un compte, vous acceptez nos conditions d'utilisation.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
