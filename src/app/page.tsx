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
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')

  const handleDemo = async () => {
    setDemoLoading(true)
    setDemoError('')
    const res = await demoLogin()
    if (!res.success) {
      setDemoError(res.error || 'Demo login failed')
    }
    setDemoLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: 'var(--color-av-bg)' }}>
      <div className="bg-grid" />
      <div className="bg-orb-1" /><div className="bg-orb-2" /><div className="bg-orb-3" />

      <div className="w-full max-w-[400px] relative z-10 float-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 levitate"
            style={{ background: 'linear-gradient(135deg, var(--color-av-blue-light), var(--color-av-blue))', boxShadow: '0 6px 24px rgba(56,189,248,0.25)' }}>
            <span style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#090b11' }}>A</span>
          </div>
          <h1 className="heading text-3xl gradient-text">Arvitta</h1>
          <p className="body-text text-xs mt-1.5 opacity-80" style={{ fontFamily: 'var(--font-display)' }}>
            Intelligent Payment Orchestration
          </p>
        </div>

        {/* Crystal glass auth card */}
        <div className="glass-crystal p-6 text-center">
          {demoError && <div className="p-3 rounded-xl text-xs mb-3 font-semibold text-left" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-av-gray)', border: '1px solid rgba(255,255,255,0.1)' }}>{demoError}</div>}