'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Tx { _id: string; supplierName: string; amount: number; method: string; status: string; referenceId: string; utr: string; createdAt: string }

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
      if (res.ok) { const d = await res.json(); setTxs(d.transactions); setTotal(d.total) }
    } catch (e) { console.error(e) }
  }, [authFetch, page, methodFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const fmtCur = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  return (
    <div>
      <div className="float-in">
        <h2 className="heading text-2xl">Transactions</h2>
        <p className="body-text text-xs mt-0.5">{total} total transaction{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="glass-card p-4 my-5 float-in fd-1">
        <div className="flex gap-3">
          <select className="av-select" value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1) }}>
            <option value="">All Methods</option>
            <option value="UPI">UPI</option><option value="NEFT">NEFT</option><option value="RTGS">RTGS</option><option value="IMPS">IMPS</option>
          </select>
          <select className="av-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option><option value="processing">Processing</option><option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {txs.length === 0 ? (
        <div className="glass p-10 text-center float-in fd-2">
          <p className="text-3xl mb-2.5" style={{ color: 'var(--color-av-blue-light)' }}>◇</p>
          <p className="body-text text-xs font-semibold">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {txs.map((tx, i) => (
            <div key={tx._id} className={`glass-card p-4 shine float-in fd-${Math.min(i + 1, 4)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: tx.status === 'completed' ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${tx.status === 'completed' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    <span>{tx.status === 'completed' ? '✓' : tx.status === 'failed' ? '✕' : '◌'}</span>