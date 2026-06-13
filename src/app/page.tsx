'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import { AppShell } from './components/AppShell'

export default function HomePage() {
  const { business, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-av-bg)' }}>
        <div className="bg-orb-1" /><div className="bg-orb-2" />
        <div className="text-center float-in" style={{ position: 'relative', zIndex: 1 }}>
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center levitate"
            style={{ background: 'linear-gradient(135deg, var(--color-av-accent), #4338ca)', boxShadow: '0 6px 24px rgba(79, 70, 229, 0.25)' }}>
            <span style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff' }}>A</span>
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
      <div className="bg-orb-1" /><div className="bg-orb-2" /><div className="bg-orb-3" />

      <div className="w-full max-w-[400px] relative z-10 float-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 levitate"
            style={{ background: 'linear-gradient(135deg, var(--color-av-accent), #4338ca)', boxShadow: '0 6px 24px rgba(79, 70, 229, 0.25)' }}>
            <span style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff' }}>A</span>
          </div>
          <h1 className="heading text-3xl gradient-text">Arvitta</h1>
          <p className="body-text text-xs mt-1.5">
            Intelligent Payment Orchestration
          </p>
        </div>

        <div className="glass-crystal p-6 text-center">
          {demoError && <div className="p-3 rounded-xl text-xs mb-3 font-semibold text-left" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)', border: '1px solid rgba(220, 38, 38, 0.15)' }}>{demoError}</div>}

          <button type="button" onClick={handleDemo} className="av-btn av-btn-primary w-full py-3 mb-5 shine" disabled={demoLoading}>
            {demoLoading ? <><div className="spinner"></div> Seeding workspace...</> : 'Explore with Demo Data'}
          </button>

          <div className="flex items-center mb-5">
            <div className="flex-1 h-[1px]" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <span className="px-3 text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-av-text-muted)' }}>Or Authenticate</span>
            <div className="flex-1 h-[1px]" style={{ background: 'rgba(0,0,0,0.06)' }} />
          </div>

          <div className="flex mb-5 rounded-xl overflow-hidden" style={{ background: 'var(--color-av-bg)', border: '1px solid var(--color-av-glass-border)' }}>
            {[{ val: true, label: 'Sign In' }, { val: false, label: 'Register' }].map(t => (
              <button key={t.label} onClick={() => setIsLogin(t.val)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: isLogin === t.val ? 'linear-gradient(135deg, var(--color-av-accent), #4338ca)' : 'transparent',
                  color: isLogin === t.val ? '#fff' : 'var(--color-av-text-muted)',
                  boxShadow: isLogin === t.val ? '0 4px 20px rgba(79, 70, 229, 0.3)' : 'none',
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
    e.preventDefault(); setError(''); setLoading(true)
    const res = await login(email, password)
    if (!res.success) setError(res.error || 'Login failed')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      {error && <div className="p-2.5 rounded-xl text-xs font-semibold" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)', border: '1px solid rgba(220, 38, 38, 0.15)' }}>{error}</div>}
      <div><label className="label block mb-1.5">Email</label><input type="email" className="av-input py-2 px-3 text-xs" placeholder="you@business.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      <div><label className="label block mb-1.5">Password</label><input type="password" className="av-input py-2 px-3 text-xs" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
      <button type="submit" className="av-btn av-btn-primary w-full py-2.5 mt-0.5" disabled={loading}>
        {loading ? <><div className="spinner"></div> Signing in...</> : 'Sign In \u2192'}
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
    e.preventDefault(); setError('')
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) { setError('PIN must be 4 digits'); return }
    setLoading(true)
    const res = await register(form)
    if (!res.success) setError(res.error || 'Registration failed')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
      {error && <div className="p-2.5 rounded-xl text-xs font-semibold" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)', border: '1px solid rgba(220, 38, 38, 0.15)' }}>{error}</div>}
      <div className="grid grid-cols-2 gap-2.5">
        <div><label className="label block mb-1">Business Name</label><input className="av-input py-1.5 px-2.5 text-xs" placeholder="Agri Fresh Foods" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
        <div><label className="label block mb-1">Owner</label><input className="av-input py-1.5 px-2.5 text-xs" placeholder="Rajesh Kumar" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div><label className="label block mb-1">Email</label><input type="email" className="av-input py-1.5 px-2.5 text-xs" placeholder="you@biz.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
        <div><label className="label block mb-1">Phone</label><input className="av-input py-1.5 px-2.5 text-xs" placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
      </div>
      <div><label className="label block mb-1">Address</label><input className="av-input py-1.5 px-2.5 text-xs" placeholder="MIDC, Pune, Maharashtra" value={form.address} onChange={e => set('address', e.target.value)} required /></div>
      <div className="grid grid-cols-3 gap-2.5">
        <div><label className="label block mb-1">Password</label><input type="password" className="av-input py-1.5 px-2.5 text-xs" placeholder="••••••" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
        <div><label className="label block mb-1">4-Digit PIN</label><input className="av-input py-1.5 px-2.5 text-xs" placeholder="1234" maxLength={4} value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g, ''))} required /></div>
        <div><label className="label block mb-1">GSTIN</label><input className="av-input py-1.5 px-2.5 text-xs" placeholder="Optional" value={form.gstin} onChange={e => set('gstin', e.target.value)} /></div>
      </div>
      <button type="submit" className="av-btn av-btn-primary w-full py-2.5 mt-1" disabled={loading}>
        {loading ? <><div className="spinner"></div> Creating...</> : 'Create Account \u2192'}
      </button>
      <p className="text-center text-xs mt-1" style={{ color: 'var(--color-av-text-secondary)' }}>
        Already have an account? <button type="button" onClick={onSwitch} style={{ color: 'var(--color-av-accent)', fontWeight: 700 }}>Sign In</button>
      </p>
    </form>
  )
}
