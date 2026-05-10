import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Always fetch fresh list when dropdown opens (so new notifications show immediately)
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnread(data.count)
    } catch {}
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnread(data.unread_count)
    } catch {}
    setLoading(false)
  }

  const handleMarkAllRead = async () => {
    await api.post('/notifications/mark-all-read')
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
  }

  const handleClick = async (n) => {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/read`)
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
      setUnread((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const typeIcon = (type) => {
    if (type === 'order_placed') return '🛒'
    if (type === 'order_status') return '📦'
    if (type === 'new_order') return '🛒'
    if (type === 'new_message') return '💬'
    if (type === 'new_ticket') return '🎫'
    return '🔔'
  }

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="position-relative" ref={dropRef}>
      <button
        className="btn btn-light position-relative"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
      >
        <i className="bi bi-bell" />
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div
          className="notif-dropdown position-absolute end-0 bg-white rounded-3 shadow"
          style={{ zIndex: 1055, top: '110%', maxHeight: 460, display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <span className="fw-bold">Notifications</span>
            {unread > 0 && (
              <button className="btn btn-link btn-sm p-0 text-primary text-decoration-none" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && (
              <div className="text-center py-4 text-muted small">
                <span className="spinner-border spinner-border-sm me-2" />Loading...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-bell-slash fs-2 d-block mb-2 opacity-25" />
                No notifications yet
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className="d-flex align-items-start gap-3 px-3 py-2 border-bottom notif-item"
                style={{ background: n.is_read ? '#fff' : '#f0f7f0', cursor: 'pointer' }}
                onClick={() => handleClick(n)}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{typeIcon(n.type)}</span>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="fw-semibold small text-truncate">{n.title}</div>
                  <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{n.body}</div>
                  <div className="text-muted mt-1" style={{ fontSize: 11 }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && (
                  <span className="rounded-circle bg-primary flex-shrink-0" style={{ width: 8, height: 8, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
