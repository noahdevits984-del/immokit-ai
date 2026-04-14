import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

type Tone = 'elegant' | 'dynamic' | 'warm' | 'luxury'
type Language = 'fr' | 'en' | 'both'
type ContentType = 'instagram' | 'pdf' | 'email' | 'listing' | 'story' | 'video' | 'whatsapp' | 'linkedin'

interface FormData {
  propertyType: string; price: string; surface: string; rooms: string; bedrooms: string
  city: string; dpe: string; floor: string; hasElevator: boolean; hasPool: boolean
  parking: string; exposure: string; yearBuilt: string; condition: string
  targetAudience: string; balconySize: string; mainFeatures: string
  neighborhood: string; additionalInfo: string; tone: Tone; language: Language
}

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  elegant: 'Ton raffiné, sophistiqué, vocabulaire choisi. Phrases élégantes, style littéraire sobre. Précision et bon goût.',
  dynamic: 'Ton énergique. Phrases courtes et percutantes, mots d\'action, rythme soutenu. Enthousiasme et urgence.',
  warm: 'Ton chaleureux et humain. Met en avant le style de vie, les émotions, la qualité de vie au quotidien.',
  luxury: 'Ton ultra-prestige. Vocabulaire exclusif (exceptionnel, rare, d\'exception). Clientèle HNWI.',
}

function buildContext(form: FormData): string {
  return [
    `Type : ${form.propertyType}`,
    form.surface && `Surface : ${form.surface} m²`,
    form.price && `Prix : ${form.price} €`,
    form.rooms && `Pièces : ${form.rooms}`,
    form.bedrooms && `Chambres : ${form.bedrooms}`,
    form.floor && `Étage : ${form.floor}`,
    form.balconySize && `Balcon/Terrasse : ${form.balconySize} m²`,
    form.parking !== 'Non spécifié' && `Parking : ${form.parking}`,
    form.exposure !== 'Non spécifié' && `Exposition : ${form.exposure}`,
    form.hasElevator && `Ascenseur : Oui`,
    form.hasPool && `Piscine : Oui`,
    form.dpe !== 'Non spécifié' && `DPE : ${form.dpe}`,
    form.yearBuilt && `Année de construction : ${form.yearBuilt}`,
    `État : ${form.condition}`,
    form.targetAudience !== 'Non spécifié' && `Public cible : ${form.targetAudience}`,
    form.city && `Localisation : ${form.city}`,
    `Atouts : ${form.mainFeatures}`,
    form.neighborhood && `Quartier : ${form.neighborhood}`,
    form.additionalInfo && `Infos supplémentaires : ${form.additionalInfo}`,
  ].filter(Boolean).join('\n')
}

function langInstruction(language: Language): string {
  if (language === 'fr') return 'Rédige uniquement en français.'
  if (language === 'en') return 'Write only in English.'
  return 'Rédige en français ET en anglais (section FR d\'abord, puis section EN).'
}

type MessageParam = Anthropic.Messages.MessageParam

function buildMessages(prompt: string, photoUrls: string[]): MessageParam[] {
  if (photoUrls.length === 0) {
    return [{ role: 'user', content: prompt }]
  }

  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = photoUrls.map(url => ({
    type: 'image',
    source: { type: 'url', url },
  }))

  return [{
    role: 'user',
    content: [
      ...imageBlocks,
      { type: 'text', text: `${prompt}\n\nAnalyse également les photos fournies pour enrichir le contenu avec des détails visuels précis (matériaux, luminosité, volumes, finitions, ambiance…).` },
    ],
  }]
}

async function generateContent(type: ContentType, form: FormData, photoUrls: string[]): Promise<string> {
  const ctx = buildContext(form)
  const tone = TONE_INSTRUCTIONS[form.tone]
  const lang = langInstruction(form.language)

  const prompts: Record<ContentType, string> = {
    instagram: `Tu es expert en marketing immobilier. Rédige un post Instagram professionnel et engageant.

BIEN :
${ctx}

TON : ${tone}
${lang}

Structure :
1. Accroche percutante 1-2 lignes avec emojis
2. Description valorisante 3-4 lignes
3. Points forts avec emojis (format bullet)
4. Localisation et type de bien
5. CTA clair (ex: "DM pour visiter 📩")
6. 15-20 hashtags pertinents

Max 280 mots.`,

    pdf: `Tu es agent immobilier expert. Rédige une fiche de présentation professionnelle.

BIEN :
${ctx}

TON : ${tone}
${lang}

Structure :
1. TITRE : Accrocheur, max 80 caractères
2. DESCRIPTION : 150-200 mots valorisant le bien
3. POINTS FORTS : 5-7 atouts en liste
4. LE QUARTIER : 2-3 lignes sur l'environnement
5. CARACTÉRISTIQUES : Surface, pièces, chambres, DPE, prix`,

    email: `Tu es agent immobilier professionnel. Rédige un email de présentation complet.

BIEN :
${ctx}

TON : ${tone}
${lang}

Structure :
1. OBJET : Ligne d'objet percutante (précise "Objet : ")
2. Accroche personnalisée (2-3 lignes)
3. Présentation détaillée (150 mots)
4. Points forts en avant
5. Description du quartier
6. Invitation à visiter
7. Formule de politesse + signature type`,

    listing: `Tu es spécialiste marketing immobilier digital. Rédige une annonce optimisée portails (SeLoger, LeBonCoin, PAP).

BIEN :
${ctx}

TON : ${tone}
${lang}

Structure :
1. TITRE : Max 80 caractères, accrocheur, informatif
2. DESCRIPTION : Exactement 220-250 mots
   - Première phrase accroche forte
   - Description complète et valorisante
   - Mots-clés SEO intégrés naturellement
   - Points forts progressifs
   - Quartier et environnement
   - Conclusion avec invitation à visiter`,

    story: `Tu es expert Instagram. Crée un contenu Story en 3 slides courts et percutants.

BIEN :
${ctx}

TON : ${tone}
${lang}

Format strict :
SLIDE 1 — Accroche (1 phrase choc + emoji, max 8 mots)
SLIDE 2 — Points clés (3 bullets ultra-courts avec emojis)
SLIDE 3 — CTA (1 phrase + emoji d'action)

Style vertical, très lisible, adapté au format story 9:16.`,

    video: `Tu es réalisateur de visites virtuelles immobilières. Rédige un script vidéo de présentation.

BIEN :
${ctx}

TON : ${tone}
${lang}

Structure :
INTRO (0-10s) : Accroche en voix off + présentation du bien
VISITE (10-60s) : Narration pièce par pièce (salon, cuisine, chambres, extérieur)
POINTS FORTS (60-75s) : Mise en avant des 3 atouts principaux
QUARTIER (75-85s) : Environnement et accès
OUTRO (85-90s) : CTA et contact

Format : [TIMING] : texte à lire
Durée totale : ~90 secondes`,

    whatsapp: `Tu es agent immobilier. Rédige un message WhatsApp efficace pour ton fichier acheteurs.

BIEN :
${ctx}

TON : ${tone}
${lang}

Format :
- Max 160 mots
- Ton direct et personnel
- Emojis discrets et professionnels
- Mentions clés (type, surface, prix, ville)
- 2-3 atouts majeurs
- CTA simple ("Disponible pour visiter 📅")
- Signature courte`,

    linkedin: `Tu es expert en communication immobilière B2B. Rédige un post LinkedIn professionnel.

BIEN :
${ctx}

TON : ${tone}
${lang}

Structure :
- Accroche qui interpelle (investisseurs / professionnels)
- Présentation du bien avec données chiffrées
- Argumentaire investissement ou professionnel
- Points forts objectifs
- Call-to-action professionnel
- 3-5 hashtags LinkedIn (#immobilier #investissement #realestate)
Max 200 mots.`,
  }

  const messages = buildMessages(prompts[type], photoUrls)
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1000,
    messages,
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text.trim() : ''
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('credits, kits_generated').eq('id', user.id).single()

    if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })
    if (profile.credits < 1) return NextResponse.json({ error: 'Crédits insuffisants.' }, { status: 402 })

    const body = await req.json()
    const { formData, selectedContents, photoUrls = [] } = body as {
      formData: FormData
      selectedContents: ContentType[]
      photoUrls?: string[]
    }

    if (!formData?.mainFeatures?.trim()) return NextResponse.json({ error: 'Les atouts principaux sont obligatoires.' }, { status: 400 })
    if (!selectedContents?.length) return NextResponse.json({ error: 'Sélectionnez au moins un contenu.' }, { status: 400 })

    // Generate all content types in parallel
    const results = await Promise.all(
      selectedContents.map(async type => [type, await generateContent(type, formData, photoUrls)] as const)
    )
    const contents = Object.fromEntries(results)

    // Save kit
    await supabase.from('kits').insert({
      user_id: user.id,
      property_type: formData.propertyType,
      city: formData.city,
      price: formData.price,
      surface: formData.surface,
      tone: formData.tone,
      language: formData.language,
      contents,
      has_photos: photoUrls.length > 0,
      created_at: new Date().toISOString(),
    })

    // Deduct credit
    await supabase.from('profiles').update({
      credits: profile.credits - 1,
      kits_generated: (profile.kits_generated ?? 0) + 1,
    }).eq('id', user.id)

    return NextResponse.json({ contents })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération. Réessayez.' }, { status: 500 })
  }
}
