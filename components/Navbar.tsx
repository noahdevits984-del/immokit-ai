'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient, type Profile } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data as Profile)
        })
    })
  }, [pathname])

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const planLabel: Record<string, string> = {
    free: 'Gratuit',
    starter: 'Starter',
    pro: 'Pro',
    agency: 'Agence',
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <a href="/dashboard" className="navbar-logo" style={{ textDecoration: 'none' }}>
          <span className="logo-immo">Immo</span>
          <span className="logo-kit">Kit</span>
          <span className="logo-ai">AI</span>
        </a>

        {/* Nav Links */}
        <div className="navbar-links">
          <a
            href="/dashboard"
            className={`navbar-link${pathname === '/dashboard' ? ' active' : ''}`}
          >
            Tableau de bord
          </a>
          <a
            href="/generator"
            className={`navbar-link${pathname === '/generator' ? ' active' : ''}`}
          >
            Nouveau kit
          </a>
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {profile && (
            <>
              <div className="credits-badge">
                <span className="credits-dot">✦</span>
                <span>{profile.credits} crédit{profile.credits !== 1 ? 's' : ''}</span>
              </div>
              <span className={`plan-badge plan-badge-${profile.plan}`}>
                {planLabel[profile.plan] ?? profile.plan}
              </span>
            </>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: 11 }}
          >
            {signingOut ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Déconnexion'}
          </button>
        </div>
      </div>
    </nav>
  )
}
