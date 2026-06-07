'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Business {
  id: string
  name: string
  ownerName: string
  email: string
  phone: string
}

interface Account {
  balance: number
  totalCredited: number
  totalDebited: number
  lastCreditedAt: string | null
  lastCreditAmount: number
}

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  actionUrl?: string
  createdAt: string
}

interface AuthContextType {
  token: string | null
  business: Business | null
  account: Account | null
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>
  demoLogin: () => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshAccount: () => Promise<void>
  refreshNotifications: () => Promise<void>
  authFetch: (url: string, opts?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const authFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    const t = token || localStorage.getItem('pf_token')
    return fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...opts.headers,
      },
    })
  }, [token])

  const refreshAccount = useCallback(async () => {
    try {
      const res = await authFetch('/api/account')
      if (res.ok) {
        const data = await res.json()
        setAccount(data.account)
      }
    } catch (e) { console.error('refreshAccount error:', e) }
  }, [authFetch])

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (e) { console.error('refreshNotifications error:', e) }
  }, [authFetch])

  // Init: check for stored token
  useEffect(() => {
    const stored = localStorage.getItem('pf_token')
    if (stored) {
      setToken(stored)
      // Fetch profile
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.business) {
            setBusiness(data.business)
            setAccount(data.account)
          } else {
            localStorage.removeItem('pf_token')
          }
        })
        .catch(() => localStorage.removeItem('pf_token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  // Poll notifications every 30s when logged in
  useEffect(() => {
    if (!token) return
    refreshNotifications()