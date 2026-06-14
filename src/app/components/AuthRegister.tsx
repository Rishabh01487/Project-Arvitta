'use client'

import { useState } from 'react'
import { useAuth } from '../providers'

interface Props { onSwitch: () => void }

export function AuthRegister({ onSwitch }: Props) {
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Business Info */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-accent)', marginBottom: 10 }}>Business Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Business Name</div>
              <input className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="Agri Fresh Foods" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Owner Name</div>
              <input className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="Rajesh Kumar" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} required />
            </div>
          </div>
          <div>
            <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Address</div>
            <input className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="MIDC Industrial Area, Pune" value={form.address} onChange={e => set('address', e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-accent)', marginTop: 4, marginBottom: 10 }}>Contact Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Email</div>
            <input type="email" className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div>
            <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Phone</div>
            <input className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Security */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-accent)', marginTop: 4, marginBottom: 10 }}>Security</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Password</div>
            <input type="password" className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="Min 6 chars" value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>
          <div>
            <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>PIN (4 digits)</div>
            <input className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="1234" maxLength={4} value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g, ''))} required />
          </div>
          <div>
            <div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>GSTIN</div>
            <input className="av-input" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="Optional" value={form.gstin} onChange={e => set('gstin', e.target.value)} />
          </div>
        </div>
      </div>

      <button type="submit" className="av-btn av-btn-primary" disabled={loading} style={{ width: '100%', padding: '11px 0', marginTop: 4, fontSize: 13 }}>
        {loading ? <><div className="spinner"></div> Creating account...</> : 'Create Account'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-av-text-secondary)' }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} style={{ color: 'var(--color-av-accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
          Sign In
        </button>
      </p>
    </form>
  )
}
