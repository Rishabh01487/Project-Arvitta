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
      upiId: form.upiId || undefined
    }
    await authFetch(editId ? `/api/suppliers/${editId}` : '/api/suppliers', { method: editId ? 'PUT' : 'POST', body: JSON.stringify(body) })
    setShowModal(false); resetForm(); load()
  }

  const handleDelete = async (id: string) => { if (!confirm('Delete this supplier?')) return; await authFetch(`/api/suppliers/${id}`, { method: 'DELETE' }); load() }
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const fmtCur = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6 float-in">
        <div>
          <h2 className="heading text-2xl">Supplier Ledger</h2>
          <p className="mt-1" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-av-gray)', fontSize: '0.85rem' }}>
            {suppliers.length} suppliers · Outstanding: <span style={{ color: 'var(--color-av-danger)' }}>{fmtCur(totalDue)}</span>
          </p>
        </div>
        <button className="av-btn av-btn-primary shine" onClick={openAdd}>+ Add Supplier</button>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 mb-7 float-in fd-1">
        <div className="flex flex-col md:flex-row gap-3">
          <input className="av-input flex-1" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="av-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select className="av-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>{Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
