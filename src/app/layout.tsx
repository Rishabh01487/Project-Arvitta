import type { Metadata } from 'next'
import { AuthProvider } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arvitta — Intelligent Payment Orchestration',
  description: 'Premium payment automation for businesses. Smart ledger, auto-matching, batch payouts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (