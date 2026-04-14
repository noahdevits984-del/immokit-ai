import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'ImmoKit AI — Générateur de contenus immobiliers',
  description: 'Générez des contenus marketing immobiliers professionnels en quelques secondes grâce à l\'IA.',
  keywords: 'immobilier, marketing, IA, générateur, contenu, annonce, instagram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
