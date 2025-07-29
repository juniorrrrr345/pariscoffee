import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CachePreloader from '@/components/CachePreloader'
import GlobalBackgroundProvider from '@/components/GlobalBackgroundProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JBEL INDUSTRY - Boutique en ligne',
  description: 'JBEL INDUSTRY - Votre boutique en ligne. Produits de qualité et livraison rapide.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JBEL INDUSTRY'
  },
  formatDetection: {
    telephone: false
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <GlobalBackgroundProvider />
        <CachePreloader />
        {children}
      </body>
    </html>
  )
}