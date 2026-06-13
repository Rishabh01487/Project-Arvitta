'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Suggestion {
  _id: string; name: string; priority: string; totalDue: number; suggestedAmount: number
  bankDetails: { bankName: string }; upiId?: string; phone: string
  isPartial?: boolean; percentagePaid?: number; tdsRate?: number; gstin?: string
}

interface PayResult {
  supplier: string; amount: number; netAmount: number; tdsAmount: number
  status: string; method: string; referenceId?: string; utr?: string; error?: string
}

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

  const grossTotal = Object.entries(selected).reduce((sum, [, item]) => sum + item.amount, 0)
  const selectedCount = Object.keys(selected).length
  const totalNet = Math.round(grossTotal * 0.98)
  const totalTds = grossTotal - totalNet
  const fmtCur = (n: number) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

  const executePay = async () => {
    setPaying(true); setError('')
    const payments = Object.entries(selected).map(([supplierId, { amount, method }]) => ({ supplierId, amount, method }))
    try {
      const res = await authFetch('/api/payments/execute', {
        method: 'POST', body: JSON.stringify({ payments, pin }),
      })
      const data = await res.json()
      if (data.results) { setResults(data.results); setShowPin(false); setPin(''); await refreshAccount() }
      else { setError(data.error || 'Payment failed') }
    } catch (e) { setError('Network error') }
    setPaying(false)
  }

  if (results) {
    const success = results.filter(r => r.status === 'completed').length
    return (
      <div className="page-wrap">
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 20 }}>Payment Results</div>
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: success === results.length ? 'var(--color-av-success-bg)' : 'var(--color-av-accent-bg)' }}>
            <span style={{ fontSize: 16 }}>{success === results.length ? '✓' : '⚠'}</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{success} of {results.length} successful</div>
            <div className="subtitle" style={{ marginTop: 1 }}>Batch completed</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map((r, i) => (
            <div key={i} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14 }}>{r.status === 'completed' ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{r.supplier}</div>
                  <div className="subtitle" style={{ fontSize: 10 }}>{r.method} · Ref: {r.referenceId || '—'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{fmtCur(r.netAmount || r.amount)}</div>
                <div className="subtitle" style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700 }}>Net</div>
              </div>
            </div>
          ))}
        </div>
        <button className="av-btn av-btn-primary" style={{ marginTop: 20 }} onClick={() => { setResults(null); load() }}>← Back</button>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <div className="float-in" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Pay Now</div>
        <div className="subtitle" style={{ marginTop: 2 }}>Select suppliers and execute batch payout</div>
      </div>

      {/* metrics */}
      <div className="float-in d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="stat-lbl">Balance</div>
          <div className="stat-num" style={{ fontSize: '1.1rem' }}>{fmtCur(account?.balance ?? 0)}</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="stat-lbl">Selected</div>
          <div className="stat-num" style={{ fontSize: '1.1rem' }}>{selectedCount}</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="stat-lbl">Gross</div>
          <div className="stat-num" style={{ fontSize: '1.1rem' }}>{fmtCur(grossTotal)}</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="stat-lbl">Net Payout</div>
          <div className="stat-num" style={{ fontSize: '1.1rem', color: (account?.balance ?? 0) >= totalNet ? 'var(--color-av-accent)' : 'var(--color-av-danger)' }}>{fmtCur(totalNet)}</div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          <div className="subtitle">Loading suggestions...</div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card" style={{ padding: '40px 0', textAlign: 'center' }}>
          <div className="subtitle">No suppliers with dues or insufficient balance</div>
        </div>
      ) : (
        <div className="float-in d2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {suggestions.map(s => {
            const isSelected = !!selected[s._id]
            return (
              <div key={s._id} className="card" style={{
                padding: '14px 18px',
                borderColor: isSelected ? 'var(--color-av-accent-border)' : undefined,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => toggleSelect(s._id, s)}
                    style={{
                      width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                      background: isSelected ? 'var(--color-av-accent)' : 'var(--color-av-gray-100)',
                      color: '#fff', fontSize: 10, transition: 'all 0.1s',
                    }}>
                    {isSelected ? '✓' : ''}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                      <span className={`badge badge-${s.priority}`}>{s.priority}</span>
                    </div>
                    <div className="subtitle" style={{ fontSize: 10 }}>{s.bankDetails.bankName} · {s.upiId || 'No UPI'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{fmtCur(s.suggestedAmount)}</div>
                    <div className="subtitle" style={{ fontSize: 9 }}>Suggested</div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-av-gray-100)' }}>
                    {['UPI', 'NEFT', 'RTGS', 'IMPS'].map(m => (
                      <button key={m} onClick={() => setSelected(p => ({ ...p, [s._id]: { ...p[s._id], method: m } }))}
                        className={`m-pill m-${m.toLowerCase()}`}
                        style={{ opacity: selected[s._id]?.method === m ? 1 : 0.35, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                        {m}
                      </button>
                    ))}
                    <input type="number" className="av-input" style={{ width: 80, marginLeft: 'auto', padding: '4px 8px', fontSize: 11, textAlign: 'right' }}
                      value={selected[s._id]?.amount ?? 0}
                      onChange={e => setSelected(p => ({ ...p, [s._id]: { ...p[s._id], amount: parseInt(e.target.value) || 0 } }))} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="float-in d3" style={{ marginTop: 20 }}>
          <button className="av-btn av-btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 13 }}
            onClick={() => setShowPin(true)}
            disabled={totalNet <= 0 || totalNet > (account?.balance ?? 0)}>
            Pay {selectedCount} Supplier(s) — {fmtCur(totalNet)} net
          </button>
        </div>
      )}

      {showPin && (
        <div className="modal-wrap" onClick={() => { setShowPin(false); setPin('') }}>
          <div className="modal-box" style={{ maxWidth: '340px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, margin: '0 auto 12px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-av-accent-bg)' }}>
                <span style={{ fontSize: 16 }}>🔐</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Authorize Payout</div>
              <div className="subtitle" style={{ marginTop: 4 }}>Net: {fmtCur(totalNet)}</div>
            </div>
            {error && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, background: 'var(--color-av-danger-bg)', color: 'var(--color-av-danger)' }}>{error}</div>}
            <input className="av-input" style={{ textAlign: 'center', fontSize: 16, letterSpacing: '0.5em', marginBottom: 16, padding: '10px 0' }} type="password" maxLength={4} placeholder="• • • •"
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} autoFocus />
            <button className="av-btn av-btn-primary" style={{ width: '100%', padding: '11px 0' }} onClick={executePay} disabled={pin.length !== 4 || paying}>
              {paying ? <><div className="spinner"></div> Processing...</> : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
