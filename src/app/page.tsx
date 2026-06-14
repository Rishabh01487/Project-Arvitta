'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import { AppShell } from './components/AppShell'
import { AuthLogin } from './components/AuthLogin'
import { AuthRegister } from './components/AuthRegister'

export default function HomePage() {
  const { business, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-av-bg)' }}>
        <div className="text-center float-in">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--color-av-accent)' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>A</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Arvitta</div>
          <div className="subtitle mt-1">Loading your workspace...</div>
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
    if (!res.success) setDemoError(res.error || 'Demo login failed')
    setDemoLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-av-bg)' }}>
      <div className="w-full max-w-[380px] float-in">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
            style={{ background: 'var(--color-av-accent)' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>A</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Arvitta</div>
          <div className="subtitle mt-1">Intelligent Payment Orchestration</div>
        </div>

        <div className="glass p-6">
          {demoError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold mb-3" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)' }}>
              {demoError}
            </div>
          )}

          <button onClick={handleDemo} className="av-btn av-btn-primary w-full py-3 mb-4" disabled={demoLoading}>
            {demoLoading ? <><div className="spinner"></div> Seeding...</> : 'Explore with Demo Data'}
          </button>

          <div className="flex items-center mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--color-av-gray-200)' }} />
            <span className="px-3" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-av-text-muted)' }}>Or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-av-gray-200)' }} />
          </div>

          <div className="flex rounded-lg overflow-hidden mb-4" style={{ background: 'var(--color-av-gray-100)' }}>
            {[{ val: true, label: 'Sign In' }, { val: false, label: 'Register' }].map(t => (
              <button key={t.label} onClick={() => setIsLogin(t.val)}
                className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all"
                style={{
                  background: isLogin === t.val ? 'var(--color-av-accent)' : 'transparent',
                  color: isLogin === t.val ? '#fff' : 'var(--color-av-text-muted)',
                }}>{t.label}</button>
            ))}
          </div>

          {isLogin ? <AuthLogin /> : <AuthRegister onSwitch={() => setIsLogin(true)} />}
        </div>
      </div>
    </div>
  )
}


