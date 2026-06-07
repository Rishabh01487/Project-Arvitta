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