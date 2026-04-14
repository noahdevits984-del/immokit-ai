'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ReferralPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  useEffect(() => {
    if (code) {
      localStorage.setItem('referral_code', code)
      router.replace(`/auth?ref=${code}`)
    }
  }, [code, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div className="spinner spinner-lg" />
    </div>
  )
}
