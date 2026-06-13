'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../providers'

interface AuditLog {
  _id: string
  action: string
  category: 'auth' | 'finance' | 'security' | 'system'
  status: 'success' | 'failure'
  description: string
  ipAddress?: string
  metadata?: Record<string, any>
  createdAt: string
}

export function AuditTrailView() {
  const { authFetch } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category,
        status,
        query,
        page: page.toString(),
        limit: '15',
      })
      const res = await authFetch(`/api/audit-logs?${params.toString()}`)
      if (res.ok) {
        const d = await res.json()
        setLogs(d.logs || [])
        setTotalPages(d.pagination?.pages || 1)
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e)
    }
    setLoading(false)
  }, [authFetch, category, status, query, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setPage(1)
  }

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const handleStatusChange = (stat: string) => {
    setStatus(stat)
    setPage(1)
  }

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'auth': return '🔑'
      case 'finance': return '💰'
      case 'security': return '🛡️'
      case 'system': return '⚙️'
      default: return '📜'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 float-in">
        <div>
          <h2 className="heading text-2xl">Security Audit Trail</h2>
          <p className="body-text text-xs mt-0.5">Real-time system actions and cryptographic ledger logs</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass p-4 mb-5 flex flex-col md:flex-row gap-4 justify-between items-center float-in fd-1">
        <div className="w-full md:w-auto flex flex-wrap gap-1.5">
          {['all', 'auth', 'finance', 'security', 'system'].map(c => (
            <button key={c} onClick={() => handleCategoryChange(c)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: category === c ? 'linear-gradient(135deg, var(--color-av-accent), #4338ca)' : 'var(--color-av-bg)',
                color: category === c ? '#fff' : 'var(--color-av-text-secondary)',
                border: `1px solid ${category === c ? 'var(--color-av-accent-border)' : 'var(--color-av-glass-border)'}`,
              }}>
              {c}
            </button>
          ))}
        </div>

        <div className="w-full md:w-auto flex gap-3 items-center">
          <select value={status} onChange={e => handleStatusChange(e.target.value)}
            className="av-input py-1.5 px-3 text-xs w-32" style={{ background: 'var(--color-av-bg)' }}>
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          <input type="text" placeholder="Search logs..." value={query} onChange={handleSearchChange}
            className="av-input py-1.5 px-3 text-xs w-full md:w-48" />
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="spinner mx-auto mb-3"></div>
          <p className="body-text text-xs">Fetching audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass p-12 text-center float-in fd-2">
          <p className="body-text text-xs font-semibold">No matching audit logs found.</p>
        </div>
      ) : (
        <div className="space-y-2.5 float-in fd-2">
          {logs.map((log, i) => (
            <div key={log._id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shine">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: log.status === 'success' ? 'var(--color-av-accent-bg)' : 'var(--color-av-danger-bg)',
                    border: `1px solid ${log.status === 'success' ? 'var(--color-av-accent-border)' : 'rgba(220, 38, 38, 0.15)'}`,
                  }}>
                  <span className="text-base">{getCategoryEmoji(log.category)}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-av-text)' }}>
                      {log.action.replace('_', ' ')}
                    </p>
                    <span className={`badge badge-${log.status === 'success' ? 'low' : 'critical'}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                      {log.status}
                    </span>
                    {log.ipAddress && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--color-av-text-muted)' }}>
                        {log.ipAddress}
                      </span>
                    )}
                  </div>
                  <p className="body-text text-xs pr-4 leading-normal">{log.description}</p>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--color-av-text-muted)', fontWeight: 600 }}>
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <button className="av-btn av-btn-ghost self-start sm:self-center text-[10px] py-1.5 px-3"
                  onClick={() => setSelectedLog(log)}>
                  Inspect Info
                </button>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--color-av-glass-border)' }}>
              <button className="av-btn av-btn-ghost py-1.5 px-3 text-xs"
                onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
                ← Previous
              </button>
              <span className="body-text text-xs">Page {page} of {totalPages}</span>
              <button className="av-btn av-btn-ghost py-1.5 px-3 text-xs"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" style={{ padding: '24px', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="heading text-base">Metadata Inspector</h3>
                <p className="body-text text-[10px] mt-0.5">Payload for {selectedLog.action}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ color: 'var(--color-av-text-muted)' }}>✕</button>
            </div>
            
            <div className="p-3.5 rounded-xl border text-[11px] overflow-auto max-h-[300px]"
              style={{
                background: 'var(--color-av-bg)',
                borderColor: 'var(--color-av-glass-border)',
                fontFamily: 'monospace',
                color: 'var(--color-av-text-secondary)',
              }}>
              <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
            </div>

            <button className="av-btn av-btn-primary w-full py-2 mt-4 text-xs" onClick={() => setSelectedLog(null)}>
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
