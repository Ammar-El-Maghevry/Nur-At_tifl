import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NurAI — Smart Nutrition Detection for Children',
  description: 'AI-powered MUAC screening to detect child malnutrition in seconds. Built for UNICEF Mauritania.',
  keywords: 'malnutrition, MUAC, child nutrition, Mauritania, UNICEF, AI screening',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'NurAI — Smart Nutrition Detection',
    description: 'Detect child malnutrition in 3 seconds using AI',
    type: 'website',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  )
}
