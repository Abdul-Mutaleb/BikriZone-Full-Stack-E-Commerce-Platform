import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const statusColors = { pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger' }
const statusSteps = ['pending', 'processing', 'shipped', 'delivered']

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const invoiceRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/orders/${id}`).then(({ data }) => {
      setOrder(data)
      document.title = `Order ${data.order_number} - BikriZone`
    }).finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => {
    const wrap = document.getElementById('invoicePrintWrap')
    if (wrap && invoiceRef.current) {
      wrap.innerHTML = invoiceRef.current.innerHTML
      wrap.style.display = 'block'
      window.print()
      wrap.style.display = 'none'
      wrap.innerHTML = ''
    }
  }

  if (loading) return <LoadingSpinner />
  if (!order) return <div className="container py-5 text-center">Order not found</div>

  const currentStep = statusSteps.indexOf(order.status)

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/orders">My Orders</Link></li>
          <li className="breadcrumb-item active">{order.order_number}</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Order {order.order_number}</h3>
        <div className="d-flex gap-2 align-items-center">
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowInvoice(true)}>
            <i className="bi bi-file-earmark-text me-1" />Invoice
          </button>
          <span className={`badge bg-${statusColors[order.status] || 'secondary'} fs-6 text-capitalize`}>{order.status}</span>
        </div>
      </div>

      {/* Tracking Progress */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Order Tracking</h6>
            <div className="d-flex justify-content-between position-relative">
              <div className="position-absolute" style={{ top: 20, left: '10%', right: '10%', height: 3, background: '#e0e0e0', zIndex: 0 }}>
                <div style={{ height: '100%', background: '#48A111', width: `${Math.max(0, (currentStep / (statusSteps.length - 1)) * 100)}%`, transition: 'width 0.3s ease' }} />
              </div>
              {statusSteps.map((step, i) => (
                <div key={step} className="d-flex flex-column align-items-center" style={{ zIndex: 1, flex: 1 }}>
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold mb-2"
                    style={{ width: 40, height: 40, background: i <= currentStep ? '#48A111' : '#e0e0e0', color: 'white', fontSize: 14 }}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <small className={`text-capitalize ${i <= currentStep ? 'fw-semibold' : 'text-muted'}`} style={i <= currentStep ? { color: '#48A111' } : {}}>{step}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          {/* Order Items */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Items Ordered</h6>
              {order.items?.map((item) => (
                <div key={item.id} className="d-flex gap-3 align-items-center border-bottom pb-3 mb-3">
                  <img src={item.product_image ? `${import.meta.env.VITE_STORAGE_URL}/${item.product_image}` : `https://placehold.co/60x60/f5f5f5/999?text=IMG`}
                    className="rounded" width={60} height={60} style={{ objectFit: 'cover' }} alt="" />
                  <div className="flex-grow-1">
                    <div className="fw-medium">{item.product_name}</div>
                    <small className="text-muted">৳{item.price} × {item.quantity}</small>
                  </div>
                  <div className="fw-bold" style={{ color: '#48A111' }}>৳{item.total}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Shipping Details</h6>
              <p className="mb-1"><strong>{order.shipping_name}</strong></p>
              <p className="mb-1 text-muted"><i className="bi bi-telephone me-1" />{order.shipping_phone}</p>
              <p className="mb-0 text-muted"><i className="bi bi-geo-alt me-1" />{order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}</p>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Summary */}
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Order Summary</h6>
              <div className="d-flex justify-content-between mb-1"><span className="text-muted">Subtotal</span><span>৳{order.subtotal}</span></div>
              {order.discount > 0 && <div className="d-flex justify-content-between mb-1 text-success"><span>Discount</span><span>-৳{order.discount}</span></div>}
              <div className="d-flex justify-content-between mb-1"><span className="text-muted">Shipping</span><span>{order.shipping_charge == 0 ? 'FREE' : `৳${order.shipping_charge}`}</span></div>
              <hr />
              <div className="d-flex justify-content-between fw-bold"><span>Total</span><span style={{ color: '#48A111' }}>৳{order.total}</span></div>
              <hr />
              <div className="d-flex justify-content-between small"><span className="text-muted">Payment Method</span><span className="badge bg-primary">{order.payment_method?.toUpperCase()}</span></div>
              <div className="d-flex justify-content-between small mt-1"><span className="text-muted">Payment Status</span><span className={`badge bg-${order.payment_status === 'paid' ? 'success' : 'warning'}`}>{order.payment_status}</span></div>
            </div>
          </div>

          {/* bKash TRX */}
          {order.bkash_transaction && (
            <div className="card border-0 shadow-sm bg-light">
              <div className="card-body small">
                <h6 className="fw-bold mb-2">bKash Transaction</h6>
                <div><span className="text-muted">TrxID:</span> <strong>{order.bkash_transaction.trx_id || 'Pending'}</strong></div>
                <div><span className="text-muted">Number:</span> {order.bkash_transaction.bkash_number}</div>
                <div><span className="text-muted">Status:</span> <span className={`badge bg-${order.bkash_transaction.status === 'completed' ? 'success' : 'warning'}`}>{order.bkash_transaction.status}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => e.target === e.currentTarget && setShowInvoice(false)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Invoice</h5>
                <div className="d-flex gap-2 ms-auto">
                  <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                    <i className="bi bi-printer me-1" />Print / Save PDF
                  </button>
                  <button className="btn-close" onClick={() => setShowInvoice(false)} />
                </div>
              </div>
              <div className="modal-body" ref={invoiceRef}>
                {/* Invoice Header */}
                <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#48A111' }}><span style={{ color: '#F2B50B' }}>BikriZone</span></div>
                    <div className="text-muted small mt-1">Bangladesh's Online Marketplace</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold fs-5">INVOICE</div>
                    <div className="text-muted small">#{order.order_number}</div>
                    <div className="text-muted small">Date: {new Date(order.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>

                {/* Bill To / Ship To */}
                <div className="row mb-4">
                  <div className="col-6">
                    <div className="fw-semibold small text-uppercase text-muted mb-1">Bill To</div>
                    <div className="fw-bold">{order.shipping_name}</div>
                    <div className="small text-muted">{order.shipping_phone}</div>
                    <div className="small text-muted">{order.shipping_address}</div>
                    <div className="small text-muted">{order.shipping_city}{order.shipping_postal_code ? ` - ${order.shipping_postal_code}` : ''}</div>
                  </div>
                  <div className="col-6 text-end">
                    <div className="fw-semibold small text-uppercase text-muted mb-1">Payment Info</div>
                    <div className="small"><span className="text-muted">Method:</span> <span className="fw-semibold">{order.payment_method?.toUpperCase()}</span></div>
                    <div className="small"><span className="text-muted">Status:</span> <span className={`badge bg-${order.payment_status === 'paid' ? 'success' : 'warning'} ms-1`}>{order.payment_status}</span></div>
                    <div className="small mt-1"><span className="text-muted">Order Status:</span> <span className={`badge bg-${statusColors[order.status] || 'secondary'} ms-1 text-capitalize`}>{order.status}</span></div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="table table-bordered table-sm mb-3">
                  <thead style={{ background: '#48A111', color: 'white' }}>
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3 text-end">Unit Price</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-muted">{idx + 1}</td>
                        <td className="px-3 py-2">{item.product_name}</td>
                        <td className="px-3 py-2 text-end">৳{item.price}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-end fw-semibold">৳{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-end px-3 py-1 text-muted">Subtotal</td>
                      <td className="text-end px-3 py-1">৳{order.subtotal}</td>
                    </tr>
                    {order.discount > 0 && (
                      <tr>
                        <td colSpan={4} className="text-end px-3 py-1 text-success">Discount</td>
                        <td className="text-end px-3 py-1 text-success">-৳{order.discount}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} className="text-end px-3 py-1 text-muted">Shipping</td>
                      <td className="text-end px-3 py-1">{order.shipping_charge == 0 ? 'FREE' : `৳${order.shipping_charge}`}</td>
                    </tr>
                    <tr style={{ background: '#f8faf8' }}>
                      <td colSpan={4} className="text-end px-3 py-2 fw-bold">Grand Total</td>
                      <td className="text-end px-3 py-2 fw-bold fs-5" style={{ color: '#48A111' }}>৳{order.total}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer Note */}
                <div className="text-center text-muted small mt-3 pt-3 border-top">
                  <div>Thank you for shopping with BikriZone!</div>
                  <div>For support, visit bikrizone.com or call our helpline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
