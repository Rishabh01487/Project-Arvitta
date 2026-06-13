'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../providers'

export function SettingsView() {
  const { business, authFetch, refreshProfile } = useAuth()
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [pinErr, setPinErr] = useState('')

  const [ownerName, setOwnerName] = useState('')
  const [address, setAddress] = useState('')
  const [gstin, setGstin] = useState('')

  const [criticalWeight, setCriticalWeight] = useState(100)
  const [highWeight, setHighWeight] = useState(75)
  const [mediumWeight, setMediumWeight] = useState(50)
  const [lowWeight, setLowWeight] = useState(25)
  const [enableFractional, setEnableFractional] = useState(false)
  const [fractionalThreshold, setFractionalThreshold] = useState(50)

  const [settingsMsg, setSettingsMsg] = useState('')
  const [settingsErr, setSettingsErr] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (business) {
      setOwnerName(business.ownerName || '')
      setAddress(business.address || '')
      setGstin(business.gstin || '')
      const w = (business as any).autoMatchSettings?.priorityWeights || {}
      setCriticalWeight(w.critical ?? 100); setHighWeight(w.high ?? 75)
      setMediumWeight(w.medium ?? 50); setLowWeight(w.low ?? 25)
      setEnableFractional(!!(business as any).autoMatchSettings?.enableFractional)
      setFractionalThreshold((business as any).autoMatchSettings?.fractionalThreshold ?? 50)
    }
  }, [business])

  const changePin = async (e: React.FormEvent) => {
    e.preventDefault(); setPinMsg(''); setPinErr('')
    if (!/^\d{4}$/.test(newPin)) { setPinErr('PIN must be 4 digits'); return }
    try {
      const res = await authFetch('/api/auth/change-pin', { method: 'POST', body: JSON.stringify({ currentPin: oldPin, newPin }) })
      const d = await res.json()
      if (d.success) { setPinMsg('PIN changed'); setOldPin(''); setNewPin('') } else { setPinErr(d.error) }
    } catch { setPinErr('Network error') }
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setSettingsMsg(''); setSettingsErr(''); setSavingSettings(true)
    try {
      const res = await authFetch('/api/auth/settings', {
        method: 'POST',
        body: JSON.stringify({
          ownerName, address, gstin,
          autoMatchSettings: {
            priorityWeights: { critical: criticalWeight, high: highWeight, medium: mediumWeight, low: lowWeight },
            enableFractional, fractionalThreshold,
          },
        }),
      })
      const d = await res.json()
      if (d.success) { setSettingsMsg('Settings saved'); await refreshProfile() } else { setSettingsErr(d.error || 'Failed') }
    } catch { setSettingsErr('Network error') }
    setSavingSettings(false)
  }

  return (
    <div className="page-wrap">
      <div className="float-in" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Settings</div>
        <div className="subtitle" style={{ marginTop: 2 }}>Profile, auto-match engine, and security</div>
      </div>

      <form onSubmit={saveSettings} className="float-in d1 card" style={{ padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Corporate Profile</div>
        {settingsMsg && <div style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, marginBottom: 12, background: 'var(--color-av-success-bg)', color: 'var(--color-av-success)' }}>{settingsMsg}</div>}
        {settingsErr && <div style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, marginBottom: 12, background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)' }}>{settingsErr}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Business Name</div><input className="av-input" style={{ opacity: 0.5 }} value={business?.name || ''} disabled /></div>
          <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Owner</div><input className="av-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} required /></div>
          <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Email</div><input className="av-input" style={{ opacity: 0.5 }} value={business?.email || ''} disabled /></div>
          <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>GSTIN</div><input className="av-input" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="27AAAAA1111A1Z1" /></div>
        </div>
        <div style={{ marginBottom: 20 }}><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Address</div><input className="av-input" value={address} onChange={e => setAddress(e.target.value)} required /></div>

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Auto-Match Engine</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'Critical', val: criticalWeight, set: setCriticalWeight },
            { label: 'High', val: highWeight, set: setHighWeight },
            { label: 'Medium', val: mediumWeight, set: setMediumWeight },
            { label: 'Low', val: lowWeight, set: setLowWeight },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-av-text-secondary)' }}>{s.label}</span>
                <span style={{ fontWeight: 700 }}>{s.val}</span>
              </div>
              <input type="range" min="0" max="100" value={s.val} onChange={e => s.set(parseInt(e.target.value))}
                style={{ width: '100%', height: 4, borderRadius: 4, cursor: 'pointer', accentColor: 'var(--color-av-accent)' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--color-av-gray-100)' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)' }}>Fractional Matching</div>
            <div className="subtitle" style={{ fontSize: 10 }}>Allow partial payments</div>
          </div>
          <button type="button" onClick={() => setEnableFractional(!enableFractional)}
            style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative', border: 'none', padding: 2, transition: 'all 0.15s', background: enableFractional ? 'var(--color-av-accent)' : 'var(--color-av-gray-300)' }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transform: enableFractional ? 'translateX(18px)' : 'translateX(0)' }} />
          </button>
        </div>

        {enableFractional && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--color-av-text-secondary)' }}>Threshold</span>
              <span style={{ fontWeight: 700 }}>{fractionalThreshold}%</span>
            </div>
            <input type="range" min="10" max="90" step="5" value={fractionalThreshold} onChange={e => setFractionalThreshold(parseInt(e.target.value))}
              style={{ width: '100%', height: 4, borderRadius: 4, cursor: 'pointer', accentColor: 'var(--color-av-accent)' }} />
          </div>
        )}

        <button type="submit" className="av-btn av-btn-primary" style={{ width: '100%', padding: '11px 0', marginTop: 16 }} disabled={savingSettings}>
          {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <div className="float-in d2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Change PIN</div>
          {pinMsg && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, background: 'var(--color-av-success-bg)', color: 'var(--color-av-success)' }}>{pinMsg}</div>}
          {pinErr && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)' }}>{pinErr}</div>}
          <form onSubmit={changePin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="password" className="av-input" maxLength={4} placeholder="Current PIN" value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))} required />
            <input type="password" className="av-input" maxLength={4} placeholder="New PIN" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} required />
            <button type="submit" className="av-btn av-btn-primary" style={{ width: '100%', padding: '9px 0' }}>Update PIN</button>
          </form>
        </div>

        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Security</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Match Engine', status: 'Active' },
              { label: 'Transaction Logging', status: 'Online' },
              { label: 'TDS/GST Layer', status: 'Verified' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-av-gray-50)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--color-av-text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-av-success)' }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
