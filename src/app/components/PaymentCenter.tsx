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
  const fmtCur = (n: number) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

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
                background: success === results.length ? 'var(--color-av-success-bg)' : 'var(--color-av-bg)',
                border: `1px solid ${success === results.length ? 'rgba(5, 150, 105, 0.2)' : 'var(--color-av-glass-border)'}`,
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
                  <p className="text-xs font-bold" style={{ color: 'var(--color-av-text)' }}>{r.supplier}</p>
                  <p className="body-text text-[11px] mt-0.5">
                    {r.method} · Ref: {r.referenceId || '—'} · UTR: {r.utr || '—'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--color-av-text)' }}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        <div className="glass-card p-3.5 float-in fd-1">
          <p className="label mb-1">Available</p>
          <p className="stat-num text-lg mt-0.5" style={{ color: 'var(--color-av-text)' }}>{fmtCur(account?.balance ?? 0)}</p>
        </div>
        <div className="glass-card p-3.5 float-in fd-2">
          <p className="label mb-1">Selected</p>
          <p className="stat-num text-lg mt-0.5" style={{ color: 'var(--color-av-accent)' }}>{selectedCount} · {fmtCur(totalSelected)}</p>
        </div>
        <div className="glass-card p-3.5 float-in fd-3">
          <p className="label mb-1">After Payment</p>
          <p className="stat-num text-lg mt-0.5" style={{ color: afterPayment >= 0 ? 'var(--color-av-text)' : 'var(--color-av-text-muted)' }}>{fmtCur(afterPayment)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="spinner mx-auto mb-3"></div><p className="body-text text-xs">Loading suggestions...</p></div>
      ) : suggestions.length === 0 ? (
        <div className="glass p-8 text-center float-in fd-1">
          <p className="body-text text-xs font-semibold">No suppliers with dues or insufficient balance</p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {suggestions.map((s, i) => {
              const isSelected = !!selected[s._id]
              return (
                <div key={s._id} className={`glass-card p-4 transition-all float-in fd-${Math.min(i + 1, 4)}`}
                  style={{
                    borderColor: isSelected ? 'var(--color-av-accent-border)' : undefined,
                    boxShadow: isSelected ? '0 0 20px rgba(79, 70, 229, 0.06)' : undefined,
                  }}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSelect(s._id, s)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, var(--color-av-accent), #4338ca)' : 'var(--color-av-bg)',
                        border: `1px solid ${isSelected ? 'var(--color-av-accent-border)' : 'var(--color-av-glass-border)'}`,
                        color: '#fff',
                        fontSize: '11px',
                      }}>
                      {isSelected ? '✓' : ''}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold truncate" style={{ color: 'var(--color-av-text)' }}>{s.name}</span>
                        <span className={`badge badge-${s.priority}`}>{s.priority}</span>
                      </div>
                      <p className="body-text text-[11px] truncate">
                        {s.phone} · Due: {fmtCur(s.totalDue)} · {s.bankDetails.bankName} · {s.upiId || 'No UPI'}
                      </p>
                      {isSelected && (
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {methods.map(m => (
                            <button key={m} onClick={() => setSelected(p => ({ ...p, [s._id]: { ...p[s._id], method: m } }))}
                              className={`method-pill method-${m.toLowerCase()} transition-all`}
                              style={{
                                opacity: selected[s._id]?.method === m ? 1 : 0.4,
                                border: selected[s._id]?.method === m ? '1px solid var(--color-av-accent-border)' : '1px solid transparent',
                              }}>
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <input type="number" className="av-input w-24 text-right py-1 px-2 text-xs" value={selected[s._id]?.amount ?? 0}
                        onChange={e => setSelected(p => ({ ...p, [s._id]: { ...p[s._id], amount: parseInt(e.target.value) || 0 } }))} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {selectedCount > 0 && (
            <button className="av-btn av-btn-primary w-full py-3 mt-5 text-sm shine"
              onClick={() => setShowPin(true)} disabled={totalSelected <= 0 || totalSelected > (account?.balance ?? 0)}>
              Pay {selectedCount} Supplier(s) — {fmtCur(totalSelected)}
            </button>
          )}
        </>
      )}

      {showPin && (
        <div className="modal-overlay" onClick={() => { setShowPin(false); setPin('') }}>
          <div className="modal-content" style={{ padding: '20px', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3.5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'var(--color-av-accent-bg)',
                  border: '1px solid var(--color-av-accent-border)',
                }}>
                <span className="text-xl">🔐</span>
              </div>
              <h3 className="heading text-base">Authorize Payment</h3>
              <p className="body-text text-xs mt-1.5">
                Confirm {fmtCur(totalSelected)} to {selectedCount} supplier(s)
              </p>
            </div>
            {error && <div className="p-2.5 rounded-xl text-xs mb-3 font-semibold" style={{ background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)', border: '1px solid rgba(220, 38, 38, 0.15)' }}>{error}</div>}
            <input className="av-input text-center text-xl tracking-[0.5em] mb-4 py-2" type="password" maxLength={4} placeholder="• • • •"
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} autoFocus />
            <button className="av-btn av-btn-primary w-full py-2.5" onClick={executePay} disabled={pin.length !== 4 || paying}>
              {paying ? <><div className="spinner"></div> Processing...</> : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
