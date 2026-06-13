'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Stats { totalDue: number; supplierCount: number; suppliersWithDue: number }
interface AutoMatch { balance: number; suggestedSuppliers: { _id: string; name: string; priority: string; totalDue: number; suggestedAmount: number }[]; totalPayout: number; remainingBalance: number }
interface CreditEvent { _id: string; amount: number; source: string; balanceAfter: number; createdAt: string }

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
      const [a, s, c] = await Promise.all([authFetch('/api/account'), authFetch('/api/payments/suggest'), authFetch('/api/account/credit-history?limit=5')])
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
      if (data.success) { setToast(data.notification); setCreditAmount(''); setShowCredit(false); await refreshAccount(); await loadData(); setTimeout(() => setToast(''), 5000) }
    } catch (e) { console.error(e) }
    setCrediting(false)
  }

  const [seeding, setSeeding] = useState(false)
  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await authFetch('/api/demo/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setToast('Demo workspace populated successfully!')
        await refreshAccount()
        await loadData()
        setTimeout(() => setToast(''), 5000)
      }
    } catch (e) { console.error(e) }
    setSeeding(false)
  }

  const quickAmounts = [100000, 250000, 500000, 750000, 1000000, 1500000]
  const fmtCur = (n: number) => `\u20B9${(n || 0).toLocaleString('en-IN')}`

  return (
    <div>
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm p-4 rounded-2xl toast-in"
          style={{ background: 'var(--color-av-glass-strong)', backdropFilter: 'blur(8px)', border: '1px solid var(--color-av-glass-border)', color: 'var(--color-av-text)' }}>
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>{toast}</p>
          <button onClick={() => setToast('')} className="absolute top-2 right-3 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 float-in">
        <div>
          <h2 className="heading text-2xl">Dashboard</h2>
          <p className="body-text text-xs mt-0.5">Overview of your payment operations</p>
        </div>
        <button className="av-btn av-btn-primary shine" onClick={() => setShowCredit(true)}>+ Credit Account</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">

          <div className="glass-crystal p-6 relative overflow-hidden float-in fd-1"
               style={{
                 background: 'linear-gradient(135deg, #f8f9fb 0%, #f1f2f6 100%)',
                 border: '1px solid rgba(0,0,0,0.04)',
               }}>
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(rgba(79, 70, 229, 0.03) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }} />

            <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.04) 0%, transparent 70%)', transform: 'translate(25%,-35%)' }} />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.03) 0%, transparent 70%)', transform: 'translate(-25%,35%)' }} />

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <p className="label mb-1" style={{ letterSpacing: '0.2em', color: 'var(--color-av-accent)' }}>Corporate Debit Wallet</p>
                <p className="heading text-xs" style={{ color: 'var(--color-av-text-muted)' }}>Arvitta Financial Systems</p>
              </div>
            </div>

            <div className="relative z-10 mb-6">
              <p className="label mb-1" style={{ color: 'var(--color-av-text-muted)' }}>Available Balance</p>
              <p className="stat-num text-3xl" style={{ color: 'var(--color-av-text)' }}>
                {fmtCur(account?.balance ?? 0)}
              </p>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-av-text-muted)' }}>Business Name</p>
                  <p className="text-xs font-bold mt-1" style={{ color: 'var(--color-av-text-secondary)' }}>{business?.name || 'Agri Fresh Foods'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-av-text-muted)' }}>Status</p>
                  <p className="text-xs font-bold mt-1" style={{ color: 'var(--color-av-accent)' }}>ACTIVE</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Outstanding', value: fmtCur(stats?.totalDue ?? 0), color: 'var(--color-av-danger)', delay: 'fd-2' },
              { label: 'Active Suppliers', value: stats?.supplierCount ?? 0, color: 'var(--color-av-text)', delay: 'fd-3' },
              { label: 'Suppliers With Dues', value: stats?.suppliersWithDue ?? 0, color: 'var(--color-av-text-secondary)', delay: 'fd-4' },
            ].map(s => (
              <div key={s.label} className={`glass-card p-4 shine float-in ${s.delay}`}>
                <p className="label mb-1.5">{s.label}</p>
                <p className="stat-num text-lg" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-5 float-in fd-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="heading text-sm">Cash Flow Analytics</h3>
                <p className="body-text text-xs">Simulated weekly payout activity</p>
              </div>
              <span className="badge badge-low">Live Sync</span>
            </div>
            <div className="relative h-32 w-full">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-av-accent)" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="var(--color-av-accent)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                <path d="M 0 150 L 0 120 Q 75 80 150 100 T 300 45 T 450 70 L 500 60 L 500 150 Z" fill="url(#chartGrad)" />
                <path d="M 0 120 Q 75 80 150 100 T 300 45 T 450 70 L 500 60" fill="none" stroke="var(--color-av-accent)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="150" cy="100" r="4" fill="var(--color-av-accent)" stroke="#fff" strokeWidth="2" />
                <circle cx="300" cy="45" r="4" fill="var(--color-av-accent)" stroke="#fff" strokeWidth="2" />
                <circle cx="500" cy="60" r="4" fill="var(--color-av-accent)" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex justify-between mt-3 text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-av-text-muted)' }}>
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          {suggestions && suggestions.suggestedSuppliers.length > 0 ? (
            <div className="glass p-5 glow-ring float-in fd-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl" style={{ color: 'var(--color-av-accent)' }}>⚡</span>
                  <h3 className="heading text-base">Smart Suggestions</h3>
                </div>
                <button className="av-btn av-btn-primary text-xs py-1.5 px-3" onClick={() => onNavigate('pay')}>Pay Now →</button>
              </div>
              <p className="body-text text-xs mb-4">
                Based on your balance of {fmtCur(suggestions.balance)}, you can pay {suggestions.suggestedSuppliers.length} supplier(s):
              </p>
              <div className="space-y-2">
                {suggestions.suggestedSuppliers.slice(0, 5).map(s => (
                  <div key={s._id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl"
                    style={{ background: 'var(--color-av-bg)', border: '1px solid var(--color-av-glass-border)' }}>
                    <div className="flex items-center gap-3">
                      <span className={`badge badge-${s.priority}`}>{s.priority}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-av-text-secondary)' }}>{s.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--color-av-text)', fontFamily: 'var(--font-display)' }}>{fmtCur(s.suggestedAmount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 pt-3.5" style={{ borderTop: '1px solid var(--color-av-glass-border)' }}>
                <span className="body-text text-xs">Total suggested</span>
                <span className="text-xs font-bold" style={{ color: 'var(--color-av-accent)', fontFamily: 'var(--font-display)' }}>{fmtCur(suggestions.totalPayout)}</span>
              </div>
            </div>
          ) : (
            <div className="glass p-5 float-in fd-4">
              <h3 className="heading text-sm mb-3.5 flex items-center gap-2">
                Getting Started Checklist
              </h3>
              <div className="space-y-2.5">
                {[
                  { step: '1', title: 'Register Business Account', desc: 'Completed during onboarding process.', done: true },
                  { step: '2', title: 'Add Suppliers & Bank Profiles', desc: 'Populate your supplier ledger to map account details.', done: stats?.supplierCount ? stats.supplierCount > 0 : false, action: () => onNavigate('suppliers'), actionText: 'Go to Ledger' },
                  { step: '3', title: 'Simulate Bank Credit', desc: 'Credit your debit wallet to trigger auto-matching.', done: account?.totalCredited ? account.totalCredited > 0 : false, action: () => setShowCredit(true), actionText: 'Credit Wallet' },
                  { step: '4', title: 'Execute Automated Payouts', desc: 'Approve suggested payout batches using your security PIN.', done: account?.totalDebited ? account.totalDebited > 0 : false, action: () => onNavigate('pay'), actionText: 'Run Payout' }
                ].map((s, idx) => (
                  <div key={idx} className="flex gap-3 p-3.5 rounded-xl transition-all" style={{ background: s.done ? 'var(--color-av-accent-bg)' : 'var(--color-av-bg)', border: s.done ? '1px solid var(--color-av-accent-border)' : '1px solid var(--color-av-glass-border)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0" style={{
                      background: s.done ? 'var(--color-av-accent)' : 'rgba(0,0,0,0.05)',
                      color: s.done ? '#fff' : 'var(--color-av-text-muted)'
                    }}>
                      {s.done ? '✓' : s.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: s.done ? 'var(--color-av-text)' : 'var(--color-av-text-secondary)' }}>{s.title}</p>
                      <p className="body-text text-[11px] mt-0.5 leading-normal">{s.desc}</p>
                      {!s.done && s.action && (
                        <button onClick={s.action} className="mt-1 text-[11px] font-bold text-left" style={{ color: 'var(--color-av-accent)' }}>
                          {s.actionText} →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">

          <div className="glass-card p-5 float-in fd-3">
            <h3 className="heading text-base mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2.5">
              <button className="av-btn av-btn-primary w-full justify-start py-2.5 shine" onClick={() => setShowCredit(true)}>
                Credit Wallet
              </button>
              <button className="av-btn av-btn-ghost w-full justify-start py-2.5" onClick={() => onNavigate('suppliers')}>
                + Add New Supplier
              </button>
              <button className="av-btn av-btn-ghost w-full justify-start py-2.5" onClick={() => onNavigate('pay')}>
                Run Batch Payout
              </button>
              <button className="av-btn av-btn-ghost w-full justify-start py-2.5" onClick={() => onNavigate('settings')}>
                Update Security PIN
              </button>
              <button className="av-btn av-btn-ghost w-full justify-start py-2.5" style={{ color: 'var(--color-av-accent)', border: '1px solid var(--color-av-accent-border)' }} onClick={handleSeed} disabled={seeding}>
                {seeding ? 'Seeding...' : 'Load Demo Data'}
              </button>
            </div>
          </div>

          <div className="glass-card p-5 float-in fd-4">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="heading text-sm">Security Auditing</h3>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-av-accent)' }} />
            </div>
            <div className="space-y-2 text-[9px] tracking-wide" style={{ color: 'var(--color-av-text-muted)' }}>
              <div className="p-2 rounded flex items-center justify-between" style={{ background: 'var(--color-av-bg)', border: '1px solid var(--color-av-glass-border)' }}>
                <span>API Gateway Handshake</span>
                <span className="font-bold" style={{ color: 'var(--color-av-accent)' }}>VERIFIED</span>
              </div>
              <div className="p-2 rounded flex items-center justify-between" style={{ background: 'var(--color-av-bg)', border: '1px solid var(--color-av-glass-border)' }}>
                <span>Auto-Match Engine</span>
                <span className="font-bold" style={{ color: 'var(--color-av-accent)' }}>STANDBY</span>
              </div>
              <div className="p-2 rounded flex items-center justify-between" style={{ background: 'var(--color-av-bg)', border: '1px solid var(--color-av-glass-border)' }}>
                <span>Database Sync</span>
                <span className="font-bold" style={{ color: 'var(--color-av-accent)' }}>ONLINE</span>
              </div>
              <div className="p-2 rounded flex items-center justify-between" style={{ background: 'var(--color-av-bg)', border: '1px solid var(--color-av-glass-border)' }}>
                <span>JWT Encryption Key</span>
                <span className="font-bold" style={{ color: 'var(--color-av-accent)' }}>SECURED</span>
              </div>
            </div>
          </div>

          {creditEvents.length > 0 && (
            <div className="glass-card p-5 float-in fd-5">
              <h3 className="heading text-sm mb-3.5">Recent Credits</h3>
              <div className="space-y-2">
                {creditEvents.map(ev => (
                  <div key={ev._id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl" style={{ background: 'var(--color-av-bg)' }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-av-text-secondary)' }}>{ev.source}</p>
                      <p className="text-[9px]" style={{ color: 'var(--color-av-text-muted)' }}>{new Date(ev.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--color-av-accent)', fontFamily: 'var(--font-display)' }}>+{fmtCur(ev.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {showCredit && (
        <div className="modal-overlay" onClick={() => setShowCredit(false)}>
          <div className="modal-content" style={{ padding: '20px', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="heading text-lg">Credit Account</h3>
              <button onClick={() => setShowCredit(false)} style={{ color: 'var(--color-av-text-muted)' }}>✕</button>
            </div>
            <p className="body-text text-xs mb-4">Simulate a bank credit to trigger the auto-match engine.</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {quickAmounts.map(a => (
                <button key={a} onClick={() => setCreditAmount(a.toString())}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: creditAmount === a.toString() ? 'linear-gradient(135deg, var(--color-av-accent), #4338ca)' : 'var(--color-av-bg)',
                    color: creditAmount === a.toString() ? '#fff' : 'var(--color-av-text-secondary)',
                    border: `1px solid ${creditAmount === a.toString() ? 'var(--color-av-accent-border)' : 'var(--color-av-glass-border)'}`,
                  }}>{fmtCur(a)}</button>
              ))}
            </div>
            <input className="av-input mb-4" type="number" placeholder="Enter amount" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
            <div className="flex justify-between items-center p-3 rounded-xl mb-4" style={{ background: 'var(--color-av-accent-bg)', border: '1px solid var(--color-av-accent-border)' }}>
              <span className="label">New Balance</span>
              <span className="text-xs font-bold" style={{ color: 'var(--color-av-accent)', fontFamily: 'var(--font-display)' }}>{fmtCur((account?.balance ?? 0) + (parseInt(creditAmount) || 0))}</span>
            </div>
            <button className="av-btn av-btn-primary w-full py-2.5" onClick={handleCredit} disabled={crediting || !creditAmount}>
              {crediting ? <><div className="spinner"></div> Processing...</> : `Credit ${creditAmount ? fmtCur(parseInt(creditAmount)) : '\u20B90'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
