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