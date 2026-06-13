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
        setTotalDue(d.totalOutstanding !== undefined ? d.totalOutstanding : d.suppliers.reduce((sum: number, s: any) => sum + (s.totalDue || 0), 0))
      }
    } catch (e) { console.error(e) }
  }, [authFetch, search, priorityFilter, catFilter])

  useEffect(() => { load() }, [load])

  const resetForm = () => { setForm({ name: '', phone: '', category: 'other', priority: 'medium', totalDue: '', accountNumber: '', ifsc: '', bankName: '', accountHolderName: '', upiId: '' }); setEditId(null) }
  const openAdd = () => { resetForm(); setShowModal(true) }
  const openEdit = (s: Supplier) => {
    setForm({
      name: s.name, phone: s.phone, category: s.category, priority: s.priority,
      totalDue: s.totalDue.toString(),
      accountNumber: s.bankDetails?.accountNumber || '', ifsc: s.bankDetails?.ifscCode || '',
      bankName: s.bankDetails?.bankName || '', accountHolderName: s.bankDetails?.holderName || '',
      upiId: s.upiId || ''
    })
    setEditId(s._id); setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      name: form.name, phone: form.phone, category: form.category, priority: form.priority,
      totalDue: parseFloat(form.totalDue) || 0,
      bankDetails: { accountNumber: form.accountNumber, ifscCode: form.ifsc, bankName: form.bankName, holderName: form.accountHolderName },
      upiId: form.upiId || undefined
    }
    await authFetch(editId ? `/api/suppliers/${editId}` : '/api/suppliers', { method: editId ? 'PUT' : 'POST', body: JSON.stringify(body) })
    setShowModal(false); resetForm(); load()
  }

  const handleDelete = async (id: string) => { if (!confirm('Delete?')) return; await authFetch(`/api/suppliers/${id}`, { method: 'DELETE' }); load() }
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const fmtCur = (n: number) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

  return (
    <div className="page-wrap">
      <div className="float-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Suppliers</div>
          <div className="subtitle" style={{ marginTop: 2 }}>{suppliers.length} suppliers · Outstanding: <span style={{ color: 'var(--color-av-danger)', fontWeight: 600 }}>{fmtCur(totalDue)}</span></div>
        </div>
        <button className="av-btn av-btn-primary" onClick={openAdd}>+ Add</button>
      </div>

      <div className="float-in d1" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="av-input" style={{ flex: 1 }} placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="av-select" style={{ width: 130 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select className="av-select" style={{ width: 120 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="float-in d2 card" style={{ overflow: 'hidden' }}>
        {suppliers.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--color-av-text-secondary)', fontSize: 13 }}>No suppliers found</div>
        ) : (
          <table>
            <thead>
              <tr><th>Supplier</th><th>Category</th><th>Priority</th><th>Due</th><th>Paid</th><th>Last Paid</th><th></th></tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-av-text-muted)' }}>{s.phone}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{CAT_ICONS[s.category] || '\uD83D\uDCCB'} {s.category}</td>
                  <td><span className={`badge badge-${s.priority}`}>{s.priority}</span></td>
                  <td><span style={{ fontWeight: 600, color: s.totalDue > 0 ? 'var(--color-av-danger)' : 'var(--color-av-success)' }}>{fmtCur(s.totalDue)}</span></td>
                  <td style={{ color: 'var(--color-av-success)' }}>{fmtCur(s.totalPaid)}</td>
                  <td style={{ fontSize: 11, color: 'var(--color-av-text-muted)' }}>{s.lastPaidAt ? new Date(s.lastPaidAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="av-btn av-btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openEdit(s)}>Edit</button>
                      <button onClick={() => handleDelete(s._id)} style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, border: 'none', background: 'none', color: 'var(--color-av-danger)', cursor: 'pointer', opacity: 0.5, fontFamily: 'inherit' }}
                        onMouseOver={e => (e.currentTarget.style.opacity = '1')} onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-wrap" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{editId ? 'Edit Supplier' : 'New Supplier'}</div>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-av-text-muted)', fontSize: 14, fontFamily: 'inherit' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Name</div><input className="av-input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Phone</div><input className="av-input" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Category</div><select className="av-select" value={form.category} onChange={e => set('category', e.target.value)}>{Object.keys(CAT_ICONS).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Priority</div><select className="av-select" value={form.priority} onChange={e => set('priority', e.target.value)}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Due</div><input type="number" className="av-input" value={form.totalDue} onChange={e => set('totalDue', e.target.value)} /></div>
              </div>
              <div style={{ height: 1, background: 'var(--color-av-gray-100)' }} />
              <div className="subtitle" style={{ fontSize: 10 }}>Bank Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Account</div><input className="av-input" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} /></div>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>IFSC</div><input className="av-input" value={form.ifsc} onChange={e => set('ifsc', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Bank Name</div><input className="av-input" value={form.bankName} onChange={e => set('bankName', e.target.value)} /></div>
                <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>Holder</div><input className="av-input" value={form.accountHolderName} onChange={e => set('accountHolderName', e.target.value)} /></div>
              </div>
              <div><div className="subtitle" style={{ fontSize: 10, marginBottom: 4 }}>UPI</div><input className="av-input" placeholder="supplier@upi" value={form.upiId} onChange={e => set('upiId', e.target.value)} /></div>
              <button type="submit" className="av-btn av-btn-primary" style={{ width: '100%', padding: '11px 0', marginTop: 4 }}>{editId ? 'Update' : 'Add Supplier'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
