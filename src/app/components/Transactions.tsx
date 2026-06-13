'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Tx {
  _id: string
  supplierId?: {
    name: string
    phone?: string
    category?: string
    priority?: string
  }
  supplierName?: string // fallback
  amount: number // gross
  netAmount?: number
  tdsAmount?: number
  gstAmount?: number
  method: string
  status: string
  referenceId: string
  utrNumber?: string
  createdAt: string
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
      if (res.ok) {
        const d = await res.json()
        setTxs(d.transactions || [])
        setTotal(d.stats?.total || d.transactions?.length || 0)
      }
    } catch (e) {
      console.error(e)
    }
  }, [authFetch, page, methodFilter, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const fmtCur = (n: number | undefined) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

  return (
    <div>
      <div className="float-in">
        <h2 className="heading text-2xl">Financial Ledger</h2>
        <p className="body-text text-xs mt-0.5">{total} total transaction{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="glass-card p-4 my-5 float-in fd-1">
        <div className="flex gap-3">
          <select className="av-select" value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1) }}>
            <option value="">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="IMPS">IMPS</option>
          </select>
          <select className="av-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {txs.length === 0 ? (
        <div className="glass p-10 text-center float-in fd-2">
          <p className="body-text text-xs font-semibold">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {txs.map((tx, i) => {
            const hasTax = tx.netAmount !== undefined
            return (
              <div key={tx._id} className={`glass-card p-4 shine float-in fd-${Math.min(i + 1, 4)}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: tx.status === 'completed' ? 'var(--color-av-success-bg)' : 'var(--color-av-bg)',
                        border: `1px solid ${tx.status === 'completed' ? 'rgba(5, 150, 105, 0.2)' : 'var(--color-av-glass-border)'}`,
                      }}>
                      <span>{tx.status === 'completed' ? '✓' : tx.status === 'failed' ? '✕' : '◌'}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-av-text)' }}>
                        {tx.supplierId?.name || tx.supplierName || 'Unknown Supplier'}
                      </p>
                      <p className="body-text text-[11px] mt-0.5">
                        {new Date(tx.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {tx.utrNumber ? ` · UTR: ${tx.utrNumber}` : ''}
                        {tx.referenceId ? ` · Ref: ${tx.referenceId}` : ''}
                      </p>
                      
                      {tx.status === 'completed' && hasTax && (
                        <p className="text-[10px] font-semibold mt-1" style={{ color: 'var(--color-av-text-muted)' }}>
                          Gross Invoice: {fmtCur(tx.amount)} · TDS Withheld: {fmtCur(tx.tdsAmount)} · GST Component: {fmtCur(tx.gstAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                    <div className="sm:text-right">
                      <p className="text-xs font-bold" style={{ color: 'var(--color-av-text)' }}>
                        {fmtCur(tx.netAmount || tx.amount)}
                      </p>
                      {hasTax && (
                        <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-av-accent)' }}>
                          Net Cash Out
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`method-pill method-${tx.method.toLowerCase()}`}>{tx.method}</span>
                      <span className={`badge badge-${tx.status}`}>{tx.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-3 mt-6">
          <button className="av-btn av-btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span className="av-btn av-btn-ghost cursor-default">Page {page}</span>
          <button className="av-btn av-btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next →</button>
        </div>
      )}
    </div>
  )
}
