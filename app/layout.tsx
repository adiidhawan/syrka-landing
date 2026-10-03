import type { Metadata, Viewport } from 'next'
import './globals.css'
import LiquidGlassFilter from '@/components/LiquidGlassFilter'

export const metadata: Metadata = {
  title: 'Syrka — The Operating System for Human Capability',
  description: 'One record of capability for students, universities, employers and governments.',
  // app/favicon.ico is picked up automatically; these add the larger PNG and the iOS home-screen icon.
  icons: { icon: { url: '/icon-192.png', type: 'image/png', sizes: '192x192' }, apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111417',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Syrka" />
        <link rel="manifest" href="/manifest.json" />
        {/* Loaded as <link>s rather than CSS @import so the browser can fetch them in parallel with the stylesheet.
            Components reference these families by name ('Inter', 'Space Grotesk', 'JetBrains Mono'). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body>
        <LiquidGlassFilter />
        {children}
      </body>
    </html>
  )
}
