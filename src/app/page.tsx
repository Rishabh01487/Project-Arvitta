'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import { AppShell } from './components/AppShell'

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

          {isLogin ? <LoginForm /> : <RegisterForm onSwitch={() => setIsLogin(true)} />}
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await login(email, password)
    if (!res.success) setError(res.error || 'Login failed')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <div className="p-2.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)' }}>{error}</div>}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Email</div>
        <input type="email" className="av-input" placeholder="you@business.com" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Password</div>
        <input type="password" className="av-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="av-btn av-btn-primary w-full py-2.5 mt-1" disabled={loading}>
        {loading ? <><div className="spinner"></div> Signing in...</> : 'Sign In'}
      </button>
    </form>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', ownerName: '', email: '', phone: '', password: '', pin: '', address: '', gstin: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) { setError('PIN must be 4 digits'); return }
    setLoading(true)
    const res = await register(form)
    if (!res.success) setError(res.error || 'Registration failed')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <div className="p-2.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Business</div><input className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="Name" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
        <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Owner</div><input className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="Name" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} required /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Email</div><input type="email" className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="you@biz.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
        <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Phone</div><input className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
      </div>
      <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Address</div><input className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="MIDC, Pune" value={form.address} onChange={e => set('address', e.target.value)} required /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>Password</div><input type="password" className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="•••••" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
        <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>PIN</div><input className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="1234" maxLength={4} value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g, ''))} required /></div>
        <div><div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)', marginBottom: 4 }}>GSTIN</div><input className="av-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="Optional" value={form.gstin} onChange={e => set('gstin', e.target.value)} /></div>
      </div>
      <button type="submit" className="av-btn av-btn-primary w-full py-2.5 mt-1" disabled={loading}>
        {loading ? <><div className="spinner"></div> Creating...</> : 'Create Account'}
      </button>
      <p className="text-center" style={{ fontSize: 12, color: 'var(--color-av-text-secondary)' }}>
        Already have an account? <button type="button" onClick={onSwitch} style={{ color: 'var(--color-av-accent)', fontWeight: 700 }}>Sign In</button>
      </p>
    </form>
  )
}
