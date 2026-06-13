'use client'

import { useState } from 'react'
import { useAuth } from '../providers'

export function SettingsView() {
  const { business, authFetch } = useAuth()
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const changePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(''); setErr('')
    if (!/^\d{4}$/.test(newPin)) { setErr('New PIN must be 4 digits'); return }
    try {
      const res = await authFetch('/api/auth/change-pin', { method: 'POST', body: JSON.stringify({ currentPin: oldPin, newPin }) })
      const d = await res.json()
      if (d.success) { setMsg('PIN changed successfully'); setOldPin(''); setNewPin('') }
      else setErr(d.error)
    } catch (e) { setErr('Network error'); console.error(e) }
  }

  return (
    <div>
      <div className="float-in">
        <h2 className="heading text-2xl">Settings</h2>
        <p className="body-text text-xs mt-0.5">Manage your business profile</p>
      </div>

      <div className="glass-crystal p-5 mt-5 float-in fd-1">
        <h3 className="heading text-base mb-4">Business Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Business Name', value: business?.name },
            { label: 'Owner', value: business?.ownerName },
            { label: 'Email', value: business?.email },
            { label: 'Phone', value: business?.phone },
            { label: 'Address', value: business?.address },
            { label: 'GSTIN', value: business?.gstin || '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="label mb-1">{item.label}</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-av-text-secondary)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-5 mt-5 float-in fd-2">
        <h3 className="heading text-base mb-4">Change Transaction PIN</h3>
        {msg && <div className="p-3 rounded-xl text-xs mb-3 font-semibold" style={{ background: 'var(--color-av-success-bg)', color: 'var(--color-av-success)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>{msg}</div>}
        {err && <div className="p-3 rounded-xl text-xs mb-3 font-semibold" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)', border: '1px solid rgba(220, 38, 38, 0.15)' }}>{err}</div>}
        <form onSubmit={changePin} className="flex flex-col gap-3.5 max-w-xs">
          <div>
            <label className="label block mb-1">Current PIN</label>
            <input type="password" className="av-input py-2 px-3 text-xs" maxLength={4} placeholder="••••" value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))} required />
          </div>
          <div>
            <label className="label block mb-1">New PIN</label>
            <input type="password" className="av-input py-2 px-3 text-xs" maxLength={4} placeholder="••••" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} required />
          </div>
          <button type="submit" className="av-btn av-btn-primary py-2 px-4 shine">Update PIN</button>
        </form>
      </div>
    </div>
  )
}
