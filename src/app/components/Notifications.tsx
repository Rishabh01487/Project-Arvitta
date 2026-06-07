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

  return (
    <div>
      <div className="flex items-center justify-between mb-5 float-in">
        <div>
          <h2 className="heading text-2xl">Notifications</h2>
          <p className="body-text text-xs mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && <button className="av-btn av-btn-ghost py-1.5 px-3 text-xs" onClick={markAllRead}>Mark all read</button>}
      </div>

      {notifs.length === 0 ? (
        <div className="glass p-8 text-center float-in fd-1">
          <p className="text-3xl mb-2.5" style={{ color: 'var(--color-av-blue-light)' }}>◉</p>
          <p className="body-text text-xs font-semibold">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifs.map((n, i) => (
            <div key={n._id} className={`glass-card p-4 shine float-in fd-${Math.min(i + 1, 4)}`}
              style={{
                borderColor: !n.read ? 'rgba(56, 189, 248, 0.15)' : undefined,
                boxShadow: !n.read ? '0 0 16px rgba(56, 189, 248, 0.04)' : undefined,
              }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(56, 189, 248, 0.04))',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                  }}>
                  <span className="text-sm">{TYPE_ICONS[n.type] || '🔔'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold text-white/90">{n.title}</p>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-av-blue-light)', boxShadow: '0 0 8px var(--color-av-blue-glow)' }} />}
                  </div>
                  <p className="body-text text-xs">{n.message}</p>
                  <p className="body-text text-[10px] mt-1.5" style={{ color: 'var(--color-av-gray-dim)' }}>
                    {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
