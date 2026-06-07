import type { Metadata } from 'next'
import { AuthProvider } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arvitta — Intelligent Payment Orchestration',
  description: 'Premium payment automation for businesses. Smart ledger, auto-matching, batch payouts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
