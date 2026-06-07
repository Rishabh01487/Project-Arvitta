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
    } catch (e) {
      console.error(e)
    }
    setSeeding(false)
  }

  const quickAmounts = [100000, 250000, 500000, 750000, 1000000, 1500000]
  const fmtCur = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`

  return (
    <div>
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm p-4 rounded-2xl toast-in" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(56,189,248,0.04))', backdropFilter: 'blur(20px)', border: '1px solid rgba(56,189,248,0.2)', color: 'var(--color-av-white)' }}>
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>💰 {toast}</p>
          <button onClick={() => setToast('')} className="absolute top-2 right-3 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 float-in">
        <div>
          <h2 className="heading text-2xl">Dashboard</h2>
          <p className="body-text text-xs mt-0.5">Overview of your payment operations</p>
        </div>
        <button className="av-btn av-btn-primary shine" onClick={() => setShowCredit(true)}>+ Credit Account</button>
      </div>

      {/* Main Grid Structure (2 columns main, 1 column sidebar actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (2 Cols width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ═══ Hero Balance Card (High-End Glassmorphic Design) ═══ */}
          <div className="glass-crystal p-6 relative overflow-hidden float-in fd-1" 
               style={{ 
                 background: 'linear-gradient(135deg, rgba(15,22,55,0.7) 0%, rgba(20,35,80,0.6) 100%)',
                 border: '1px solid rgba(56,189,248,0.18)',
                 boxShadow: '0 15px 35px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 50px rgba(35,77,194,0.1)'
               }}>
            {/* Card Grid Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 0), radial-gradient(rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 8px 8px'
            }} />
            
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', transform: 'translate(25%,-35%)' }} />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(35,77,194,0.08) 0%, transparent 70%)', transform: 'translate(-25%,35%)' }} />

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <p className="label mb-1" style={{ letterSpacing: '0.2em', color: 'var(--color-av-blue-light)' }}>Corporate Debit Wallet</p>
                <p className="heading text-xs opacity-60">Arvitta Financial Systems</p>
              </div>
              {/* Microchip Graphic */}
              <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-blue-300/20 to-blue-500/10 border border-blue-400/20 relative flex items-center justify-center">
                <div className="absolute inset-2 border-r border-b border-blue-400/20" />
                <div className="absolute inset-3 border-l border-t border-blue-400/20" />
              </div>
            </div>

            <div className="relative z-10 mb-6">
              <p className="label opacity-60 mb-1">Available Balance</p>
              <p className="stat-num text-3xl" style={{ color: 'var(--color-av-white)', textShadow: '0 0 40px rgba(56,189,248,0.2)' }}>
                {fmtCur(account?.balance ?? 0)}
              </p>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Business Name</p>
                  <p className="text-xs font-bold mt-1 text-white/90" style={{ fontFamily: 'var(--font-body)' }}>{business?.name || 'Agri Fresh Foods'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Status</p>
                  <p className="text-xs font-bold mt-1 text-white/90" style={{ color: 'var(--color-av-blue-light)' }}>ACTIVE</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-white/40 font-mono">•••• •••• •••• {business?.phone?.slice(-4) || '8839'}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Outstanding', value: fmtCur(stats?.totalDue ?? 0), color: 'var(--color-av-danger)', delay: 'fd-2' },
              { label: 'Active Suppliers', value: stats?.supplierCount ?? 0, color: 'var(--color-av-blue-light)', delay: 'fd-3' },
              { label: 'Suppliers With Dues', value: stats?.suppliersWithDue ?? 0, color: 'var(--color-av-white-80)', delay: 'fd-4' },
            ].map(s => (
              <div key={s.label} className={`glass-card p-4 shine float-in ${s.delay}`}>
                <p className="label mb-1.5">{s.label}</p>
                <p className="stat-num text-lg" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Analytics Graphic (Fills void beautifully) */}
          <div className="glass-card p-5 float-in fd-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="heading text-sm">Cash Flow Analytics</h3>
                <p className="body-text text-xs">Simulated weekly payout activity</p>
              </div>
              <span className="badge badge-low">Live Sync</span>
            </div>
            <div className="relative h-32 w-full">
              {/* SVG Line Chart */}
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-av-blue-light)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--color-av-blue-light)" stopOpacity="0.00" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-av-blue-light)" />
                    <stop offset="50%" stopColor="var(--color-av-blue)" />
                    <stop offset="100%" stopColor="var(--color-av-white)" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                
                {/* Area under path */}
                <path d="M 0 150 L 0 120 Q 75 80 150 100 T 300 45 T 450 70 L 500 60 L 500 150 Z" fill="url(#chartGrad)" />
                
                {/* Stroke path */}
                <path d="M 0 120 Q 75 80 150 100 T 300 45 T 450 70 L 500 60" fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />
                
                {/* Points */}
                <circle cx="150" cy="100" r="4" fill="var(--color-av-blue-light)" stroke="var(--color-av-bg)" strokeWidth="2" />
                <circle cx="300" cy="45" r="4" fill="var(--color-av-white)" stroke="var(--color-av-bg)" strokeWidth="2" />
                <circle cx="500" cy="60" r="4" fill="var(--color-av-blue-light)" stroke="var(--color-av-bg)" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex justify-between mt-3 text-[9px] text-white/40 font-semibold uppercase tracking-wider">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          {/* Smart Payout Suggestions */}
          {suggestions && suggestions.suggestedSuppliers.length > 0 ? (
            <div className="glass p-5 glow-ring float-in fd-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl" style={{ color: 'var(--color-av-blue-light)' }}>⚡</span>
                  <h3 className="heading text-base">Smart Suggestions</h3>
                </div>
                <button className="av-btn av-btn-primary text-xs py-1.5 px-3" onClick={() => onNavigate('pay')}>Pay Now →</button>
              </div>
              <p className="body-text text-xs mb-4">
                Based on your balance of {fmtCur(suggestions.balance)}, you can pay {suggestions.suggestedSuppliers.length} supplier(s):
              </p>
              <div className="space-y-2">
                {suggestions.suggestedSuppliers.slice(0, 5).map(s => (
                  <div key={s._id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl shine"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <span className={`badge badge-${s.priority}`}>{s.priority}</span>
                      <span className="text-xs font-semibold text-white/80">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white/90" style={{ fontFamily: 'var(--font-display)' }}>{fmtCur(s.suggestedAmount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>