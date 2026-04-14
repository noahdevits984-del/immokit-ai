import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

type Tone = 'elegant' | 'dynamic' | 'warm' | 'luxury'
type Language = 'fr' | 'en' | 'both'

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
}

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  elegant: `Utilise un ton raffiné, sophistiqué et distingué. Vocabulaire choisi, phrases élégantes et bien construites, style littéraire sobre. Évite les superlatifs vulgaires. Privilégie la précision et le goût.`,
  dynamic: `Utilise un ton énergique et dynamique. Phrases courtes et percutantes, mots d'action, rythme soutenu. Crée de l'enthousiasme et de l'urgence. Style direct et vivant.`,
  warm: `Utilise un ton chaleureux, humain et proche. Mets en avant le style de vie, les émotions, la qualité de vie. Parle de "chez soi", de "foyer", de vie quotidienne. Crée une connexion émotionnelle.`,
  luxury: `Utilise un ton ultra-prestige et exclusif. Vocabulaire du luxe (exceptionnel, rare, unique, d'exception, raffiné, exclusif). Cible une clientèle haut de gamme. Chaque mot doit inspirer excellence et distinction.`,
}

function buildPropertyContext(form: FormData): string {
  const parts = [
    `Type de bien : ${form.propertyType}`,
    form.surface ? `Surface : ${form.surface} m²` : '',
    form.price ? `Prix : ${form.price} €` : '',
    form.rooms ? `Pièces : ${form.rooms}` : '',
    form.bedrooms ? `Chambres : ${form.bedrooms}` : '',
    form.city ? `Localisation : ${form.city}` : '',
    form.dpe && form.dpe !== 'Non spécifié' ? `DPE : ${form.dpe}` : '',
    `Atouts principaux : ${form.mainFeatures}`,
    form.neighborhood ? `Environnement / Quartier : ${form.neighborhood}` : '',
    form.additionalInfo ? `Informations supplémentaires : ${form.additionalInfo}` : '',
  ].filter(Boolean)

  return parts.join('\n')
}

function buildLanguageInstruction(language: Language): string {
  if (language === 'fr') return 'Rédige uniquement en français.'
  if (language === 'en') return 'Write only in English.'
  return 'Rédige en français ET en anglais (traduis la totalité du contenu dans les deux langues, section française d\'abord, puis section anglaise).'
}

async function generateContent(
  type: 'instagram' | 'pdf' | 'email' | 'listing',
  form: FormData
): Promise<string> {
  const context = buildPropertyContext(form)
  const toneInstruction = TONE_INSTRUCTIONS[form.tone]
  const langInstruction = buildLanguageInstruction(form.language)

  let prompt = ''

  if (type === 'instagram') {
    prompt = `Tu es un expert en marketing immobilier. Rédige un post Instagram professionnel et engageant pour ce bien.

BIEN :
${context}

INSTRUCTIONS DE TON : ${toneInstruction}
LANGUE : ${langInstruction}

Le post doit inclure :
1. Une accroche percutante en 1-2 lignes (avec emojis)
2. Une description du bien en 3-4 lignes valorisante
3. Les points forts mis en avant avec des emojis (format bullet)
4. La localisation et le type de bien
5. Un CTA clair (appel à l'action)
6. 15 à 20 hashtags pertinents en fin de post (#immobilier #realestate #luxe etc.)

Maximum 280 mots. Sois naturel, accrocheur et professionnel.`
  }

  if (type === 'pdf') {
    prompt = `Tu es un agent immobilier expert. Rédige une fiche de présentation complète et professionnelle pour ce bien.

BIEN :
${context}

INSTRUCTIONS DE TON : ${toneInstruction}
LANGUE : ${langInstruction}

La fiche doit inclure :
1. TITRE : Un titre accrocheur et descriptif (max 80 caractères)
2. DESCRIPTION : Un texte de présentation principal de 150 à 200 mots, valorisant le bien
3. POINTS FORTS : Une liste de 5 à 7 atouts majeurs, présentés clairement
4. LE QUARTIER : 2-3 lignes sur l'environnement et la situation géographique
5. CARACTÉRISTIQUES TECHNIQUES : Surface, pièces, chambres, DPE, prix (si disponibles)

Adopte un style clair, structuré et professionnel. Chaque section doit être clairement séparée.`
  }

  if (type === 'email') {
    prompt = `Tu es un agent immobilier professionnel. Rédige un email de présentation complet pour ce bien immobilier.

BIEN :
${context}

INSTRUCTIONS DE TON : ${toneInstruction}
LANGUE : ${langInstruction}

L'email doit inclure :
1. OBJET : Une ligne d'objet percutante et professionnelle (commence par "Objet : ")
2. CORPS :
   - Accroche personnalisée (2-3 lignes)
   - Présentation détaillée du bien (150 mots)
   - Mise en avant des points forts
   - Description du quartier
   - Invitation claire à visiter le bien
3. FORMULE DE POLITESSE : Professionnelle et chaleureuse
4. SIGNATURE : Bloc de signature type agent immobilier

Structure l'email avec des sauts de ligne clairs. Ton professionnel, chaleureux et convaincant.`
  }

  if (type === 'listing') {
    prompt = `Tu es un spécialiste du marketing immobilier digital. Rédige une annonce optimisée pour les portails immobiliers (SeLoger, LeBonCoin, PAP, etc.).

BIEN :
${context}

INSTRUCTIONS DE TON : ${toneInstruction}
LANGUE : ${langInstruction}

L'annonce doit inclure :
1. TITRE : Maximum 80 caractères, accrocheur, informatif, avec les infos clés (type, surface, ville)
2. DESCRIPTION : 200 à 250 mots exactement
   - Première phrase : accroche forte qui donne envie de lire
   - Corps : description complète et valorisante du bien
   - Mots-clés pertinents intégrés naturellement pour le référencement
   - Points forts mis en avant progressivement
   - Environnement et quartier
   - Conclusion avec invitation à visiter

Optimise pour les portails immobiliers : sois précis, complet et convaincant. Évite les répétitions.`
  }

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type === 'text') return content.text.trim()
  return ''
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate via Supabase
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 })
    }

    // 2. Check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, kits_generated')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })
    }

    if (profile.credits < 1) {
      return NextResponse.json(
        { error: 'Crédits insuffisants. Mettez à niveau votre plan pour continuer.' },
        { status: 402 }
      )
    }

    // 3. Parse request body
    const body = await req.json()
    const { formData, selectedContents } = body as {
      formData: FormData
      selectedContents: Array<'instagram' | 'pdf' | 'email' | 'listing'>
    }

    if (!formData || !selectedContents || selectedContents.length === 0) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    if (!formData.mainFeatures?.trim()) {
      return NextResponse.json({ error: 'Les atouts principaux sont obligatoires.' }, { status: 400 })
    }

    // 4. Generate content for each selected type (in parallel)
    const generationPromises = selectedContents.map(async (type) => {
      const text = await generateContent(type, formData)
      return [type, text] as const
    })

    const results = await Promise.all(generationPromises)
    const contents: Record<string, string> = Object.fromEntries(results)

    // 5. Save kit to database
    const { error: kitError } = await supabase.from('kits').insert({
      user_id: user.id,
      property_type: formData.propertyType,
      city: formData.city,
      price: formData.price,
      surface: formData.surface,
      tone: formData.tone,
      language: formData.language,
      contents,
      created_at: new Date().toISOString(),
    })

    if (kitError) {
      console.error('Error saving kit:', kitError)
    }

    // 6. Deduct 1 credit and increment kits_generated
    await supabase
      .from('profiles')
      .update({
        credits: profile.credits - 1,
        kits_generated: (profile.kits_generated ?? 0) + 1,
      })
      .eq('id', user.id)

    return NextResponse.json({ contents })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
