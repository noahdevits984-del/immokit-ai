import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const CONTENT_LABELS: Record<string, string> = {
  instagram: '📸 Post Instagram',
  pdf: '📄 Fiche de présentation',
  email: '✉️ Email client',
  listing: '🏷️ Annonce portail',
  story: '📱 Story Instagram',
  video: '🎬 Script vidéo',
  whatsapp: '💬 Message WhatsApp',
  linkedin: '💼 Post LinkedIn',
}

function buildEmailHTML(contents: Record<string, string>, property: { type: string; city: string; price: string; surface: string }) {
  const title = [property.type, property.surface && `${property.surface}m²`, property.city].filter(Boolean).join(' • ')

  const sectionsHTML = Object.entries(contents).map(([key, text]) => `
    <div style="margin-bottom:28px;border-left:3px solid #C9A96E;padding-left:16px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B6560;margin:0 0 10px;">${CONTENT_LABELS[key] ?? key}</p>
      <p style="font-size:14px;color:#3D3A35;line-height:1.75;margin:0;white-space:pre-wrap;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kit ImmoKit AI</title></head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:'DM Sans',system-ui,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:#1A1814;padding:28px 32px;border-radius:2px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:22px;font-weight:600;color:#FFFFFF;font-family:Georgia,serif;">
        Immo<span style="color:#C9A96E;">Kit</span> <span style="font-size:13px;vertical-align:super;">AI</span>
      </p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:0.08em;text-transform:uppercase;">Votre kit marketing immobilier</p>
    </div>

    <!-- Property info -->
    <div style="background:#FFFFFF;border:1px solid #E2DDD6;border-radius:2px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:20px;font-weight:600;font-family:Georgia,serif;color:#1A1814;">${title || 'Votre bien'}</p>
      ${property.price ? `<p style="margin:0;font-size:16px;color:#C9A96E;font-weight:600;">${property.price} €</p>` : ''}
    </div>

    <!-- Contents -->
    <div style="background:#FFFFFF;border:1px solid #E2DDD6;border-radius:2px;padding:28px 28px 4px;">
      ${sectionsHTML}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #E2DDD6;">
      <p style="font-size:12px;color:#6B6560;margin:0;">Généré par ImmoKit AI · <a href="https://immokit.ai" style="color:#C9A96E;">immokit.ai</a></p>
    </div>
  </div>
</body>
</html>`
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

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Service email non configuré.' }, { status: 503 })
    }

    const { email, contents, property } = await req.json()
    if (!email || !contents) return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })

    const resend = new Resend(process.env.RESEND_API_KEY)
    const title = [property?.type, property?.city].filter(Boolean).join(' à ') || 'votre bien'

    const { error } = await resend.emails.send({
      from: 'ImmoKit AI <kits@immokit.ai>',
      to: email,
      subject: `✦ Votre kit marketing — ${title}`,
      html: buildEmailHTML(contents, property ?? {}),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
