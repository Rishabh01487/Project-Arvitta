'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../providers'
import { DashboardView } from './Dashboard'
import { SuppliersView } from './Suppliers'
import { PaymentView } from './PaymentCenter'
import { TransactionsView } from './Transactions'
import { NotificationsView } from './Notifications'
import { SettingsView } from './Settings'

type View = 'dashboard' | 'suppliers' | 'pay' | 'transactions' | 'notifications' | 'settings'

const NAV: { id: View; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard' },
  { id: 'suppliers', icon: '◎', label: 'Suppliers' },
  { id: 'pay', icon: '⬡', label: 'Pay Now' },
  { id: 'transactions', icon: '◇', label: 'Ledger' },
  { id: 'notifications', icon: '◉', label: 'Alerts' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
]

export function AppShell() {
  const { business, account, logout, unreadCount, refreshAccount } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { refreshAccount() }, [view, refreshAccount])

  const go = (v: View) => { setView(v); setSidebarOpen(false) }
  const fmtBal = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="min-h-screen flex" style={{ position: 'relative', zIndex: 1 }}>
      {/* Animated background orbs & tech grid */}
      <div className="bg-grid" />
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />
      <div className="bg-orb-3" />

      {/* Floating Bubbles */}
      <div className="bubble w-16 h-16" style={{ left: '12%', animationDelay: '0s', animationDuration: '24s' }} />
      <div className="bubble w-20 h-20" style={{ left: '30%', animationDelay: '3s', animationDuration: '28s' }} />
      <div className="bubble w-12 h-12" style={{ left: '48%', animationDelay: '7s', animationDuration: '22s' }} />
      <div className="bubble w-24 h-24" style={{ left: '65%', animationDelay: '1s', animationDuration: '32s' }} />
      <div className="bubble w-14 h-14" style={{ left: '82%', animationDelay: '9s', animationDuration: '26s' }} />
      <div className="bubble w-18 h-18" style={{ left: '92%', animationDelay: '5s', animationDuration: '30s' }} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(7,11,26,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══ Crystal Glass Sidebar ═══ */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col
        transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{
        width: '240px',
        background: 'linear-gradient(180deg, rgba(17,20,28,0.75) 0%, rgba(9,11,17,0.9) 100%)',
        backdropFilter: 'blur(40px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div className="p-5 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center levitate"
            style={{
              background: 'linear-gradient(135deg, var(--color-av-mint), var(--color-av-blue-light))',
              boxShadow: '0 4px 16px rgba(56,189,248,0.2)',
            }}>
            <span style={{ fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#090b11' }}>A</span>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800 }} className="gradient-text">Arvitta</h1>
            <p className="label mt-0.5" style={{ fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--color-av-blue-light)' }}>Payment Intelligence</p>
          </div>
        </div>

        {/* Balance crystal card */}
        <div className="mx-4 p-4 rounded-xl levitate" style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(0,132,255,0.03) 100%)',
          border: '1px solid rgba(56,189,248,0.12)',
          boxShadow: '0 2px 10px rgba(56,189,248,0.02)',
        }}>
          <p className="label mb-1.5">Available Balance</p>
          <p className="stat-num text-lg" style={{ color: 'var(--color-av-white)' }}>
            {fmtBal(account?.balance ?? 0)}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-4 px-3 space-y-0.5">
          {NAV.map(item => {
            const active = view === item.id
            return (
              <button key={item.id} onClick={() => go(item.id)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all relative"
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                  background: active ? 'rgba(56,189,248,0.08)' : 'transparent',