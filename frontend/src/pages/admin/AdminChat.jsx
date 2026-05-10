import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

const INBOX_POLL = 8000   // refresh room list every 8 s
const MSGS_POLL  = 4000   // refresh active-room messages every 4 s

export default function AdminChat() {
  const [rooms,          setRooms]          = useState([])
  const [activeRoom,     setActiveRoom]     = useState(null)
  const [messages,       setMessages]       = useState([])
  const [reply,          setReply]          = useState('')
  const [cannedReplies,  setCannedReplies]  = useState([])
  const [showCanned,     setShowCanned]     = useState(false)
  const [sending,        setSending]        = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const messagesEndRef = useRef()
  const replyRef       = useRef()

  /* ── scroll to bottom on new messages ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ── initial load ── */
  useEffect(() => {
    document.title = 'Chat Inbox - BikriZone Admin'
    loadInbox()
    loadCannedReplies()
  }, [])

  /* ── poll inbox list ── */
  useEffect(() => {
    const id = setInterval(loadInbox, INBOX_POLL)
    return () => clearInterval(id)
  }, [])

  /* ── poll active-room messages (so admin sees new user messages live) ── */
  const pollRoom = useCallback(async () => {
    if (!activeRoom) return
    try {
      const { data } = await api.get(`/admin/chat/rooms/${activeRoom.id}`)
      setMessages((prev) => {
        const prevIds = new Set(prev.map((m) => m.id))
        const fresh   = data.messages.filter((m) => !prevIds.has(m.id))
        return fresh.length ? [...prev, ...fresh] : prev
      })
    } catch {}
  }, [activeRoom])

  useEffect(() => {
    if (!activeRoom) return
    const id = setInterval(pollRoom, MSGS_POLL)
    return () => clearInterval(id)
  }, [activeRoom, pollRoom])

  /* ── API helpers ── */
  const loadInbox = async () => {
    try {
      const { data } = await api.get('/admin/chat/inbox')
      setRooms(data.data ?? data)
    } catch {}
  }

  const loadCannedReplies = async () => {
    try {
      const { data } = await api.get('/admin/chat/canned-responses')
      setCannedReplies(data)
    } catch {}
  }

  const openRoom = async (room) => {
    setActiveRoom(room)
    setReply('')
    setShowCanned(false)
    setMobileShowChat(true)
    try {
      const { data } = await api.get(`/admin/chat/rooms/${room.id}`)
      setMessages(data.messages ?? [])
      loadInbox()
      setTimeout(() => replyRef.current?.focus(), 120)
    } catch {
      setMessages([])
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim() || !activeRoom || sending) return
    setSending(true)
    try {
      const { data } = await api.post(
        `/admin/chat/rooms/${activeRoom.id}/reply`,
        { message: reply }
      )
      setMessages((prev) => [...prev, data.message])
      setReply('')
      setShowCanned(false)
      loadInbox()
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const closeRoom = async () => {
    if (!activeRoom) return
    try {
      await api.post(`/admin/chat/rooms/${activeRoom.id}/close`)
      setActiveRoom((r) => ({ ...r, status: 'closed' }))
      toast.success('Chat closed')
      loadInbox()
    } catch {
      toast.error('Could not close chat')
    }
  }

  const reopenRoom = async () => {
    if (!activeRoom) return
    try {
      await api.post(`/admin/chat/rooms/${activeRoom.id}/reopen`)
      setActiveRoom((r) => ({ ...r, status: 'open' }))
      toast.success('Chat reopened')
      loadInbox()
      setTimeout(() => replyRef.current?.focus(), 120)
    } catch {
      setActiveRoom((r) => ({ ...r, status: 'open' }))
    }
  }

  const backToList = () => {
    setMobileShowChat(false)
    setActiveRoom(null)
    setMessages([])
  }

  const isClosed   = activeRoom?.status === 'closed'
  const unreadTotal = rooms.filter((r) => r.unread_count > 0).length

  /* ── panel visibility helpers ── */
  // On mobile we toggle between list and chat; on desktop both always visible
  const listStyle = {
    width: 300,
    minWidth: 260,
    flexShrink: 0,
    borderRight: '1px solid #dee2e6',
    overflowY: 'auto',
    background: '#fff',
  }
  const chatStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    minWidth: 0,
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="fw-bold mb-0">Chat Inbox</h4>
          <small className="text-muted">Manage live customer conversations</small>
        </div>
        {unreadTotal > 0 && (
          <span className="badge rounded-pill bg-danger fs-6">{unreadTotal} unread</span>
        )}
      </div>

      {/* ── Main panel ── */}
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 210px)',
          minHeight: 500,
          border: '1px solid #dee2e6',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}
      >
        {/* ════ ROOMS LIST ════ */}
        <div
          className={mobileShowChat ? 'd-none d-md-flex' : 'd-flex'}
          style={{ ...listStyle, flexDirection: 'column' }}
        >
          {/* list header */}
          <div className="px-3 py-2 border-bottom bg-light fw-semibold small text-muted d-flex justify-content-between align-items-center">
            <span>Conversations</span>
            <span className="badge bg-secondary">{rooms.length}</span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {rooms.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                <i className="bi bi-chat-dots fs-1 opacity-25 mb-2" />
                <small>No conversations yet</small>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => openRoom(room)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 14px',
                    borderBottom: '1px solid #f0f0f0',
                    background: activeRoom?.id === room.id ? '#e8f5e9' : '#fff',
                    transition: 'background 0.15s',
                  }}
                >
                  <div className="d-flex align-items-start gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 40, height: 40, background: '#48A111', fontSize: 15 }}
                    >
                      {room.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold" style={{ fontSize: 13 }}>{room.user?.name}</span>
                        {room.unread_count > 0 && (
                          <span className="badge rounded-pill bg-danger" style={{ fontSize: 10 }}>
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: 12 }}>
                        {room.latest_message?.message ?? 'No messages yet'}
                      </div>
                      <span
                        className={`badge bg-${room.status === 'open' ? 'success' : 'secondary'} mt-1`}
                        style={{ fontSize: 10 }}
                      >
                        {room.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ════ CHAT AREA ════ */}
        <div
          className={mobileShowChat ? '' : 'd-none d-md-flex'}
          style={chatStyle}
        >
          {!activeRoom ? (
            /* placeholder */
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
              <i className="bi bi-chat-square-text" style={{ fontSize: 56, opacity: 0.15 }} />
              <p className="mt-3 small">Select a conversation to view &amp; reply</p>
            </div>
          ) : (
            <>
              {/* ── Chat header ── */}
              <div
                className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0"
                style={{ background: '#f8faf8', minHeight: 56 }}
              >
                <div className="d-flex align-items-center gap-2">
                  {/* mobile back */}
                  <button
                    className="btn btn-sm btn-light d-md-none"
                    onClick={backToList}
                  >
                    <i className="bi bi-arrow-left" />
                  </button>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                    style={{ width: 36, height: 36, background: '#48A111' }}
                  >
                    {activeRoom.user?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: 14 }}>{activeRoom.user?.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{activeRoom.user?.email}</div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  {isClosed ? (
                    <button className="btn btn-sm btn-outline-success" onClick={reopenRoom}>
                      <i className="bi bi-arrow-counterclockwise me-1" />Reopen
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline-secondary" onClick={closeRoom}>
                      <i className="bi bi-x-circle me-1" />Close Chat
                    </button>
                  )}
                </div>
              </div>

              {/* ── Closed notice ── */}
              {isClosed && (
                <div
                  className="text-center py-2 flex-shrink-0"
                  style={{ background: '#fff8e1', borderBottom: '1px solid #ffe082', fontSize: 13 }}
                >
                  <i className="bi bi-lock-fill text-warning me-1" />
                  This chat is closed.{' '}
                  <button className="btn btn-link btn-sm p-0 text-success fw-semibold" onClick={reopenRoom}>
                    Reopen
                  </button>{' '}
                  to send a reply.
                </div>
              )}

              {/* ── Messages ── */}
              <div
                className="flex-grow-1 overflow-auto p-3"
                style={{ background: '#f0f4f0' }}
              >
                {messages.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-chat-left-dots d-block fs-2 opacity-25 mb-2" />
                    <small>No messages in this conversation</small>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`d-flex mb-2 ${msg.sender_type === 'admin' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`chat-bubble ${msg.sender_type === 'admin' ? 'user' : 'agent'}`}
                      style={{ maxWidth: '75%' }}
                    >
                      {msg.sender_type !== 'admin' && (
                        <div className="fw-semibold mb-1" style={{ fontSize: 11, color: '#48A111' }}>
                          {msg.sender_type === 'bot' ? '🤖 Bot' : (msg.user?.name ?? 'Customer')}
                        </div>
                      )}
                      <div style={{ fontSize: 14 }}>{msg.message}</div>
                      {msg.order_reference && (
                        <div className="opacity-75 mt-1" style={{ fontSize: 11 }}>
                          Order: {msg.order_reference}
                        </div>
                      )}
                      <div className="text-end opacity-50 mt-1" style={{ fontSize: 10 }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Canned responses ── */}
              {showCanned && cannedReplies.length > 0 && (
                <div
                  className="border-top p-2 bg-white flex-shrink-0"
                  style={{ maxHeight: 140, overflowY: 'auto' }}
                >
                  <div className="text-muted fw-semibold mb-1 px-1" style={{ fontSize: 11 }}>
                    Quick Replies
                  </div>
                  {cannedReplies.map((cr) => (
                    <button
                      key={cr.id}
                      className="btn btn-sm btn-outline-secondary w-100 text-start mb-1"
                      onClick={() => {
                        setReply(cr.response)
                        setShowCanned(false)
                        replyRef.current?.focus()
                      }}
                    >
                      <code className="me-2 text-primary">{cr.shortcut}</code>
                      <span className="text-muted">{cr.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Reply form ── */}
              <form
                onSubmit={sendReply}
                className="flex-shrink-0 border-top bg-white p-2"
              >
                <div className="input-group">
                  {cannedReplies.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowCanned((s) => !s)}
                      title="Quick replies"
                      disabled={isClosed}
                    >
                      <i className="bi bi-lightning" />
                    </button>
                  )}
                  <input
                    ref={replyRef}
                    className="form-control"
                    placeholder={isClosed ? 'Chat is closed — click Reopen first' : 'Type your reply and press Enter…'}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    disabled={sending || isClosed}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendReply(e)
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary px-3"
                    type="submit"
                    disabled={sending || !reply.trim() || isClosed}
                  >
                    {sending
                      ? <span className="spinner-border spinner-border-sm" />
                      : <i className="bi bi-send-fill" />
                    }
                  </button>
                </div>
                {!isClosed && (
                  <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                    Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
