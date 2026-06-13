'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Stats { totalDue: number; supplierCount: number; suppliersWithDue: number }
interface AutoMatch { balance: number; suggestedSuppliers: { _id: string; name: string; priority: string; totalDue: number; suggestedAmount: number }[]; totalPayout: number; remainingBalance: number }
interface CreditEvent { _id: string; amount: number; source: string; createdAt: string }

export function DashboardView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { account, business, authFetch, refreshAccount } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [suggestions, setSuggestions] = useState<AutoMatch | null>(null)
  const [creditEvents, setCreditEvents] = useState<CreditEvent[]>([])
  const [showCredit, setShowCredit] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [crediting, setCrediting] = useState(false)
  const [toast, setToast] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [a, s, c] = await Promise.all([
        authFetch('/api/account'), authFetch('/api/payments/suggest'), authFetch('/api/account/credit-history?limit=5')
      ])
      if (a.ok) { const d = await a.json(); setStats(d.stats) }
      if (s.ok) { const d = await s.json(); setSuggestions(d) }
      if (c.ok) { const d = await c.json(); setCreditEvents(d.events) }
    } catch (e) { console.error(e) }
  }, [authFetch])

  useEffect(() => { loadData() }, [loadData])

  const handleCredit = async () => {
    const amt = parseInt(creditAmount)
    if (!amt || amt < 1) return
    setCrediting(true)
    try {
      const res = await authFetch('/api/account', { method: 'POST', body: JSON.stringify({ amount: amt, source: 'Bank Transfer' }) })
      const data = await res.json()
      if (data.success) { setToast(data.notification); setCreditAmount(''); setShowCredit(false); await refreshAccount(); await loadData(); setTimeout(() => setToast(''), 4000) }
    } catch (e) { console.error(e) }
    setCrediting(false)
  }

  const [seeding, setSeeding] = useState(false)
  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await authFetch('/api/demo/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) { setToast('Demo data populated!'); await refreshAccount(); await loadData(); setTimeout(() => setToast(''), 4000) }
    } catch (e) { console.error(e) }
    setSeeding(false)
  }

  const quickAmounts = [100000, 250000, 500000, 1000000]
  const fmtCur = (n: number) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

  return (
    <div className="page-wrap">
      {toast && (
        <div className="float-in" style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, padding: '12px 20px', background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{toast}</div>
          <button onClick={() => setToast('')} style={{ position: 'absolute', top: 8, right: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-av-text-muted)', fontSize: 12 }}>✕</button>
        </div>
      )}

      {/* header */}
      <div className="float-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Dashboard</div>
          <div className="subtitle" style={{ marginTop: 2 }}>{business?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="av-btn av-btn-ghost" onClick={handleSeed} disabled={seeding} style={{ fontSize: 12 }}>{seeding ? 'Seeding...' : 'Seed Data'}</button>
          <button className="av-btn av-btn-primary" onClick={() => setShowCredit(true)}>+ Credit</button>
        </div>
      </div>

      {/* balance hero */}
      <div className="float-in d1 card" style={{ padding: '28px 32px', marginBottom: 20 }}>
        <div className="subtitle" style={{ marginBottom: 4 }}>Wallet Balance</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {fmtCur(account?.balance ?? 0)}
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-av-gray-100)' }}>
          <div>
            <div className="stat-lbl">Total Credited</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{fmtCur(account?.totalCredited ?? 0)}</div>
          </div>
          <div>
            <div className="stat-lbl">Total Debited</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{fmtCur(account?.totalDebited ?? 0)}</div>
          </div>
        </div>
      </div>

      {/* stats row */}
      <div className="float-in d2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: '18px 22px' }}>
          <div className="stat-lbl">Outstanding</div>
          <div className="stat-num" style={{ color: 'var(--color-av-danger)' }}>{fmtCur(stats?.totalDue ?? 0)}</div>
        </div>
        <div className="card" style={{ padding: '18px 22px' }}>
          <div className="stat-lbl">Suppliers</div>
          <div className="stat-num">{stats?.supplierCount ?? 0}</div>
        </div>
        <div className="card" style={{ padding: '18px 22px' }}>
          <div className="stat-lbl">With Dues</div>
          <div className="stat-num" style={{ color: 'var(--color-av-accent-muted)' }}>{stats?.suppliersWithDue ?? 0}</div>
        </div>
      </div>

      {/* chart + suggestions */}
      <div className="float-in d3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Weekly Cash Flow</div>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-av-text-muted)' }}>Last 7 days</span>
          </div>
          <svg style={{ width: '100%', height: 120 }} viewBox="0 0 500 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-av-accent)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--color-av-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="37" x2="500" y2="37" stroke="var(--color-av-gray-100)" strokeWidth="1" />
            <line x1="0" y1="75" x2="500" y2="75" stroke="var(--color-av-gray-100)" strokeWidth="1" />
            <line x1="0" y1="113" x2="500" y2="113" stroke="var(--color-av-gray-100)" strokeWidth="1" />
            <path d="M 0 150 L 0 120 Q 75 80 150 100 T 300 45 T 450 70 L 500 60 L 500 150 Z" fill="url(#chartGrad)" />
            <path d="M 0 120 Q 75 80 150 100 T 300 45 T 450 70 L 500 60" fill="none" stroke="var(--color-av-accent)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="150" cy="100" r="3" fill="var(--color-av-accent)" stroke="#fff" strokeWidth="2" />
            <circle cx="300" cy="45" r="3" fill="var(--color-av-accent)" stroke="#fff" strokeWidth="2" />
            <circle cx="500" cy="60" r="3" fill="var(--color-av-accent)" stroke="#fff" strokeWidth="2" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <span key={d} style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-av-text-muted)' }}>{d}</span>
            ))}
          </div>
        </div>

        {suggestions && suggestions.suggestedSuppliers.length > 0 ? (
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Auto-Match Suggestions</div>
              <button className="av-btn av-btn-primary" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => onNavigate('pay')}>Pay Now</button>
            </div>
            <div className="subtitle" style={{ marginBottom: 12 }}>{suggestions.suggestedSuppliers.length} supplier(s) · Balance: {fmtCur(suggestions.balance)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.suggestedSuppliers.slice(0, 5).map(s => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-av-gray-50)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${s.priority}`}>{s.priority}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{fmtCur(s.suggestedAmount)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 12, borderTop: '1px solid var(--color-av-gray-100)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-av-text-secondary)' }}>Total Payout</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtCur(suggestions.totalPayout)}</span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Getting Started</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { step: '1', title: 'Account Registered', done: true },
                { step: '2', title: 'Add Suppliers', desc: 'Add supplier profiles with bank details', done: stats?.supplierCount ? stats.supplierCount > 0 : false, action: () => onNavigate('suppliers') },
                { step: '3', title: 'Credit Wallet', desc: 'Add funds to trigger auto-matching', done: account?.totalCredited ? account.totalCredited > 0 : false, action: () => setShowCredit(true) },
                { step: '4', title: 'Execute Payout', desc: 'Approve and run batch payments', done: account?.totalDebited ? account.totalDebited > 0 : false, action: () => onNavigate('pay') },
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: s.done ? 'var(--color-av-gray-50)' : 'var(--color-av-accent-bg)', borderRadius: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0, background: s.done ? 'var(--color-av-accent)' : 'var(--color-av-gray-200)', color: s.done ? '#fff' : 'var(--color-av-text-muted)' }}>
                    {s.done ? '✓' : s.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: s.done ? 'var(--color-av-text)' : 'var(--color-av-text-secondary)' }}>{s.title}</div>
                    {!s.done && <div className="subtitle" style={{ fontSize: 10 }}>{s.desc}</div>}
                  </div>
                  {!s.done && s.action && (
                    <button onClick={s.action} style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-av-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Go</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* bottom row: quick actions + recent credits */}
      <div className="float-in d4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="av-btn av-btn-primary" style={{ justifyContent: 'flex-start', padding: '10px 14px' }} onClick={() => setShowCredit(true)}>Credit Wallet</button>
            <button className="av-btn av-btn-ghost" style={{ justifyContent: 'flex-start', padding: '10px 14px' }} onClick={() => onNavigate('suppliers')}>Add Supplier</button>
            <button className="av-btn av-btn-ghost" style={{ justifyContent: 'flex-start', padding: '10px 14px' }} onClick={() => onNavigate('pay')}>Run Payout</button>
            <button className="av-btn av-btn-ghost" style={{ justifyContent: 'flex-start', padding: '10px 14px' }} onClick={() => onNavigate('settings')}>Settings</button>
          </div>
        </div>

        {creditEvents.length > 0 && (
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent Credits</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {creditEvents.map(ev => (
                <div key={ev._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-av-gray-50)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.source}</div>
                    <div className="subtitle" style={{ fontSize: 10 }}>{new Date(ev.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-av-success)' }}>+{fmtCur(ev.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* credit modal */}
      {showCredit && (
        <div className="modal-wrap" onClick={() => setShowCredit(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Credit Wallet</div>
              <button onClick={() => setShowCredit(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-av-text-muted)', fontSize: 14, fontFamily: 'inherit' }}>✕</button>
            </div>
            <div className="subtitle" style={{ marginBottom: 16 }}>Simulate a bank credit to your corporate wallet.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {quickAmounts.map(a => (
                <button key={a} onClick={() => setCreditAmount(a.toString())}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                    background: creditAmount === a.toString() ? 'var(--color-av-accent)' : 'var(--color-av-gray-100)',
                    color: creditAmount === a.toString() ? '#fff' : 'var(--color-av-text-secondary)',
                  }}>{fmtCur(a)}</button>
              ))}
            </div>
            <input className="av-input" type="number" placeholder="Enter amount" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-av-accent-bg)', borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-av-text-muted)' }}>New Balance</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtCur((account?.balance ?? 0) + (parseInt(creditAmount) || 0))}</span>
            </div>
            <button className="av-btn av-btn-primary" style={{ width: '100%', padding: '11px 0' }} onClick={handleCredit} disabled={crediting || !creditAmount}>
              {crediting ? <><div className="spinner"></div> Processing...</> : 'Credit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
