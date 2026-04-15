'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type Profile } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Tone = 'elegant' | 'dynamic' | 'warm' | 'luxury'
type Language = 'fr' | 'en' | 'both'
type ContentType = 'instagram' | 'pdf' | 'email' | 'listing' | 'story' | 'video' | 'whatsapp' | 'linkedin'

interface FormData {
  propertyType: string
  price: string
  surface: string
  rooms: string
  bedrooms: string
  city: string
  dpe: string
  floor: string
  hasElevator: boolean
  hasPool: boolean
  parking: string
  exposure: string
  yearBuilt: string
  condition: string
  targetAudience: string
  balconySize: string
  mainFeatures: string
  neighborhood: string
  additionalInfo: string
  tone: Tone
  language: Language
  contents: Record<ContentType, boolean>
  generateVariation: boolean
}

const CONTENT_OPTIONS: { key: ContentType; label: string; icon: string; credits: number }[] = [
  { key: 'instagram', label: 'Post Instagram', icon: '📸', credits: 1 },
  { key: 'pdf', label: 'Fiche PDF', icon: '📄', credits: 1 },
  { key: 'email', label: 'Email client', icon: '✉️', credits: 1 },
  { key: 'listing', label: 'Annonce portail', icon: '🏷️', credits: 1 },
  { key: 'story', label: 'Story Instagram', icon: '📱', credits: 1 },
  { key: 'video', label: 'Script vidéo', icon: '🎬', credits: 1 },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬', credits: 1 },
  { key: 'linkedin', label: 'Post LinkedIn', icon: '💼', credits: 1 },
]

const CONTENT_TAB_LABELS: Record<ContentType, string> = {
  instagram: 'Instagram',
  pdf: 'Fiche PDF',
  email: 'Email',
  listing: 'Annonce',
  story: 'Story',
  video: 'Script',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
}

const TONE_OPTIONS: { value: Tone; label: string; icon: string; desc: string }[] = [
  { value: 'elegant', label: 'Élégant', icon: '🎩', desc: 'Raffiné, vocabulaire choisi' },
  { value: 'dynamic', label: 'Dynamique', icon: '⚡', desc: 'Phrases courtes, énergie' },
  { value: 'warm', label: 'Chaleureux', icon: '❤️', desc: 'Humain, style de vie' },
  { value: 'luxury', label: 'Luxe', icon: '💎', desc: 'Ultra-prestige, exclusif' },
]

const TEMPLATES = [
  { label: '🏠 Maison familiale', data: { propertyType: 'Maison', rooms: '5', bedrooms: '3', dpe: 'C', targetAudience: 'Famille', tone: 'warm' as Tone } },
  { label: '🏢 Appart investisseur', data: { propertyType: 'Appartement', rooms: '2', bedrooms: '1', dpe: 'D', targetAudience: 'Investisseur', tone: 'dynamic' as Tone } },
  { label: '💎 Bien de prestige', data: { propertyType: 'Villa', rooms: '7', bedrooms: '4', dpe: 'B', targetAudience: 'Luxe', tone: 'luxury' as Tone } },
  { label: '🎓 Studio primo', data: { propertyType: 'Studio', rooms: '1', bedrooms: '0', dpe: 'D', targetAudience: 'Primo-accédant', tone: 'dynamic' as Tone } },
]

const DEFAULT_FORM: FormData = {
  propertyType: 'Appartement',
  price: '', surface: '', rooms: '', bedrooms: '', city: '',
  dpe: 'Non spécifié', floor: '', hasElevator: false, hasPool: false,
  parking: 'Non spécifié', exposure: 'Non spécifié', yearBuilt: '',
  condition: 'Très bon état', targetAudience: 'Non spécifié', balconySize: '',
  mainFeatures: '', neighborhood: '', additionalInfo: '',
  tone: 'elegant', language: 'fr',
  contents: { instagram: true, pdf: true, email: true, listing: true, story: false, video: false, whatsapp: false, linkedin: false },
  generateVariation: false,
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
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data as Profile)
    setAuthLoading(false)
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  const setField = (field: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleContent = (key: ContentType) =>
    setForm(prev => ({ ...prev, contents: { ...prev.contents, [key]: !prev.contents[key] } }))

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setForm(prev => ({ ...prev, ...tpl.data }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPhotos(files)
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return []
    setUploadingPhotos(true)
    const supabase = createClient()
    const urls: string[] = []

    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('property-photos').upload(path, photo, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('property-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }

    setPhotoUrls(urls)
    setUploadingPhotos(false)
    return urls
  }

  const selectedContents = (Object.keys(form.contents) as ContentType[]).filter(k => form.contents[k])
  const canGenerate = form.mainFeatures.trim().length > 0 && selectedContents.length > 0 && (profile?.credits ?? 0) > 0

  const handleGenerate = async () => {
    if (!canGenerate) return
    setLoading(true)
    setError('')
    setSuccessMsg('')
    setGeneratedContents(null)
    setEmailSent(false)

    let uploadedUrls: string[] = photoUrls
    if (photos.length > 0 && photoUrls.length === 0) {
      uploadedUrls = await uploadPhotos()
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: form, selectedContents, photoUrls: uploadedUrls }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(res.status === 402
          ? 'Vos crédits sont épuisés. Mettez à niveau votre plan.'
          : data.error ?? 'Une erreur est survenue.')
        setLoading(false)
        return
      }

      setGeneratedContents(data.contents)
      const firstKey = selectedContents[0]
      if (firstKey) setActiveResultTab(firstKey)
      setSuccessMsg('✦ Kit généré avec succès !')
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

  const handleDownloadPDF = async () => {
    if (!generatedContents) return
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const gold = [201, 169, 110] as const
    const ink = [26, 24, 20] as const
    const gray = [107, 101, 96] as const

    // Header
    doc.setFillColor(...ink)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.text('ImmoKit AI', 14, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(201, 169, 110)
    doc.text('Kit marketing immobilier', 14, 20)

    // Property title
    doc.setTextColor(...ink)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const title = `${form.propertyType}${form.surface ? ` • ${form.surface}m²` : ''}${form.city ? ` • ${form.city}` : ''}`
    doc.text(title, 14, 40)

    if (form.price) {
      doc.setFontSize(13)
      doc.setTextColor(...gold)
      doc.text(`${form.price} €`, 14, 50)
    }

    let yPos = form.price ? 62 : 52

    const contentLabels: Record<string, string> = {
      instagram: '📸 POST INSTAGRAM',
      pdf: '📄 FICHE DE PRÉSENTATION',
      email: '✉️ EMAIL CLIENT',
      listing: '🏷️ ANNONCE PORTAIL',
      story: '📱 STORY INSTAGRAM',
      video: '🎬 SCRIPT VIDÉO',
      whatsapp: '💬 MESSAGE WHATSAPP',
      linkedin: '💼 POST LINKEDIN',
    }

    for (const [key, text] of Object.entries(generatedContents)) {
      if (!text) continue
      if (yPos > 240) { doc.addPage(); yPos = 20 }

      // Section header
      doc.setFillColor(250, 248, 244)
      doc.rect(10, yPos - 5, 190, 10, 'F')
      doc.setDrawColor(...gold)
      doc.line(10, yPos - 5, 10, yPos + 5)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...gray)
      doc.text(contentLabels[key] ?? key.toUpperCase(), 14, yPos + 1)
      yPos += 12

      // Content text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...ink)
      const lines = doc.splitTextToSize(text, 182)
      const blockHeight = lines.length * 5
      if (yPos + blockHeight > 270) { doc.addPage(); yPos = 20 }
      doc.text(lines, 14, yPos)
      yPos += blockHeight + 14
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(`Généré par ImmoKit AI • ${new Date().toLocaleDateString('fr-FR')}`, 14, 290)

    const filename = `kit-immo-${form.city || form.propertyType}-${Date.now()}.pdf`
    doc.save(filename)
  }

  const handleSendEmail = async () => {
    if (!generatedContents || !profile) return
    setEmailSending(true)
    try {
      const res = await fetch('/api/send-kit-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          contents: generatedContents,
          property: { type: form.propertyType, city: form.city, price: form.price, surface: form.surface },
        }),
      })
      if (res.ok) setEmailSent(true)
      else setError('Erreur lors de l\'envoi de l\'email.')
    } catch {
      setError('Impossible d\'envoyer l\'email.')
    }
    setEmailSending(false)
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
        {/* Header */}
        <div style={{ padding: '24px 0 16px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          <p className="section-label">GÉNÉRATEUR DE KIT</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: '2.2rem' }}>Nouveau kit marketing</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>
                ✦ <strong style={{ color: (profile?.credits ?? 0) > 0 ? 'var(--gold)' : 'var(--error)' }}>{profile?.credits ?? 0}</strong> crédit{(profile?.credits ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {successMsg && <div className="alert alert-success" style={{ marginTop: 16, marginBottom: 0 }}>{successMsg}</div>}

        <div className="generator-layout">
          {/* ===== FORM ===== */}
          <div className="generator-form-panel">

            {/* Templates rapides */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>⚡</span>
                <span className="generator-section-title">Modèles rapides</span>
              </div>
              <div className="generator-section-body" style={{ paddingBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.label} type="button" className="btn btn-outline btn-sm" onClick={() => applyTemplate(tpl)}>
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 1: Le bien */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>🏠</span>
                <span className="generator-section-title">Le bien</span>
              </div>
              <div className="generator-section-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type de bien</label>
                    <select className="form-select" value={form.propertyType} onChange={e => setField('propertyType', e.target.value)}>
                      {['Appartement', 'Maison', 'Villa', 'Loft', 'Studio', 'Duplex', 'Penthouse', 'Terrain', 'Local commercial', 'Immeuble'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">État du bien</label>
                    <select className="form-select" value={form.condition} onChange={e => setField('condition', e.target.value)}>
                      {['Parfait état', 'Très bon état', 'Bon état', 'À rafraîchir', 'À rénover'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prix</label>
                    <div className="input-wrapper">
                      <input type="text" className="form-input" placeholder="ex: 350 000" value={form.price} onChange={e => setField('price', e.target.value)} style={{ paddingRight: 28 }} />
                      <span className="input-suffix">€</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Surface</label>
                    <div className="input-wrapper">
                      <input type="text" className="form-input" placeholder="ex: 85" value={form.surface} onChange={e => setField('surface', e.target.value)} style={{ paddingRight: 32 }} />
                      <span className="input-suffix">m²</span>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pièces</label>
                    <input type="text" className="form-input" placeholder="ex: 4" value={form.rooms} onChange={e => setField('rooms', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chambres</label>
                    <input type="text" className="form-input" placeholder="ex: 2" value={form.bedrooms} onChange={e => setField('bedrooms', e.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Étage</label>
                    <input type="text" className="form-input" placeholder="ex: 3e / RDC" value={form.floor} onChange={e => setField('floor', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Balcon / Terrasse</label>
                    <div className="input-wrapper">
                      <input type="text" className="form-input" placeholder="Surface en m²" value={form.balconySize} onChange={e => setField('balconySize', e.target.value)} style={{ paddingRight: 32 }} />
                      <span className="input-suffix">m²</span>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Parking</label>
                    <select className="form-select" value={form.parking} onChange={e => setField('parking', e.target.value)}>
                      {['Non spécifié', 'Aucun', '1 place', '2 places', 'Garage individuel', 'Double garage'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exposition</label>
                    <select className="form-select" value={form.exposure} onChange={e => setField('exposure', e.target.value)}>
                      {['Non spécifié', 'Nord', 'Sud', 'Est', 'Ouest', 'Sud-Est', 'Sud-Ouest', 'Nord-Est', 'Nord-Ouest', 'Double exposition', 'Triple exposition'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">DPE</label>
                    <select className="form-select" value={form.dpe} onChange={e => setField('dpe', e.target.value)}>
                      {['Non spécifié', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Année de construction</label>
                    <input type="text" className="form-input" placeholder="ex: 1930, 2018…" value={form.yearBuilt} onChange={e => setField('yearBuilt', e.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ville / Quartier</label>
                    <input type="text" className="form-input" placeholder="ex: Paris 16e, Lyon Part-Dieu…" value={form.city} onChange={e => setField('city', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Public cible</label>
                    <select className="form-select" value={form.targetAudience} onChange={e => setField('targetAudience', e.target.value)}>
                      {['Non spécifié', 'Primo-accédant', 'Famille', 'Investisseur', 'CSP+', 'Retraité', 'Luxe / HNWI'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
                  {[
                    { key: 'hasElevator', label: '🛗 Ascenseur' },
                    { key: 'hasPool', label: '🏊 Piscine' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '8px 14px', background: form[key as keyof FormData] ? 'var(--gold-bg)' : 'var(--white)', border: `1px solid ${form[key as keyof FormData] ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 2 }}>
                      <input type="checkbox" checked={!!form[key as keyof FormData]} onChange={e => setField(key as keyof FormData, e.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Photos */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>📸</span>
                <span className="generator-section-title">Photos du bien</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gold)', fontWeight: 600, background: 'var(--gold-bg)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--gold-light)' }}>IA VISION</span>
              </div>
              <div className="generator-section-body">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: 'none' }} />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed var(--border)', borderRadius: 2, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: photos.length > 0 ? 'var(--gold-bg)' : 'var(--cream)', transition: 'all 0.2s' }}
                >
                  {photos.length === 0 ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-mid)', marginBottom: 4 }}>Importer des photos</p>
                      <p style={{ fontSize: 12, color: 'var(--ink-light)' }}>Jusqu'à 5 photos · JPG, PNG, WEBP · L'IA analysera chaque pièce</p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>{photos.length} photo{photos.length > 1 ? 's' : ''} prête{photos.length > 1 ? 's' : ''} pour analyse</p>
                      <p style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 4 }}>{photos.map(p => p.name).join(', ')}</p>
                    </>
                  )}
                </div>
                {photos.length > 0 && (
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 11 }} onClick={() => { setPhotos([]); setPhotoUrls([]) }}>
                    ✕ Supprimer les photos
                  </button>
                )}
                <p style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 8, lineHeight: 1.6 }}>
                  L'IA analyse visuellement vos photos pour enrichir les contenus (matériaux, luminosité, volumes, finitions…)
                </p>
              </div>
            </div>

            {/* Section 3: Points forts */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>⭐</span>
                <span className="generator-section-title">Points forts</span>
              </div>
              <div className="generator-section-body">
                <div className="form-group">
                  <label className="form-label">Atouts principaux <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <textarea className="form-textarea" style={{ minHeight: 100 }}
                    placeholder="ex: Vue panoramique, parquet chevrons, hauteur sous plafond 3m20, cave, parking double, cuisine Bulthaup…"
                    value={form.mainFeatures} onChange={e => setField('mainFeatures', e.target.value)} required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Environnement / Quartier</label>
                  <textarea className="form-textarea" style={{ minHeight: 72 }}
                    placeholder="ex: À 2 min du métro, commerces, écoles réputées, quartier calme et résidentiel…"
                    value={form.neighborhood} onChange={e => setField('neighborhood', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Informations supplémentaires</label>
                  <textarea className="form-textarea" style={{ minHeight: 64 }}
                    placeholder="ex: Copropriété saine, charges 180€/mois, disponible immédiatement…"
                    value={form.additionalInfo} onChange={e => setField('additionalInfo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Paramètres */}
            <div className="generator-section">
              <div className="generator-section-header">
                <span>⚙️</span>
                <span className="generator-section-title">Paramètres</span>
              </div>
              <div className="generator-section-body">
                {/* Tone */}
                <div className="form-group">
                  <label className="form-label">Ton de communication</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {TONE_OPTIONS.map(({ value, label, icon, desc }) => (
                      <button key={value} type="button"
                        onClick={() => setField('tone', value)}
                        style={{ padding: '10px 8px', background: form.tone === value ? 'var(--ink)' : 'var(--white)', border: `1px solid ${form.tone === value ? 'var(--ink)' : 'var(--border)'}`, borderRadius: 2, cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s' }}
                      >
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: form.tone === value ? 'var(--white)' : 'var(--ink)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 10, color: form.tone === value ? 'rgba(255,255,255,0.6)' : 'var(--ink-light)' }}>{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="form-group">
                  <label className="form-label">Langue(s)</label>
                  <div className="toggle-group">
                    {[{ v: 'fr', l: '🇫🇷 Français' }, { v: 'en', l: '🇬🇧 Anglais' }, { v: 'both', l: '🌍 Les deux' }].map(({ v, l }) => (
                      <button key={v} type="button" className={`toggle-btn${form.language === v ? ' active' : ''}`} onClick={() => setField('language', v)}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Content types */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contenus à générer</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {CONTENT_OPTIONS.map(({ key, label, icon }) => (
                      <label key={key}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: form.contents[key] ? 'var(--gold-bg)' : 'var(--white)', border: `1px solid ${form.contents[key] ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 2, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--ink-mid)', transition: 'all 0.18s', userSelect: 'none' }}
                        onClick={() => toggleContent(key)}
                      >
                        <input type="checkbox" checked={form.contents[key]} onChange={() => toggleContent(key)} style={{ pointerEvents: 'none', accentColor: 'var(--gold)' }} />
                        {icon} {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate button */}
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16, textAlign: 'left' }}>
                  {error}
                </div>
              )}
              <button type="button" className="btn btn-gold btn-lg" style={{ minWidth: 260 }} onClick={handleGenerate} disabled={!canGenerate || loading || uploadingPhotos}>
                {uploadingPhotos ? <><span className="spinner" />Upload photos…</> : loading ? <><span className="spinner" />Génération en cours…</> : '✦ Générer le Kit'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 8 }}>
                {photos.length > 0 ? `📸 ${photos.length} photo(s) · Analyse visuelle incluse · ` : ''}Environ 15–30 secondes · 1 crédit
              </p>
            </div>
          </div>

          {/* ===== RESULT PANEL ===== */}
          <div className="generator-result-panel">
            <div className="result-card">
              <div className="result-header">
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>Résultat</p>
                {generatedContents && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`copy-btn${copiedKey === activeResultTab ? ' copied' : ''}`} onClick={() => handleCopy(activeResultTab)}>
                      {copiedKey === activeResultTab ? '✓ Copié' : '📋 Copier'}
                    </button>
                    <button className="copy-btn" onClick={handleDownloadPDF} title="Télécharger PDF">
                      📥 PDF
                    </button>
                    <button
                      className={`copy-btn${emailSent ? ' copied' : ''}`}
                      onClick={handleSendEmail}
                      disabled={emailSending}
                      title="Envoyer par email"
                    >
                      {emailSending ? <span className="spinner" style={{ width: 12, height: 12 }} /> : emailSent ? '✓ Envoyé' : '✉️ Email'}
                    </button>
                  </div>
                )}
              </div>

              {!loading && !generatedContents && (
                <div className="result-empty">
                  <div className="result-empty-icon">🏡</div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--ink-light)' }}>Votre kit apparaîtra ici</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-light)', maxWidth: 260, lineHeight: 1.6 }}>Remplissez le formulaire et cliquez sur "Générer le Kit".</p>
                </div>
              )}

              {loading && (
                <div className="result-loading">
                  <div className="spinner spinner-lg" />
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', textAlign: 'center' }}>L'IA rédige vos contenus…</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-light)', textAlign: 'center' }}>
                    {photos.length > 0 ? '📸 Analyse des photos en cours…' : `Génération de ${selectedContents.length} contenu(s).`}<br />15–30 secondes.
                  </p>
                </div>
              )}

              {!loading && generatedContents && (
                <div className="result-body">
                  <div className="result-tabs">
                    {(Object.keys(form.contents) as ContentType[])
                      .filter(k => form.contents[k] && generatedContents[k])
                      .map(key => (
                        <button key={key} className={`result-tab-btn${activeResultTab === key ? ' active' : ''}`} onClick={() => setActiveResultTab(key)}>
                          {CONTENT_TAB_LABELS[key]}
                        </button>
                      ))}
                  </div>
                  {generatedContents[activeResultTab] ? (
                    <div>
                      <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 2, padding: 16, marginBottom: 10 }}>
                        <p className="result-text">{generatedContents[activeResultTab]}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button className={`copy-btn${copiedKey === activeResultTab ? ' copied' : ''}`} onClick={() => handleCopy(activeResultTab)}>
                          {copiedKey === activeResultTab ? '✓ Copié !' : '📋 Copier'}
                        </button>
                        <button className="copy-btn" onClick={handleDownloadPDF}>📥 Télécharger PDF</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--ink-light)' }}>Contenu non généré.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--gold-bg)', border: '1px solid var(--gold-light)', borderRadius: 2 }}>
              <p style={{ fontSize: 12, color: 'var(--warning)', lineHeight: 1.6 }}>
                <strong>💡 Conseil :</strong> Importez des photos et détaillez les atouts pour des contenus plus précis et percutants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
