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
  { id: 'dashboard', icon: '\u25C8', label: 'Dashboard' },
  { id: 'suppliers', icon: '\u25CE', label: 'Suppliers' },
  { id: 'pay', icon: '\u2B21', label: 'Pay Now' },
  { id: 'transactions', icon: '\u25C7', label: 'Ledger' },
  { id: 'notifications', icon: '\u25C9', label: 'Alerts' },
  { id: 'settings', icon: '\u2699', label: 'Settings' },
]

export function AppShell() {
  const { business, account, logout, unreadCount, refreshAccount } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { refreshAccount() }, [view, refreshAccount])

  const go = (v: View) => { setView(v); setSidebarOpen(false) }
  const fmtBal = (n: number) => `\u20B9${n.toLocaleString('en-IN')}`

  return (
    <div className="min-h-screen flex" style={{ position: 'relative', zIndex: 1 }}>
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />
      <div className="bg-orb-3" />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col
        transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{
        width: '240px',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRight: '1px solid var(--color-av-glass-border)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.04)',
      }}>
        <div className="p-5 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center levitate"
            style={{
              background: 'linear-gradient(135deg, var(--color-av-accent), #4338ca)',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.2)',
            }}>
            <span style={{ fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff' }}>A</span>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-av-text)' }}>Arvitta</h1>
            <p className="label mt-0.5" style={{ fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--color-av-accent)' }}>Payment Intelligence</p>
          </div>
        </div>

        <div className="mx-4 p-4 rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(79, 70, 229, 0.02) 100%)',
          border: '1px solid var(--color-av-accent-border)',
        }}>
          <p className="label mb-1.5">Available Balance</p>
          <p className="stat-num text-lg" style={{ color: 'var(--color-av-text)' }}>
            {fmtBal(account?.balance ?? 0)}
          </p>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-0.5">
          {NAV.map(item => {
            const active = view === item.id
            return (
              <button key={item.id} onClick={() => go(item.id)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all relative"
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                  background: active ? 'var(--color-av-accent-bg)' : 'transparent',
                  color: active ? 'var(--color-av-accent)' : 'var(--color-av-text-secondary)',
                  borderLeft: active ? '2px solid var(--color-av-accent)' : '2px solid transparent',
                }}>
                <span style={{ fontSize: '0.92rem', opacity: active ? 1 : 0.5 }}>{item.icon}</span>
                {item.label}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{ background: 'var(--color-av-accent)', color: '#fff' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mx-5 accent-line" />

        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
              style={{
                background: 'var(--color-av-accent-bg)',
                border: '1px solid var(--color-av-accent-border)',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                color: 'var(--color-av-accent)',
              }}>
              {business?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-av-text)' }} className="truncate">{business?.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--color-av-text-muted)' }}>{business?.email}</p>
            </div>
            <button onClick={logout} className="p-2 rounded-lg" style={{ color: 'var(--color-av-text-muted)' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--color-av-danger)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--color-av-text-muted)')}>✕</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen relative" style={{ zIndex: 1 }}>
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 py-4"
          style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-av-glass-border)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--color-av-text-secondary)', fontSize: '1.2rem' }}>☰</button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-av-text)' }}>Arvitta</h1>
          <button onClick={() => go('notifications')} className="relative">
            <span style={{ color: 'var(--color-av-text-secondary)' }}>◉</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: 'var(--color-av-accent)', color: '#fff' }}>{unreadCount}</span>
            )}
          </button>
        </header>

        <div className="p-6 lg:p-10 max-w-6xl mx-auto float-in" key={view}>
          {view === 'dashboard' && <DashboardView onNavigate={go as (v: string) => void} />}
          {view === 'suppliers' && <SuppliersView />}
          {view === 'pay' && <PaymentView />}
          {view === 'transactions' && <TransactionsView />}
          {view === 'notifications' && <NotificationsView />}
          {view === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  )
}
