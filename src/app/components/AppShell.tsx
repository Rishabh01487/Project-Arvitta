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