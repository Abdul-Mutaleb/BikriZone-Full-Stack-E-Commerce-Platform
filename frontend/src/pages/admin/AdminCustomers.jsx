import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function AdminCustomers() {
  const [customers,   setCustomers]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [selected,    setSelected]    = useState(null)
  const [pagination,  setPagination]  = useState(null)
  const [page,        setPage]        = useState(1)
  const [detailTab,   setDetailTab]   = useState('info')   // 'info' | 'message'

  // messaging state
  const [chatRoom,    setChatRoom]    = useState(null)
  const [chatMsgs,    setChatMsgs]   = useState([])
  const [replyText,   setReplyText]   = useState('')
  const [sendingMsg,  setSendingMsg]  = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const msgsEndRef = useRef()

  useEffect(() => {
    document.title = 'Customers - BikriZone Admin'
    loadCustomers()
  }, [search, page])

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/customers', { params: { search, page } })
      setCustomers(data.data)
      setPagination(data)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (customer) => {
    await api.post(`/admin/customers/${customer.id}/toggle-status`)
    toast.success('Status updated')
    loadCustomers()
  }

  const openCustomer = async (id) => {
    const { data } = await api.get(`/admin/customers/${id}`)
    setSelected(data)
    setDetailTab('info')
    setChatRoom(null)
    setChatMsgs([])
    setReplyText('')
  }

  const updateRole = async (id, role) => {
    await api.put(`/admin/customers/${id}/role`, { role })
    toast.success('Role updated')
    loadCustomers()
  }

  const openMessageTab = async () => {
    setDetailTab('message')
    if (!selected || chatRoom) return
    setLoadingChat(true)
    try {
      const { data } = await api.get(`/admin/chat/user/${selected.id}/room`)
      setChatRoom(data.room)
      setChatMsgs(data.messages)
    } catch {
      toast.error('Could not load chat room')
    } finally {
      setLoadingChat(false)
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !chatRoom || sendingMsg) return
    setSendingMsg(true)
    try {
      const { data } = await api.post(`/admin/chat/rooms/${chatRoom.id}/reply`, { message: replyText })
      setChatMsgs((prev) => [...prev, data.message])
      setReplyText('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendingMsg(false)
    }
  }

  const closeDetail = () => {
    setSelected(null)
    setChatRoom(null)
    setChatMsgs([])
  }

  return (
    <div>
      <h3 className="fw-bold mb-4">Customers</h3>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <input
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* ── Customer Table ── */}
        <div className={selected ? 'col-lg-7' : 'col-12'}>
          {loading ? <LoadingSpinner /> : (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Customer</th>
                      <th>Orders</th>
                      <th>LTV</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        style={{ cursor: 'pointer', background: selected?.id === c.id ? '#f0f9f0' : '' }}
                        onClick={() => openCustomer(c.id)}
                      >
                        <td>
                          <div className="fw-medium">{c.name}</div>
                          <small className="text-muted">{c.email}</small>
                        </td>
                        <td>{c.orders_count}</td>
                        <td className="fw-bold" style={{ color: '#48A111' }}>৳{c.lifetime_value || 0}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            style={{ width: 130 }}
                            value={c.role}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); updateRole(c.id, e.target.value) }}
                          >
                            {['customer', 'admin', 'order_manager', 'super_admin'].map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`badge bg-${c.is_active ? 'success' : 'danger'}`}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${c.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={(e) => { e.stopPropagation(); toggleStatus(c) }}
                          >
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">No customers found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.last_page > 1 && (
                <div className="card-footer d-flex justify-content-center">
                  <ul className="pagination pagination-sm mb-0">
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                      <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Customer Detail Panel ── */}
        {selected && (
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm" style={{ position: 'sticky', top: 80 }}>
              {/* Header */}
              <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                    style={{ width: 36, height: 36, background: '#48A111', fontSize: 15 }}
                  >
                    {selected.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-semibold small">{selected.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{selected.email}</div>
                  </div>
                </div>
                <button className="btn-close btn-sm" onClick={closeDetail} />
              </div>

              {/* Tabs */}
              <div className="border-bottom">
                <ul className="nav nav-tabs border-0 px-3 pt-1">
                  <li className="nav-item">
                    <button
                      className={`nav-link py-2 px-3 small ${detailTab === 'info' ? 'active fw-semibold' : 'text-muted'}`}
                      onClick={() => setDetailTab('info')}
                    >
                      <i className="bi bi-person me-1" />Info
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-2 px-3 small ${detailTab === 'message' ? 'active fw-semibold' : 'text-muted'}`}
                      onClick={openMessageTab}
                    >
                      <i className="bi bi-chat-dots me-1" />Message
                      {chatRoom?.unread_count > 0 && (
                        <span className="badge bg-danger ms-1" style={{ fontSize: 10 }}>
                          {chatRoom.unread_count}
                        </span>
                      )}
                    </button>
                  </li>
                </ul>
              </div>

              {/* ── Info Tab ── */}
              {detailTab === 'info' && (
                <div className="card-body small">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="text-muted mb-1">Phone</div>
                      <div className="fw-medium">{selected.phone || '—'}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted mb-1">Joined</div>
                      <div className="fw-medium">{new Date(selected.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted mb-1">Total Orders</div>
                      <div className="fw-bold">{selected.orders?.length ?? 0}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted mb-1">Status</div>
                      <span className={`badge bg-${selected.is_active ? 'success' : 'danger'}`}>
                        {selected.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mb-3">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={openMessageTab}
                    >
                      <i className="bi bi-chat-dots me-1" />Send Message
                    </button>
                  </div>

                  <h6 className="fw-semibold mt-1 mb-2">Recent Orders</h6>
                  {selected.orders?.length === 0 && (
                    <div className="text-muted small">No orders yet.</div>
                  )}
                  {selected.orders?.slice(0, 5).map((order) => (
                    <div key={order.id} className="d-flex justify-content-between border-bottom pb-2 mb-2">
                      <div>
                        <div className="fw-medium">{order.order_number}</div>
                        <small className="text-muted">{order.status}</small>
                      </div>
                      <span className="fw-bold" style={{ color: '#48A111' }}>৳{order.total}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Message Tab ── */}
              {detailTab === 'message' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
                  {loadingChat ? (
                    <div className="d-flex align-items-center justify-content-center flex-grow-1">
                      <span className="spinner-border text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Messages */}
                      <div
                        className="flex-grow-1 overflow-auto p-3"
                        style={{ background: '#f0f4f0' }}
                      >
                        {chatMsgs.length === 0 && (
                          <div className="text-center text-muted py-4">
                            <i className="bi bi-chat-left-dots d-block fs-2 opacity-25 mb-2" />
                            <small>No messages yet. Send the first message below.</small>
                          </div>
                        )}
                        {chatMsgs.map((msg) => (
                          <div
                            key={msg.id}
                            className={`d-flex mb-2 ${msg.sender_type === 'admin' ? 'justify-content-end' : 'justify-content-start'}`}
                          >
                            <div
                              className={`chat-bubble ${msg.sender_type === 'admin' ? 'user' : 'agent'}`}
                              style={{ maxWidth: '80%' }}
                            >
                              {msg.sender_type !== 'admin' && (
                                <div className="fw-semibold mb-1" style={{ fontSize: 11, color: '#48A111' }}>
                                  {msg.sender_type === 'bot' ? '🤖 Bot' : selected.name}
                                </div>
                              )}
                              <div style={{ fontSize: 13 }}>{msg.message}</div>
                              <div className="text-end opacity-50 mt-1" style={{ fontSize: 10 }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={msgsEndRef} />
                      </div>

                      {/* Reply form */}
                      <form
                        onSubmit={sendReply}
                        className="p-2 border-top bg-white flex-shrink-0"
                      >
                        <div className="input-group input-group-sm">
                          <input
                            className="form-control"
                            placeholder="Type a message and press Enter…"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            disabled={sendingMsg}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendReply(e)
                              }
                            }}
                            autoFocus
                          />
                          <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={sendingMsg || !replyText.trim()}
                          >
                            {sendingMsg
                              ? <span className="spinner-border spinner-border-sm" />
                              : <i className="bi bi-send-fill" />
                            }
                          </button>
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                          <i className="bi bi-whatsapp me-1 text-success" />
                          Message delivered to customer's live chat widget
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
