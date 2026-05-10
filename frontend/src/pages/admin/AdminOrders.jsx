import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const statusColors = {
  pending: 'warning', processing: 'info', shipped: 'primary',
  delivered: 'success', cancelled: 'danger', refunded: 'secondary',
}

function InvoicePrint({ order, onClose }) {
  const handlePrint = () => window.print()

  return (
    <>
      {/* Printable invoice — hidden until print media query */}
      <div id="invoicePrintWrap">
        <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #48A111' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#48A111' }}>BikriZone</div>
              <div style={{ fontSize: 12, color: '#666' }}>Bangladesh's #1 E-Commerce Platform</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#333' }}>INVOICE</div>
              <div style={{ fontSize: 13, color: '#48A111', fontWeight: 600 }}>{order.order_number}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{new Date(order.created_at).toLocaleDateString('en-BD')}</div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div style={{ display: 'flex', gap: 40, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Bill To</div>
              <div style={{ fontWeight: 600 }}>{order.user?.name}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{order.user?.email}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{order.user?.phone}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Ship To</div>
              <div style={{ fontWeight: 600 }}>{order.shipping_name}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{order.shipping_phone}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{order.shipping_address}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{order.shipping_city} {order.shipping_postal_code}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Payment</div>
              <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>{order.payment_method}</div>
              <div style={{ fontSize: 13 }}>
                <span style={{ background: order.payment_status === 'paid' ? '#d4edda' : '#fff3cd', color: order.payment_status === 'paid' ? '#155724' : '#856404', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>
                  {order.payment_status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#48A111', color: 'white' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12 }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12 }}>Product</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Price</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={item.id} style={{ background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#666' }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13 }}>{item.product_name}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right' }}>৳{item.price}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>৳{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 220 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                <span>Subtotal</span><span>৳{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#27ae60' }}>
                  <span>Discount</span><span>-৳{order.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                <span>Shipping</span><span>৳{order.shipping_charge}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid #48A111', marginTop: 4, color: '#48A111' }}>
                <span>Total</span><span>৳{order.total}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center', fontSize: 11, color: '#888' }}>
            Thank you for shopping with BikriZone! For support: support@bikrizone.com
          </div>
        </div>
      </div>

      {/* Print Modal */}
      <div className="modal show d-block invoice-no-print" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title fw-bold">Invoice — {order.order_number}</h6>
              <button className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body bg-light">
              <div className="bg-white p-4 shadow-sm rounded">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom border-2" style={{ borderColor: '#48A111' }}>
                  <div>
                    <div className="fw-bold fs-4" style={{ color: '#48A111' }}>BikriZone</div>
                    <div className="text-muted small">Bangladesh's #1 E-Commerce Platform</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold fs-5">INVOICE</div>
                    <div className="fw-semibold" style={{ color: '#48A111' }}>{order.order_number}</div>
                    <div className="text-muted small">{new Date(order.created_at).toLocaleDateString('en-BD')}</div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="text-uppercase fw-semibold mb-1" style={{ fontSize: 11, color: '#666' }}>Bill To</div>
                    <div className="fw-medium">{order.user?.name}</div>
                    <div className="text-muted small">{order.user?.email}</div>
                    <div className="text-muted small">{order.user?.phone}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-uppercase fw-semibold mb-1" style={{ fontSize: 11, color: '#666' }}>Ship To</div>
                    <div className="fw-medium">{order.shipping_name}</div>
                    <div className="text-muted small">{order.shipping_phone}</div>
                    <div className="text-muted small">{order.shipping_address}</div>
                    <div className="text-muted small">{order.shipping_city}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-uppercase fw-semibold mb-1" style={{ fontSize: 11, color: '#666' }}>Payment</div>
                    <div className="fw-medium text-uppercase">{order.payment_method}</div>
                    <span className={`badge bg-${order.payment_status === 'paid' ? 'success' : 'warning'}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <table className="table table-sm table-bordered mb-3">
                  <thead className="table-dark" style={{ '--bs-table-bg': '#48A111' }}>
                    <tr>
                      <th style={{ fontSize: 12 }}>#</th>
                      <th style={{ fontSize: 12 }}>Product</th>
                      <th className="text-end" style={{ fontSize: 12 }}>Price</th>
                      <th className="text-end" style={{ fontSize: 12 }}>Qty</th>
                      <th className="text-end" style={{ fontSize: 12 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, i) => (
                      <tr key={item.id}>
                        <td className="text-muted small">{i + 1}</td>
                        <td className="small">{item.product_name}</td>
                        <td className="text-end small">৳{item.price}</td>
                        <td className="text-end small">{item.quantity}</td>
                        <td className="text-end small fw-semibold">৳{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="d-flex justify-content-end">
                  <div style={{ width: 220 }}>
                    <div className="d-flex justify-content-between small py-1">
                      <span>Subtotal</span><span>৳{order.subtotal}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="d-flex justify-content-between small py-1 text-success">
                        <span>Discount</span><span>-৳{order.discount}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between small py-1">
                      <span>Shipping</span><span>৳{order.shipping_charge}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold py-2 border-top" style={{ color: '#48A111', fontSize: 16 }}>
                      <span>Total</span><span>৳{order.total}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-muted mt-3 pt-3 border-top" style={{ fontSize: 11 }}>
                  Thank you for shopping with BikriZone!
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <i className="bi bi-printer me-2" />Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', payment_method: '', search: '' })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [invoiceOrder, setInvoiceOrder] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    document.title = 'Orders - BikriZone Admin'
    loadOrders()
  }, [filters, page])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/orders', { params: { ...filters, page } })
      setOrders(data.data)
      setPagination(data)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status })
      toast.success('Status updated!')
      loadOrders()
      if (selectedOrder?.id === orderId) {
        const { data } = await api.get(`/admin/orders/${orderId}`)
        setSelectedOrder(data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const openOrder = async (id) => {
    const { data } = await api.get(`/admin/orders/${id}`)
    setSelectedOrder(data)
  }

  const openInvoice = async (id) => {
    try {
      const { data } = await api.get(`/admin/orders/${id}/invoice`)
      setInvoiceOrder(data)
    } catch {
      toast.error('Failed to load invoice')
    }
  }

  return (
    <div>
      <h3 className="fw-bold mb-4">Orders</h3>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control form-control-sm"
                placeholder="Search order# or customer..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filters.payment_method}
                onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
              >
                <option value="">All Methods</option>
                <option value="bkash">bKash</option>
                <option value="cod">COD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className={selectedOrder ? 'col-lg-7' : 'col-12'}>
          {loading ? <LoadingSpinner /> : (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className={selectedOrder?.id === order.id ? 'table-active' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openOrder(order.id)}
                      >
                        <td>
                          <div className="fw-medium small">{order.order_number}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td><small>{order.user?.name}</small></td>
                        <td>
                          <span className="fw-bold" style={{ color: '#48A111' }}>৳{order.total}</span>
                        </td>
                        <td>
                          <span className={`badge bg-${statusColors[order.status] || 'secondary'} text-capitalize small`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: 110 }}
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                            >
                              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openInvoice(order.id)}
                              title="View Invoice"
                            >
                              <i className="bi bi-receipt" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.last_page > 1 && (
                <div className="card-footer d-flex justify-content-center">
                  <ul className="pagination pagination-sm mb-0">
                    {Array.from({ length: Math.min(pagination.last_page, 10) }, (_, i) => i + 1).map((p) => (
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

        {/* Order Detail Panel */}
        {selectedOrder && (
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center bg-white">
                <h6 className="fw-bold mb-0">{selectedOrder.order_number}</h6>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => openInvoice(selectedOrder.id)}
                    title="View / Print Invoice"
                  >
                    <i className="bi bi-receipt me-1" />Invoice
                  </button>
                  <button className="btn-close btn-sm" onClick={() => setSelectedOrder(null)} />
                </div>
              </div>
              <div className="card-body">
                <div className="row g-2 small mb-3">
                  <div className="col-6">
                    <span className="text-muted">Customer:</span><br />
                    <strong>{selectedOrder.user?.name}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Phone:</span><br />
                    {selectedOrder.user?.phone}
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Payment:</span><br />
                    <span className="badge bg-primary">{selectedOrder.payment_method?.toUpperCase()}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted">Pay Status:</span><br />
                    <span className={`badge bg-${selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}`}>
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                </div>

                <div className="bg-light rounded p-2 mb-3 small">
                  <strong>Ship to:</strong> {selectedOrder.shipping_name}, {selectedOrder.shipping_address}, {selectedOrder.shipping_city}
                </div>

                <h6 className="fw-semibold mb-2 small">Items</h6>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between small mb-1">
                    <span>{item.product_name} ×{item.quantity}</span>
                    <span>৳{item.total}</span>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span style={{ color: '#48A111' }}>৳{selectedOrder.total}</span>
                </div>

                {selectedOrder.bkash_transaction && (
                  <div className="mt-3 bg-light rounded p-2 small">
                    <div className="fw-semibold mb-1">bKash</div>
                    <div>TrxID: {selectedOrder.bkash_transaction.trx_id || 'Pending'}</div>
                    <div>Number: {selectedOrder.bkash_transaction.bkash_number}</div>
                  </div>
                )}

                <div className="mt-3">
                  <label className="form-label small fw-semibold">Update Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && <InvoicePrint order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}
    </div>
  )
}
