'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface Notif { _id: string; type: string; title: string; message: string; read: boolean; createdAt: string }

export function NotificationsView() {
  const { authFetch, refreshNotifications } = useAuth()
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
    load(); refreshNotifications()
  }

  return (
    <div className="page-wrap">
      <div className="float-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Notifications</div>
          <div className="subtitle" style={{ marginTop: 2 }}>{unread > 0 ? `${unread} unread` : 'All caught up'}</div>
        </div>
        {unread > 0 && <button className="av-btn av-btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }} onClick={markAllRead}>Mark all read</button>}
      </div>

      {notifs.length === 0 ? (
        <div className="card float-in d1" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div className="subtitle">No notifications</div>
        </div>
      ) : (
        <div className="float-in d1" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifs.map(n => (
            <div key={n._id} className="card" style={{ padding: '14px 18px', borderColor: !n.read ? 'var(--color-av-accent-border)' : undefined }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--color-av-accent-bg)' }}>
                  <span style={{ fontSize: 12 }}>{n.type === 'credit' ? '💰' : n.type === 'payout_complete' ? '📦' : n.type === 'payout_failed' ? '❌' : '🔔'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</span>
                    {!n.read && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--color-av-accent)', flexShrink: 0 }} />}
                  </div>
                  <div className="subtitle" style={{ fontSize: 11, marginTop: 2 }}>{n.message}</div>
                  <div className="subtitle" style={{ fontSize: 10, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
