'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Business {
  id: string
  name: string
  ownerName: string
  email: string
  phone: string
  address?: string
  gstin?: string
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
  refreshUnread: () => Promise<void>
  refreshProfile: () => Promise<void>
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

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authFetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.business) {
          setBusiness(data.business)
          setAccount(data.account)
        }
      }
    } catch (e) { console.error('refreshProfile error:', e) }
  }, [authFetch])

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

  const refreshUnread = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount)
      }
    } catch (e) { console.error('refreshUnread error:', e) }
  }, [authFetch])

  // Init: check for stored token
  useEffect(() => {
    const stored = localStorage.getItem('pf_token')
    if (stored) {
      setToken(stored)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      // Fetch profile
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${stored}` },
        signal: controller.signal,
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
        .finally(() => { clearTimeout(timeout); setIsLoading(false) })
    } else {
      setIsLoading(false)
    }
  }, [])

  // Poll notifications every 30s when logged in
  useEffect(() => {
    if (!token) return
    refreshNotifications()
    const interval = setInterval(refreshNotifications, 30000)
    return () => clearInterval(interval)
  }, [token, refreshNotifications])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        setToken(data.token)
        setBusiness(data.business)
        localStorage.setItem('pf_token', data.token)
        // Fetch account
        setTimeout(() => refreshAccount(), 100)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const register = async (formData: Record<string, string>) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setToken(data.token)
        setBusiness(data.business)
        localStorage.setItem('pf_token', data.token)
        setTimeout(() => refreshAccount(), 100)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const demoLogin = async () => {
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setToken(data.token)
        setBusiness(data.business)
        localStorage.setItem('pf_token', data.token)
        setTimeout(() => refreshAccount(), 100)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    setToken(null)
    setBusiness(null)
    setAccount(null)
    setNotifications([])
    setUnreadCount(0)
    localStorage.removeItem('pf_token')
  }

  return (
    <AuthContext.Provider value={{
      token, business, account, notifications, unreadCount, isLoading,
      login, register, demoLogin, logout, refreshAccount, refreshNotifications, refreshUnread, refreshProfile, authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
