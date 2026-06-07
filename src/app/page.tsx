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
          
          {/* Quick Demo Button */}
          <button type="button" onClick={handleDemo} className="av-btn av-btn-primary w-full py-3 mb-5 shine cursor-pointer" disabled={demoLoading}>
            {demoLoading ? <><div className="spinner"></div> Seeding workspace...</> : '🚀 Explore with Demo Data'}
          </button>
          
          <div className="flex items-center mb-5">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="px-3 text-[10px] uppercase tracking-wider text-white/30 font-bold">Or Authenticate</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* Tabs */}
          <div className="flex mb-5 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[{ val: true, label: 'Sign In' }, { val: false, label: 'Register' }].map(t => (
              <button key={t.label} onClick={() => setIsLogin(t.val)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: isLogin === t.val ? 'linear-gradient(135deg, var(--color-av-blue), var(--color-av-blue-deep))' : 'transparent',
                  color: isLogin === t.val ? '#fff' : 'var(--color-av-gray-dim)',
                  boxShadow: isLogin === t.val ? '0 4px 20px rgba(35,77,194,0.3)' : 'none',
                }}>{t.label}</button>
            ))}
          </div>

          {isLogin ? <LoginForm /> : <RegisterForm onSwitch={() => setIsLogin(true)} />}
        </div>
      </div>
    </div>
  )
}

function LoginForm() {