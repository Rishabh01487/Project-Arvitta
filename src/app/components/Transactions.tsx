'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Tx {
  _id: string
  supplierId?: { name: string }
  supplierName?: string
  amount: number; netAmount?: number; tdsAmount?: number
  method: string; status: string; referenceId: string; utrNumber?: string; createdAt: string
}

export function TransactionsView() {
  const { authFetch } = useAuth()
  const [txs, setTxs] = useState<Tx[]>([])
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page: page.toString(), limit: '20' })
    if (methodFilter) p.set('method', methodFilter)
    if (statusFilter) p.set('status', statusFilter)
    try {
      const res = await authFetch(`/api/transactions?${p}`)
      if (res.ok) { const d = await res.json(); setTxs(d.transactions || []); setTotal(d.stats?.total || 0) }
    } catch (e) { console.error(e) }
  }, [authFetch, page, methodFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const fmtCur = (n: number | undefined) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

  return (
    <div className="page-wrap">
      <div className="float-in" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Transactions</div>
        <div className="subtitle" style={{ marginTop: 2 }}>{total} total</div>
      </div>

      <div className="float-in d1" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select className="av-select" style={{ width: 130 }} value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1) }}>
          <option value="">All Methods</option>
          <option value="UPI">UPI</option><option value="NEFT">NEFT</option><option value="RTGS">RTGS</option><option value="IMPS">IMPS</option>
        </select>
        <select className="av-select" style={{ width: 130 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          <option value="completed">Completed</option><option value="processing">Processing</option><option value="failed">Failed</option>
        </select>
      </div>

      {txs.length === 0 ? (
        <div className="card float-in d2" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div className="subtitle">No transactions yet</div>
        </div>
      ) : (
        <div className="float-in d2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {txs.map(tx => (
            <div key={tx._id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, background: tx.status === 'completed' ? 'var(--color-av-success-bg)' : 'var(--color-av-accent-bg)' }}>
                  {tx.status === 'completed' ? '✓' : tx.status === 'failed' ? '✕' : '◌'}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{tx.supplierId?.name || tx.supplierName || 'Unknown'}</div>
                  <div className="subtitle" style={{ fontSize: 10 }}>
                    {new Date(tx.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {tx.utrNumber ? ` · UTR: ${tx.utrNumber}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{fmtCur(tx.netAmount || tx.amount)}</span>
                <span className={`m-pill m-${tx.method.toLowerCase()}`}>{tx.method}</span>
                <span className={`badge badge-${tx.status}`}>{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="float-in d3" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
          <button className="av-btn av-btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span className="av-btn av-btn-ghost" style={{ cursor: 'default', opacity: 0.6 }}>Page {page}</span>
          <button className="av-btn av-btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next →</button>
        </div>
      )}
    </div>
  )
}
