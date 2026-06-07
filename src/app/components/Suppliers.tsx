'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Supplier { _id: string; name: string; phone: string; category: string; priority: string; totalDue: number; totalPaid: number; lastPaidAt?: string; bankDetails?: { accountNumber?: string; ifscCode?: string; bankName?: string; holderName?: string }; upiId?: string }

const CAT_ICONS: Record<string, string> = { dairy: '🥛', grain: '🌾', spices: '🌶', vegetables: '🥬', fruits: '🍊', meat: '🥩', packaging: '📦', logistics: '🚛', equipment: '⚙️', other: '📋' }

export function SuppliersView() {
  const { authFetch } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [totalDue, setTotalDue] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', category: 'other', priority: 'medium', totalDue: '', accountNumber: '', ifsc: '', bankName: '', accountHolderName: '', upiId: '' })

  const load = useCallback(async () => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (priorityFilter) p.set('priority', priorityFilter)
    if (catFilter) p.set('category', catFilter)
    try {
      const res = await authFetch(`/api/suppliers?${p}`)
      if (res.ok) {
        const d = await res.json()
        setSuppliers(d.suppliers)
        const total = d.suppliers.reduce((sum: number, s: any) => sum + (s.totalDue || 0), 0)
        setTotalDue(d.totalOutstanding !== undefined ? d.totalOutstanding : total)
      }
    } catch (e) { console.error(e) }
  }, [authFetch, search, priorityFilter, catFilter])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm({ name: '', phone: '', category: 'other', priority: 'medium', totalDue: '', accountNumber: '', ifsc: '', bankName: '', accountHolderName: '', upiId: '' }); setEditId(null) }
  const openAdd = () => { resetForm(); setShowModal(true) }
  const openEdit = (s: Supplier) => {
    setForm({
      name: s.name,
      phone: s.phone,
      category: s.category,
      priority: s.priority,
      totalDue: s.totalDue.toString(),
      accountNumber: s.bankDetails?.accountNumber || '',
      ifsc: s.bankDetails?.ifscCode || '',
      bankName: s.bankDetails?.bankName || '',
      accountHolderName: s.bankDetails?.holderName || '',
      upiId: s.upiId || ''
    })
    setEditId(s._id); setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      name: form.name,
      phone: form.phone,
      category: form.category,
      priority: form.priority,
      totalDue: parseFloat(form.totalDue) || 0,
      bankDetails: {
        accountNumber: form.accountNumber,
        ifscCode: form.ifsc,
        bankName: form.bankName,
        holderName: form.accountHolderName
      },