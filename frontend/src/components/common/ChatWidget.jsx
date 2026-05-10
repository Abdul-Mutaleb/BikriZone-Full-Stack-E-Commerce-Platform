import { useState, useEffect, useRef, useCallback } from 'react'
import useAuthStore from '../../store/useAuthStore'
import api from '../../services/api'
import { toast } from 'react-toastify'

const POLL_INTERVAL = 4000 // ms — poll for new messages every 4 seconds

export default function ChatWidget() {
  const { isAuthenticated, user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [orderRef, setOrderRef] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasNewReply, setHasNewReply] = useState(false)  // unread badge on closed chat
  const messagesEndRef = useRef()
  const sendingRef = useRef(false) // track mid-send to skip poll during optimistic update

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load room once when chat opens
  useEffect(() => {
    if (open && isAuthenticated() && !roomId) {
      loadRoom()
    }
    if (open) setHasNewReply(false)
  }, [open])

  const loadRoom = async () => {
    try {
      const { data } = await api.get('/chat/room')
      setRoomId(data.room.id)
      setMessages(data.messages)
    } catch {}
  }

  // Poll for new messages while chat is open and room is loaded
  const pollMessages = useCallback(async () => {
    if (sendingRef.current) return  // skip during optimistic update
    try {
      const { data } = await api.get('/chat/room')
      setMessages((prev) => {
        // Check if there are truly new messages from the server
        const prevIds = new Set(prev.map((m) => m.id))
        const incomingNew = data.messages.filter((m) => !prevIds.has(m.id))
        if (incomingNew.length === 0) return prev

        // If chat is closed and the new message is from admin, show badge
        if (!open) {
          const hasAdminMsg = incomingNew.some((m) => m.sender_type === 'admin')
          if (hasAdminMsg) setHasNewReply(true)
        }

        // Merge: remove temp optimistic messages, add all server messages
        const merged = [
          ...prev.filter((m) => String(m.id).length > 10),  // keep pending temp msgs
          ...data.messages,
        ].filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

        return merged
      })
    } catch {}
  }, [open])

  useEffect(() => {
    if (!open || !isAuthenticated() || !roomId) return
    const interval = setInterval(pollMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [open, roomId, pollMessages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const tempId = Date.now()  // large number → identified as temp
    const tempMsg = {
      id: tempId,
      message: input,
      sender_type: 'user',
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    const msgText = input
    setInput('')
    setLoading(true)
    sendingRef.current = true

    try {
      const { data } = await api.post('/chat/send', {
        message: msgText,
        order_reference: orderRef || null,
      })
      // Replace temp message with confirmed one (+ optional bot reply)
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId)
        const next = [...withoutTemp, data.message]
        if (data.bot_reply) next.push(data.bot_reply)
        return next
      })
    } catch {
      toast.error('Failed to send message')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setLoading(false)
      sendingRef.current = false
    }
  }

  const socialIcons = (
    <div className="d-flex flex-column gap-2 mb-2">
      <a
        href="https://wa.me/8801805232206"
        target="_blank"
        rel="noopener noreferrer"
        title="WhatsApp"
        style={{ width: 46, height: 46, borderRadius: '50%', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, textDecoration: 'none', boxShadow: '0 3px 12px rgba(0,0,0,0.2)' }}
      >
        <i className="bi bi-whatsapp" />
      </a>
      <a
        href="https://www.facebook.com/share/1CewxXexRG/"
        target="_blank"
        rel="noopener noreferrer"
        title="Facebook"
        style={{ width: 46, height: 46, borderRadius: '50%', background: '#1877F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, textDecoration: 'none', boxShadow: '0 3px 12px rgba(0,0,0,0.2)' }}
      >
        <i className="bi bi-facebook" />
      </a>
    </div>
  )

  if (!isAuthenticated()) {
    return (
      <div className="chat-widget">
        {socialIcons}
        <button className="chat-toggle-btn" onClick={() => setOpen(!open)} title="Support Chat">
          <i className="bi bi-chat-dots-fill" />
        </button>
        {open && (
          <div className="chat-box p-3 text-center">
            <i className="bi bi-headset d-block fs-2 mb-2" style={{ color: '#48A111' }} />
            <p className="text-muted mb-3 small">Please login to chat with support</p>
            <a href="/login" className="btn btn-primary btn-sm px-4">Login</a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="chat-widget">
      {!open && socialIcons}
      {/* Toggle Button */}
      <button
        className="chat-toggle-btn position-relative"
        onClick={() => setOpen(!open)}
        title="Live Support"
      >
        <i className={`bi bi-${open ? 'x-lg' : 'chat-dots-fill'}`} />
        {/* Unread badge — admin replied while chat was closed */}
        {!open && hasNewReply && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: 10 }}
          >
            !
          </span>
        )}
      </button>

      {open && (
        <div className="chat-box">
          {/* Header */}
          <div
            className="d-flex align-items-center gap-2 px-3 py-2"
            style={{ background: '#48A111', color: 'white' }}
          >
            <div
              className="rounded-circle bg-white d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 32, height: 32 }}
            >
              <i className="bi bi-headset text-primary" style={{ color: '#48A111' }} />
            </div>
            <div className="flex-grow-1">
              <div className="fw-semibold small">BikriZone Support</div>
              <div className="d-flex align-items-center gap-1">
                <span
                  className="rounded-circle d-inline-block"
                  style={{ width: 7, height: 7, background: '#76ff03' }}
                />
                <span className="small opacity-75" style={{ fontSize: 11 }}>
                  Online · replies in minutes
                </span>
              </div>
            </div>
            <button
              className="btn btn-sm p-0"
              style={{ color: 'white', width: 28, height: 28 }}
              onClick={() => setOpen(false)}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Order Reference */}
          <div className="px-3 py-2 border-bottom bg-light">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Order ID (optional)"
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
            />
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="text-center text-muted small py-4">
                <i className="bi bi-chat-text fs-2 d-block mb-2 opacity-50" />
                Hi {user?.name?.split(' ')[0]}! How can we help you?
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`d-flex ${msg.sender_type === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-2`}
              >
                <div
                  className={`chat-bubble ${msg.sender_type === 'user' ? 'user' : msg.sender_type === 'bot' ? 'bot' : 'agent'}`}
                  style={{ opacity: String(msg.id).length > 10 ? 0.65 : 1 }}
                >
                  {msg.sender_type !== 'user' && (
                    <div className="fw-semibold small mb-1" style={{ color: '#48A111' }}>
                      {msg.sender_type === 'bot' ? '🤖 Bot' : '👨‍💼 Support'}
                    </div>
                  )}
                  {msg.message}
                  {msg.order_reference && (
                    <div className="small opacity-75 mt-1">Ref: {msg.order_reference}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator while sending */}
            {loading && (
              <div className="d-flex justify-content-start mb-2">
                <div className="chat-bubble agent">
                  <div className="d-flex gap-1 align-items-center">
                    <span
                      className="spinner-border spinner-border-sm"
                      style={{ width: 12, height: 12, color: '#48A111' }}
                    />
                    <span className="small text-muted">Sending…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-2 border-top">
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(e)
                  }
                }}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !input.trim()}
              >
                <i className="bi bi-send-fill" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
