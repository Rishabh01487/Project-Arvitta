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

      {/* Business Info */}
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
              <p className="text-xs font-semibold text-white/80">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change PIN */}
      <div className="glass p-5 mt-5 float-in fd-2">
        <h3 className="heading text-base mb-4">Change Transaction PIN</h3>
        {msg && <div className="p-3 rounded-xl text-xs mb-3 font-semibold" style={{ background: 'rgba(56, 189, 248, 0.08)', color: 'var(--color-av-blue-light)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>{msg}</div>}
        {err && <div className="p-3 rounded-xl text-xs mb-3 font-semibold" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-av-gray)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{err}</div>}
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
