'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import { AppShell } from './components/AppShell'

export default function HomePage() {
  const { business, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-av-bg)' }}>
        <div className="bg-grid" />
        <div className="bg-orb-1" /><div className="bg-orb-2" />
        <div className="text-center float-in" style={{ position: 'relative', zIndex: 1 }}>
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center levitate"
            style={{ background: 'linear-gradient(135deg, var(--color-av-blue-light), var(--color-av-blue))', boxShadow: '0 6px 24px rgba(56,189,248,0.25)' }}>
            <span style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#090b11' }}>A</span>
          </div>
          <h1 className="heading text-xl gradient-text">Arvitta</h1>
          <p className="body-text text-xs mt-1.5">Loading your workspace...</p>
          <div className="spinner mx-auto mt-4"></div>
        </div>
      </div>
    )
  }

  if (!business) return <AuthPage />
  return <AppShell />
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { demoLogin } = useAuth()