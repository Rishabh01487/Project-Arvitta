'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Suggestion { _id: string; name: string; priority: string; totalDue: number; suggestedAmount: number; bankDetails: { bankName: string }; upiId?: string; phone: string }
interface PayResult { supplier: string; supplierId: string; amount: number; status: string; method: string; referenceId?: string; utr?: string; error?: string }

export function PaymentView() {
  const { account, authFetch, refreshAccount } = useAuth()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Record<string, { amount: number; method: string }>>({})
  const [loading, setLoading] = useState(true)
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [paying, setPaying] = useState(false)
  const [results, setResults] = useState<PayResult[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/payments/suggest')
      if (res.ok) {
        const d = await res.json()
        setSuggestions(d.suggestedSuppliers || [])
        const sel: Record<string, { amount: number; method: string }> = {}
        d.suggestedSuppliers?.forEach((s: Suggestion) => { sel[s._id] = { amount: s.suggestedAmount, method: s.upiId ? 'UPI' : 'NEFT' } })
        setSelected(sel)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [authFetch])

  useEffect(() => { load() }, [load])

  const toggleSelect = (id: string, s: Suggestion) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = { amount: s.suggestedAmount, method: s.upiId ? 'UPI' : 'NEFT' }
      return next
    })
  }

  const totalSelected = Object.values(selected).reduce((a, b) => a + b.amount, 0)
  const selectedCount = Object.keys(selected).length
  const afterPayment = (account?.balance ?? 0) - totalSelected
  const fmtCur = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  const executePay = async () => {
    setPaying(true); setError('')
    const payments = Object.entries(selected).map(([supplierId, { amount, method }]) => ({ supplierId, amount, method }))
    try {
      const res = await authFetch('/api/payments/execute', { method: 'POST', body: JSON.stringify({ payments, pin }) })
      const data = await res.json()
      if (data.results) { setResults(data.results); setShowPin(false); setPin(''); await refreshAccount() }
      else setError(data.error || 'Payment failed')
    } catch (e) { setError('Network error'); console.error(e) }
    setPaying(false)
  }

  const methods = ['UPI', 'NEFT', 'RTGS', 'IMPS']

  if (results) {
    const success = results.filter(r => r.status === 'completed').length
    const total = results.reduce((a, r) => a + (r.status === 'completed' ? r.amount : 0), 0)
    return (
      <div className="float-in">
        <h2 className="heading text-2xl mb-6">Payment Results</h2>
        <div className="glass p-5 mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: success === results.length ? 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(56,189,248,0.04))' : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: `1px solid ${success === results.length ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              <span className="text-xl">{success === results.length ? '✓' : '⚠'}</span>
            </div>
            <div>
              <p className="heading text-base">{success} of {results.length} payments successful</p>
              <p className="body-text text-xs mt-0.5">Total paid: {fmtCur(total)}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {results.map((r, i) => (
            <div key={i} className={`glass-card p-4 flex items-center justify-between float-in fd-${Math.min(i + 1, 4)}`}>
              <div className="flex items-center gap-3">
                <span className="text-base">{r.status === 'completed' ? '✅' : '❌'}</span>
                <div>
                  <p className="text-xs font-bold text-white/90">{r.supplier}</p>
                  <p className="body-text text-[11px] mt-0.5">
                    {r.method} · Ref: {r.referenceId || '—'} · UTR: {r.utr || '—'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold" style={{ color: r.status === 'completed' ? 'var(--color-av-white)' : 'var(--color-av-gray)' }}>
                {fmtCur(r.amount)}
              </span>
            </div>
          ))}
        </div>
        <button className="av-btn av-btn-primary mt-5 shine" onClick={() => { setResults(null); load() }}>
          ← Back to Payment Center
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="float-in">
        <h2 className="heading text-2xl">Payment Center</h2>
        <p className="body-text text-xs mt-0.5">Select suppliers and payment methods to initiate batch payouts</p>
      </div>

      {/* Balance Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        <div className="glass-card p-3.5 float-in fd-1">
          <p className="label mb-1">Available</p>
          <p className="stat-num text-lg mt-0.5" style={{ color: 'var(--color-av-white)' }}>{fmtCur(account?.balance ?? 0)}</p>
        </div>
        <div className="glass-card p-3.5 float-in fd-2">
          <p className="label mb-1">Selected</p>
          <p className="stat-num text-lg mt-0.5" style={{ color: 'var(--color-av-blue-light)' }}>{selectedCount} · {fmtCur(totalSelected)}</p>
        </div>
        <div className="glass-card p-3.5 float-in fd-3">
          <p className="label mb-1">After Payment</p>
          <p className="stat-num text-lg mt-0.5" style={{ color: afterPayment >= 0 ? 'var(--color-av-white)' : 'var(--color-av-gray)' }}>{fmtCur(afterPayment)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="spinner mx-auto mb-3"></div><p className="body-text text-xs">Loading suggestions...</p></div>
      ) : suggestions.length === 0 ? (
        <div className="glass p-8 text-center float-in fd-1">
          <p className="text-3xl mb-2.5" style={{ color: 'var(--color-av-blue-light)' }}>◈</p>
          <p className="body-text text-xs font-semibold">No suppliers with dues or insufficient balance</p>
        </div>
      ) : (