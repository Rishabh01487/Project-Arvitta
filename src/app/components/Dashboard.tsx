'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Stats { totalDue: number; supplierCount: number; suppliersWithDue: number }
interface AutoMatch { balance: number; suggestedSuppliers: { _id: string; name: string; priority: string; totalDue: number; suggestedAmount: number }[]; totalPayout: number; remainingBalance: number }
interface CreditEvent { _id: string; amount: number; source: string; balanceAfter: number; createdAt: string }

export function DashboardView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { account, business, authFetch, refreshAccount } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [suggestions, setSuggestions] = useState<AutoMatch | null>(null)
  const [creditEvents, setCreditEvents] = useState<CreditEvent[]>([])
  const [showCredit, setShowCredit] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [crediting, setCrediting] = useState(false)
  const [toast, setToast] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [a, s, c] = await Promise.all([authFetch('/api/account'), authFetch('/api/payments/suggest'), authFetch('/api/account/credit-history?limit=5')])
      if (a.ok) { const d = await a.json(); setStats(d.stats) }
      if (s.ok) { const d = await s.json(); setSuggestions(d) }
      if (c.ok) { const d = await c.json(); setCreditEvents(d.events) }
    } catch (e) { console.error(e) }
  }, [authFetch])

  useEffect(() => { loadData() }, [loadData])

  const handleCredit = async () => {
    const amt = parseInt(creditAmount)
    if (!amt || amt < 1) return
    setCrediting(true)
    try {
      const res = await authFetch('/api/account', { method: 'POST', body: JSON.stringify({ amount: amt, source: 'Bank Transfer' }) })
      const data = await res.json()
      if (data.success) { setToast(data.notification); setCreditAmount(''); setShowCredit(false); await refreshAccount(); await loadData(); setTimeout(() => setToast(''), 5000) }
    } catch (e) { console.error(e) }
    setCrediting(false)
  }

  const [seeding, setSeeding] = useState(false)
  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await authFetch('/api/demo/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setToast('Demo workspace populated successfully!')
        await refreshAccount()
        await loadData()
        setTimeout(() => setToast(''), 5000)
      }
    } catch (e) {
      console.error(e)
    }
    setSeeding(false)
  }

  const quickAmounts = [100000, 250000, 500000, 750000, 1000000, 1500000]
  const fmtCur = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  return (
    <div>
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm p-4 rounded-2xl toast-in" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(56,189,248,0.04))', backdropFilter: 'blur(20px)', border: '1px solid rgba(56,189,248,0.2)', color: 'var(--color-av-white)' }}>
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>💰 {toast}</p>
          <button onClick={() => setToast('')} className="absolute top-2 right-3 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 float-in">
        <div>