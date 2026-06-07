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
