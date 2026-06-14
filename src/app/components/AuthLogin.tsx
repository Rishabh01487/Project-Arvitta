'use client'

import { useState } from 'react'
import { useAuth } from '../providers'

export function AuthLogin() {
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      <div>
        <div className="subtitle" style={{ fontSize: 10, marginBottom: 5, fontWeight: 600 }}>Email Address</div>
        <input
          type="email"
          className="av-input"
          placeholder="you@business.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          style={{ padding: '10px 14px' }}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div className="subtitle" style={{ fontSize: 10, fontWeight: 600 }}>Password</div>
        </div>
        <input
          type="password"
          className="av-input"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: '10px 14px' }}
        />
      </div>

      <button
        type="submit"
        className="av-btn av-btn-primary"
        disabled={loading}
        style={{ width: '100%', padding: '11px 0', marginTop: 4, fontSize: 13 }}
      >
        {loading ? <><div className="spinner"></div> Signing in...</> : 'Sign In'}
      </button>
    </form>
  )
}
