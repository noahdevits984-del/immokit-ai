'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type Profile } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Tone = 'elegant' | 'dynamic' | 'warm' | 'luxury'
type Language = 'fr' | 'en' | 'both'
type ContentType = 'instagram' | 'pdf' | 'email' | 'listing'

interface FormData {
  propertyType: string
  price: string
  surface: string
  rooms: string
  bedrooms: string
  city: string
  dpe: string
  mainFeatures: string
  neighborhood: string
  additionalInfo: string
  tone: Tone
  language: Language
  contents: Record<ContentType, boolean>
}

const CONTENT_LABELS: Record<ContentType, string> = {
  instagram: '📸 Post Instagram & Réseaux',
  pdf: '📄 Fiche de présentation PDF',
  email: '✉️ Email de présentation',
  listing: '🏷️ Description d\'annonce',
}

const CONTENT_KEYS: ContentType[] = ['instagram', 'pdf', 'email', 'listing']

const TONE_OPTIONS: { value: Tone; label: string; icon: string }[] = [
  { value: 'elegant', label: 'Élégant', icon: '🎩' },
  { value: 'dynamic', label: 'Dynamique', icon: '⚡' },
  { value: 'warm', label: 'Chaleureux', icon: '❤️' },
  { value: 'luxury', label: 'Luxe', icon: '💎' },
]

const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'en', label: 'Anglais', flag: '🇬🇧' },
  { value: 'both', label: 'Les deux', flag: '🌍' },
]

const DEFAULT_FORM: FormData = {
  propertyType: 'Appartement',
  price: '',
  surface: '',
  rooms: '',
  bedrooms: '',
  city: '',
  dpe: 'Non spécifié',
  mainFeatures: '',
  neighborhood: '',
  additionalInfo: '',
  tone: 'elegant',
  language: 'fr',
  contents: { instagram: true, pdf: true, email: true, listing: true },
}

export default function GeneratorPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [generatedContents, setGeneratedContents] = useState<Record<string, string> | null>(null)
  const [activeResultTab, setActiveResultTab] = useState<ContentType>('instagram')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data as Profile)
    setAuthLoading(false)
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  const setField = (field: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleContent = (key: ContentType) => {
    setForm((prev) => ({
      ...prev,
      contents: { ...prev.contents, [key]: !prev.contents[key] },
    }))
  }

  const selectedContents = CONTENT_KEYS.filter((k) => form.contents[k])
  const canGenerate = form.mainFeatures.trim().length > 0 && selectedContents.length > 0 && (profile?.credits ?? 0) > 0

  const handleGenerate = async () => {
    if (!canGenerate) return
    setLoading(true)
    setError('')
    setSuccessMsg('')
    setGeneratedContents(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: form, selectedContents }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setError('Vos crédits sont épuisés. Mettez à niveau votre plan pour continuer.')
        } else {
          setError(data.error ?? 'Une erreur est survenue lors de la génération.')
        }
        setLoading(false)
        return
      }

      setGeneratedContents(data.contents)
      // Set first available tab
      const firstKey = selectedContents[0]
      if (firstKey) setActiveResultTab(firstKey)
      setSuccessMsg('✦ Kit généré avec succès !')
      // Refresh credits
      await loadProfile()
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    }

    setLoading(false)
  }

  const handleCopy = async (key: string) => {
    if (!generatedContents?.[key]) return
    await navigator.clipboard.writeText(generatedContents[key])
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (authLoading) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-with-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="page page-with-nav">
      <Navbar />
      <div className="container">
        {/* Page header */}
        <div style={{ padding: '28px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          <p className="section-label">GÉNÉRATEUR DE KIT</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: '2.4rem' }}>Nouveau kit marketing</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>
                ✦ <strong style={{ color: (profile?.credits ?? 0) > 0 ? 'var(--gold)' : 'var(--error)' }}>{profile?.credits ?? 0}</strong> crédit{(profile?.credits ?? 0) !== 1 ? 's' : ''} restant{(profile?.credits ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="alert alert-success" style={{ marginTop: 16, marginBottom: 0 }}>
            {successMsg}
          </div>
        )}

        <div className="generator-layout">
          {/* ===== LEFT: FORM ===== */}
          <div className="generator-form-panel">

            {/* Section 1: Le bien */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>🏠</span>
                <span className="generator-section-title">Le bien</span>
              </div>
              <div className="generator-section-body">
                <div className="form-group">
                  <label className="form-label">Type de bien</label>
                  <select className="form-select" value={form.propertyType} onChange={(e) => setField('propertyType', e.target.value)}>
                    {['Appartement', 'Maison', 'Villa', 'Loft', 'Studio', 'Duplex', 'Penthouse', 'Terrain', 'Local commercial'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prix</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ex: 350 000"
                        value={form.price}
                        onChange={(e) => setField('price', e.target.value)}
                        style={{ paddingRight: 32 }}
                      />
                      <span className="input-suffix">€</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Surface</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ex: 85"
                        value={form.surface}
                        onChange={(e) => setField('surface', e.target.value)}
                        style={{ paddingRight: 36 }}
                      />
                      <span className="input-suffix">m²</span>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pièces</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ex: 4"
                      value={form.rooms}
                      onChange={(e) => setField('rooms', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chambres</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ex: 2"
                      value={form.bedrooms}
                      onChange={(e) => setField('bedrooms', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ville / Quartier</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ex: Paris 16e, Neuilly-sur-Seine, Lyon Part-Dieu…"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Diagnostic DPE</label>
                  <select className="form-select" value={form.dpe} onChange={(e) => setField('dpe', e.target.value)}>
                    {['Non spécifié', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Points forts */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>⭐</span>
                <span className="generator-section-title">Points forts</span>
              </div>
              <div className="generator-section-body">
                <div className="form-group">
                  <label className="form-label">
                    Atouts principaux <span style={{ color: 'var(--gold)' }}>*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 110 }}
                    placeholder="ex: Vue panoramique, luminosité exceptionnelle, terrasse 20m², cave, parking double, parquet ancien, hauteur sous plafond 3m20, cuisine équipée Bulthaup…"
                    value={form.mainFeatures}
                    onChange={(e) => setField('mainFeatures', e.target.value)}
                    required
                  />
                  {form.mainFeatures.trim().length === 0 && (
                    <p style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 4 }}>
                      Ce champ est obligatoire pour la génération.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Environnement / Quartier</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 80 }}
                    placeholder="ex: À 2 min du métro Trocadéro, commerces de proximité, écoles réputées, vue sur la Tour Eiffel, quartier calme et résidentiel…"
                    value={form.neighborhood}
                    onChange={(e) => setField('neighborhood', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Informations supplémentaires</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 70 }}
                    placeholder="ex: Copropriété bien entretenue, charges 180€/mois, disponible immédiatement, sans vis-à-vis…"
                    value={form.additionalInfo}
                    onChange={(e) => setField('additionalInfo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Paramètres */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>⚙️</span>
                <span className="generator-section-title">Paramètres de génération</span>
              </div>
              <div className="generator-section-body">
                {/* Tone */}
                <div className="form-group">
                  <label className="form-label">Ton de communication</label>
                  <div className="toggle-group">
                    {TONE_OPTIONS.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        className={`toggle-btn${form.tone === value ? ' active' : ''}`}
                        onClick={() => setField('tone', value)}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="form-group">
                  <label className="form-label">Langue(s)</label>
                  <div className="toggle-group">
                    {LANGUAGE_OPTIONS.map(({ value, label, flag }) => (
                      <button
                        key={value}
                        type="button"
                        className={`toggle-btn${form.language === value ? ' active' : ''}`}
                        onClick={() => setField('language', value)}
                      >
                        <span>{flag}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contents */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contenus à générer</label>
                  <div className="checkbox-group">
                    {CONTENT_KEYS.map((key) => (
                      <label
                        key={key}
                        className={`checkbox-item${form.contents[key] ? ' checked' : ''}`}
                        onClick={() => toggleContent(key)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <input
                          type="checkbox"
                          checked={form.contents[key]}
                          onChange={() => toggleContent(key)}
                          style={{ pointerEvents: 'none' }}
                        />
                        <span>{CONTENT_LABELS[key]}</span>
                      </label>
                    ))}
                  </div>
                  {selectedContents.length === 0 && (
                    <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 6 }}>
                      Sélectionnez au moins un type de contenu.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16, textAlign: 'left' }}>
                  {error}
                  {error.includes('crédits') && (
                    <> <a href="/dashboard" style={{ color: 'var(--error)', fontWeight: 600 }}>Voir les plans →</a></>
                  )}
                </div>
              )}
              <button
                type="button"
                className="btn btn-gold btn-lg"
                style={{ minWidth: 240 }}
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
              >
                {loading ? (
                  <><span className="spinner" />Génération en cours…</>
                ) : (
                  '✦ Générer le Kit'
                )}
              </button>
              <p style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 8 }}>
                Environ 15–30 secondes · 1 crédit utilisé
              </p>
              {(profile?.credits ?? 0) === 0 && (
                <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>
                  Crédits épuisés —{' '}
                  <a href="/dashboard" style={{ color: 'var(--error)', textDecoration: 'underline' }}>
                    Mettre à niveau →
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* ===== RIGHT: RESULT PANEL ===== */}
          <div className="generator-result-panel">
            <div className="result-card">
              <div className="result-header">
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>
                  Résultat
                </p>
                {generatedContents && (
                  <button
                    className={`copy-btn${copiedKey === activeResultTab ? ' copied' : ''}`}
                    onClick={() => handleCopy(activeResultTab)}
                  >
                    {copiedKey === activeResultTab ? '✓ Copié !' : '📋 Copier'}
                  </button>
                )}
              </div>

              {/* Empty state */}
              {!loading && !generatedContents && (
                <div className="result-empty">
                  <div className="result-empty-icon">🏡</div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--ink-light)' }}>
                    Votre kit apparaîtra ici
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ink-light)', maxWidth: 260, lineHeight: 1.6 }}>
                    Remplissez le formulaire et cliquez sur "Générer le Kit" pour créer vos contenus marketing.
                  </p>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="result-loading">
                  <div className="spinner spinner-lg" />
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--ink)', textAlign: 'center' }}>
                    L'IA rédige vos contenus…
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ink-light)', textAlign: 'center' }}>
                    Génération de {selectedContents.length} contenu{selectedContents.length > 1 ? 's' : ''}.<br />
                    Patientez 15–30 secondes.
                  </p>
                </div>
              )}

              {/* Result state */}
              {!loading && generatedContents && (
                <div className="result-body">
                  {/* Tabs */}
                  <div className="result-tabs">
                    {CONTENT_KEYS.filter((k) => generatedContents[k]).map((key) => (
                      <button
                        key={key}
                        className={`result-tab-btn${activeResultTab === key ? ' active' : ''}`}
                        onClick={() => setActiveResultTab(key)}
                      >
                        {key === 'instagram' ? 'Instagram' : key === 'pdf' ? 'Fiche PDF' : key === 'email' ? 'Email' : 'Annonce'}
                      </button>
                    ))}
                  </div>

                  {/* Content text */}
                  {generatedContents[activeResultTab] ? (
                    <div>
                      <div
                        style={{
                          background: 'var(--cream)',
                          border: '1px solid var(--border)',
                          borderRadius: 2,
                          padding: '16px',
                          marginBottom: 12,
                        }}
                      >
                        <p className="result-text">{generatedContents[activeResultTab]}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className={`copy-btn${copiedKey === activeResultTab ? ' copied' : ''}`}
                          onClick={() => handleCopy(activeResultTab)}
                        >
                          {copiedKey === activeResultTab ? '✓ Copié !' : '📋 Copier le texte'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--ink-light)' }}>
                      Ce contenu n'a pas été généré.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Info box */}
            <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--gold-bg)', border: '1px solid var(--gold-light)', borderRadius: 2 }}>
              <p style={{ fontSize: 12, color: 'var(--warning)', lineHeight: 1.6 }}>
                <strong>💡 Conseil :</strong> Plus vous renseignez de détails (atouts, quartier, infos supplémentaires), plus les contenus générés seront précis et percutants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
