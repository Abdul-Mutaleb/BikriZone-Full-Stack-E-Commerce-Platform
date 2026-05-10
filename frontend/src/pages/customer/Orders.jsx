import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const statusColors = { pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger', refunded: 'secondary' }

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    document.title = 'My Orders - BikriZone'
    loadOrders()
  }, [page])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/orders?page=${page}`)
      setOrders(data.data)
      setPagination(data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">My Orders</h2>
      {orders.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-bag fs-1 text-muted opacity-50 d-block mb-3" />
          <h5>No orders yet</h5>
          <p className="text-muted mb-4">Start shopping to place your first order!</p>
          <Link to="/products" className="btn btn-primary">Shop Now</Link>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div>
                  <span className="fw-bold">{order.order_number}</span>
                  <small className="text-muted ms-2">{new Date(order.created_at).toLocaleDateString()}</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <span className={`badge bg-${statusColors[order.status] || 'secondary'} text-capitalize`}>{order.status}</span>
                  <span className="badge bg-light text-dark">{order.payment_method.toUpperCase()}</span>
                  <span className="fw-bold" style={{ color: '#48A111' }}>৳{order.total}</span>
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap mb-2">
                {order.items?.slice(0, 3).map((item) => (
                  <span key={item.id} className="badge bg-light text-dark">{item.product_name} ×{item.quantity}</span>
                ))}
                {order.items?.length > 3 && <span className="badge bg-light text-dark">+{order.items.length - 3} more</span>}
              </div>
              <Link to={`/orders/${order.id}`} className="btn btn-outline-primary btn-sm">
                View Details <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>
          </div>
        ))
      )}
      {pagination && pagination.last_page > 1 && (
        <nav className="d-flex justify-content-center mt-3">
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(page - 1)}>‹</button>
            </li>
            {(() => {
              const last = pagination.last_page
              const delta = 2
              const start = Math.max(1, page - delta)
              const end = Math.min(last, page + delta)
              const pages = []
              if (start > 1) { pages.push(1); if (start > 2) pages.push('…') }
              for (let i = start; i <= end; i++) pages.push(i)
              if (end < last) { if (end < last - 1) pages.push('…'); pages.push(last) }
              return pages.map((p, i) =>
                p === '…' ? (
                  <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                ) : (
                  <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                )
              )
            })()}
            <li className={`page-item ${page === pagination.last_page ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(page + 1)}>›</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}
