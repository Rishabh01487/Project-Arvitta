'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Notif { _id: string; type: string; title: string; message: string; read: boolean; createdAt: string }

const TYPE_ICONS: Record<string, string> = { credit: '💰', payout_complete: '📦', payout_failed: '❌', suggestion: '⚡', system: '🔔' }

export function NotificationsView() {
  const { authFetch, refreshUnread } = useAuth()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications')
      if (res.ok) { const d = await res.json(); setNotifs(d.notifications); setUnread(d.unreadCount) }
    } catch (e) { console.error(e) }
  }, [authFetch])

  useEffect(() => { load() }, [load])

  const markAllRead = async () => {
    await authFetch('/api/notifications', { method: 'PUT' })
    load(); refreshUnread()
  }