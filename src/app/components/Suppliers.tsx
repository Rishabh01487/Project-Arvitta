'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Supplier { _id: string; name: string; phone: string; category: string; priority: string; totalDue: number; totalPaid: number; lastPaidAt?: string; bankDetails?: { accountNumber?: string; ifscCode?: string; bankName?: string; holderName?: string }; upiId?: string }

const CAT_ICONS: Record<string, string> = { dairy: '\uD83E\uDD5B', grain: '\uD83C\uDF3E', spices: '\uD83C\uDF36', vegetables: '\uD83E\uDD6C', fruits: '\uD83C\uDF4A', meat: '\uD83E\uDD69', packaging: '\uD83D\uDCE6', logistics: '\uD83D\uDE9B', equipment: '\u2699\uFE0F', other: '\uD83D\uDCCB' }

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
  const fmtCur = (n: number) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6 float-in">
        <div>
          <h2 className="heading text-2xl">Supplier Ledger</h2>
          <p className="mt-1" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-av-text-secondary)', fontSize: '0.85rem' }}>
            {suppliers.length} suppliers · Outstanding: <span style={{ color: 'var(--color-av-danger)' }}>{fmtCur(totalDue)}</span>
          </p>
        </div>
        <button className="av-btn av-btn-primary shine" onClick={openAdd}>+ Add Supplier</button>
      </div>

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

      <div className="glass p-1 overflow-x-auto float-in fd-2">
        <table className="av-table">
          <thead><tr><th>Supplier</th><th>Category</th><th>Priority</th><th>Due</th><th>Paid</th><th>Last Paid</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-14">
                <p className="body-text text-sm">No suppliers found</p>
              </td></tr>
            ) : suppliers.map(s => (
              <tr key={s._id}>
                <td>
                  <p className="font-bold text-sm" style={{ color: 'var(--color-av-text)' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-av-text-muted)' }}>{s.phone}</p>
                </td>
                <td><span className="text-sm">{CAT_ICONS[s.category] || '\uD83D\uDCCB'} {s.category}</span></td>
                <td><span className={`badge badge-${s.priority}`}>{s.priority}</span></td>
                <td><span className="font-bold text-sm" style={{ color: s.totalDue > 0 ? 'var(--color-av-danger)' : 'var(--color-av-success)', fontFamily: 'var(--font-display)' }}>{fmtCur(s.totalDue)}</span></td>
                <td><span className="text-sm" style={{ color: 'var(--color-av-success)' }}>{fmtCur(s.totalPaid)}</span></td>
                <td><span className="text-xs" style={{ color: 'var(--color-av-text-muted)' }}>{s.lastPaidAt ? new Date(s.lastPaidAt).toLocaleDateString('en-IN') : '—'}</span></td>
                <td className="flex gap-2">
                  <button className="av-btn av-btn-ghost text-xs py-1 px-3" onClick={() => openEdit(s)}>Edit</button>
                  <button onClick={() => handleDelete(s._id)} className="px-2 py-1 rounded-lg" style={{ color: 'var(--color-av-danger)', opacity: 0.5 }}
                    onMouseOver={e => (e.currentTarget.style.opacity = '1')} onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-7">
              <h3 className="heading text-xl">{editId ? 'Edit Supplier' : 'New Supplier'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--color-av-text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label block mb-1">Name</label><input className="av-input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                <div><label className="label block mb-1">Phone</label><input className="av-input" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label block mb-1">Category</label><select className="av-select" value={form.category} onChange={e => set('category', e.target.value)}>{Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="label block mb-1">Priority</label><select className="av-select" value={form.priority} onChange={e => set('priority', e.target.value)}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
                <div><label className="label block mb-1">Due Amount</label><input type="number" className="av-input" value={form.totalDue} onChange={e => set('totalDue', e.target.value)} /></div>
              </div>
              <div className="accent-line my-1" />
              <p className="label">Bank Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label block mb-1">Account No.</label><input className="av-input" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} /></div>
                <div><label className="label block mb-1">IFSC</label><input className="av-input" value={form.ifsc} onChange={e => set('ifsc', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label block mb-1">Bank Name</label><input className="av-input" value={form.bankName} onChange={e => set('bankName', e.target.value)} /></div>
                <div><label className="label block mb-1">Account Holder</label><input className="av-input" value={form.accountHolderName} onChange={e => set('accountHolderName', e.target.value)} /></div>
              </div>
              <div><label className="label block mb-1">UPI ID</label><input className="av-input" placeholder="supplier@upi" value={form.upiId} onChange={e => set('upiId', e.target.value)} /></div>
              <button type="submit" className="av-btn av-btn-primary w-full py-3.5 mt-2">{editId ? 'Update' : 'Add Supplier'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
