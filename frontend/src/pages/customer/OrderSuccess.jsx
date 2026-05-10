import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'

export default function OrderSuccess() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    document.title = 'Order Confirmed - BikriZone'
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch(() => {})
  }, [id])

  return (
    <div className="container py-5">
      <div className="text-center py-4">
        <div className="mb-3">
          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: 80, height: 80, background: '#d4edda' }}>
            <i className="bi bi-check-lg text-success" style={{ fontSize: 36 }} />
          </div>
        </div>
        <h2 className="fw-bold text-success mb-2">Order Placed Successfully!</h2>
        {order && (
          <p className="text-muted mb-4">Your order <strong>#{order.order_number}</strong> has been confirmed. {order.payment_method === 'cod' ? "You'll pay on delivery." : "Payment verified."}</p>
        )}
        <div className="d-flex gap-3 justify-content-center">
          <Link to="/orders" className="btn btn-primary">Track My Orders</Link>
          <Link to="/" className="btn btn-outline-secondary">Continue Shopping</Link>
        </div>
      </div>

      {order && (
        <div className="card border-0 shadow-sm mx-auto mt-4" style={{ maxWidth: 600 }}>
          <div className="card-body">
            <h6 className="fw-bold mb-3">Order Details</h6>
            <div className="row g-2 mb-3 small">
              <div className="col-6"><span className="text-muted">Order Number:</span><br /><strong>{order.order_number}</strong></div>
              <div className="col-6"><span className="text-muted">Status:</span><br /><span className="badge bg-warning text-dark">{order.status}</span></div>
              <div className="col-6"><span className="text-muted">Payment:</span><br /><span className="badge bg-primary">{order.payment_method.toUpperCase()}</span></div>
              <div className="col-6"><span className="text-muted">Total:</span><br /><strong style={{ color: '#48A111' }}>৳{order.total}</strong></div>
            </div>
            <h6 className="fw-semibold mb-2">Items Ordered</h6>
            {order.items?.map((item) => (
              <div key={item.id} className="d-flex justify-content-between small border-bottom pb-2 mb-2">
                <span>{item.product_name} ×{item.quantity}</span>
                <span>৳{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
