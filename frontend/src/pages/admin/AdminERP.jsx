import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

const poStatusColors = { draft: 'secondary', ordered: 'info', received: 'success', cancelled: 'danger' }

// ── Inventory Tab ────────────────────────────────────────────────
function InventoryTab() {
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [adjustModal, setAdjustModal] = useState(null)
  const [adjustment, setAdjustment] = useState('')
  const [adjNotes, setAdjNotes] = useState('')
  const [adjLoading, setAdjLoading] = useState(false)
  const [logsModal, setLogsModal] = useState(null)
  const [logs, setLogs] = useState([])

  useEffect(() => { loadInventory() }, [search, filter])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/erp/inventory', { params: { search, filter } })
      setProducts(data.products)
      setStats(data.stats)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    setAdjLoading(true)
    try {
      await api.post(`/admin/erp/inventory/${adjustModal.id}/adjust`, {
        adjustment: parseInt(adjustment),
        notes: adjNotes,
      })
      toast.success('Stock adjusted!')
      setAdjustModal(null)
      setAdjustment('')
      setAdjNotes('')
      loadInventory()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock')
    } finally {
      setAdjLoading(false)
    }
  }

  const openLogs = async (product) => {
    setLogsModal(product)
    try {
      const { data } = await api.get(`/admin/erp/inventory/${product.id}/logs`)
      setLogs(data)
    } catch {
      setLogs([])
    }
  }

  return (
    <div>
      {/* Stats Row */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Products', value: stats.total_products || 0, icon: 'box', color: '#48A111' },
          { label: 'Low Stock', value: stats.low_stock || 0, icon: 'exclamation-triangle', color: '#f39c12' },
          { label: 'Out of Stock', value: stats.out_of_stock || 0, icon: 'x-circle', color: '#e74c3c' },
          { label: 'Stock Value (৳)', value: (stats.total_stock_value || 0).toLocaleString(), icon: 'cash-stack', color: '#3498db' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, background: color + '15', flexShrink: 0 }}>
                  <i className={`bi bi-${icon}`} style={{ color, fontSize: 18 }} />
                </div>
                <div>
                  <div className="fw-bold fs-5">{value}</div>
                  <div className="text-muted small">{label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-6">
              <input className="form-control form-control-sm" placeholder="Search by name or SKU..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All Products</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product</th><th>SKU</th><th>Category</th>
                  <th className="text-center">Stock</th><th className="text-center">Threshold</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.low_stock_threshold
                  const isOut = p.stock === 0
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={p.thumbnail ? `${storageUrl}/${p.thumbnail}` : 'https://placehold.co/36x36/f5f5f5/999?text=IMG'}
                            width={36} height={36} className="rounded" style={{ objectFit: 'cover' }} alt=""
                          />
                          <span className="fw-medium small">{p.name}</span>
                        </div>
                      </td>
                      <td><small className="text-muted">{p.sku || '—'}</small></td>
                      <td><small>{p.category?.name}</small></td>
                      <td className="text-center">
                        <span className={`fw-bold ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="text-center"><small className="text-muted">{p.low_stock_threshold}</small></td>
                      <td>
                        {isOut ? (
                          <span className="badge bg-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge bg-warning text-dark">Low Stock</span>
                        ) : (
                          <span className="badge bg-success">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary"
                            onClick={() => { setAdjustModal(p); setAdjustment(''); setAdjNotes('') }}
                            title="Adjust Stock">
                            <i className="bi bi-arrow-left-right" />
                          </button>
                          <button className="btn btn-sm btn-outline-secondary"
                            onClick={() => openLogs(p)} title="View Logs">
                            <i className="bi bi-clock-history" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <form onSubmit={handleAdjust} className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Adjust Stock</h6>
                <button type="button" className="btn-close" onClick={() => setAdjustModal(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="fw-medium small mb-1">{adjustModal.name}</div>
                  <div className="text-muted small">Current stock: <strong>{adjustModal.stock}</strong></div>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Adjustment (use negative to reduce)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={adjustment}
                    onChange={(e) => setAdjustment(e.target.value)}
                    placeholder="e.g. +50 or -10"
                    required
                  />
                  {adjustment && (
                    <div className="form-text">
                      New stock: <strong>{Math.max(0, adjustModal.stock + parseInt(adjustment || 0))}</strong>
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label small">Notes (optional)</label>
                  <textarea className="form-control form-control-sm" rows={2}
                    value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)}
                    placeholder="Reason for adjustment..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAdjustModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={adjLoading}>
                  {adjLoading && <span className="spinner-border spinner-border-sm me-1" />}
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Stock History — {logsModal.name}</h6>
                <button type="button" className="btn-close" onClick={() => setLogsModal(null)} />
              </div>
              <div className="modal-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th><th>Type</th><th>Change</th>
                        <th>Before</th><th>After</th><th>Reference</th><th>By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 && (
                        <tr><td colSpan={7} className="text-center text-muted py-3">No logs yet</td></tr>
                      )}
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td><small>{new Date(log.created_at).toLocaleDateString()}</small></td>
                          <td><span className="badge bg-secondary text-capitalize">{log.type}</span></td>
                          <td>
                            <span className={log.quantity_change > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                              {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                            </span>
                          </td>
                          <td><small>{log.quantity_before}</small></td>
                          <td><small>{log.quantity_after}</small></td>
                          <td><small className="text-muted">{log.reference || '—'}</small></td>
                          <td><small>{log.user?.name || '—'}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-sm btn-secondary" onClick={() => setLogsModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Suppliers Tab ────────────────────────────────────────────────
function SuppliersTab() {
  const [suppliers, setSuppliers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', is_active: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSuppliers() }, [])

  const loadSuppliers = async () => {
    try {
      const { data } = await api.get('/admin/erp/suppliers')
      setSuppliers(data)
    } catch { toast.error('Failed to load suppliers') }
  }

  const openCreate = () => {
    setEditSupplier(null)
    setForm({ name: '', contact_person: '', email: '', phone: '', address: '', is_active: true })
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditSupplier(s)
    setForm({ name: s.name, contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '', address: s.address || '', is_active: s.is_active })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editSupplier) {
        await api.put(`/admin/erp/suppliers/${editSupplier.id}`, form)
        toast.success('Supplier updated!')
      } else {
        await api.post('/admin/erp/suppliers', form)
        toast.success('Supplier created!')
      }
      setShowModal(false)
      loadSuppliers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return
    try {
      await api.delete(`/admin/erp/suppliers/${id}`)
      toast.success('Supplier deleted')
      loadSuppliers()
    } catch {
      toast.error('Failed to delete supplier')
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Suppliers ({suppliers.length})</h6>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" />Add Supplier
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="fw-medium">{s.name}</td>
                  <td><small>{s.contact_person || '—'}</small></td>
                  <td><small className="text-muted">{s.email || '—'}</small></td>
                  <td><small>{s.phone || '—'}</small></td>
                  <td>
                    <span className={`badge bg-${s.is_active ? 'success' : 'secondary'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(s)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-4">No suppliers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form onSubmit={handleSubmit} className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small">Company Name *</label>
                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Contact Person</label>
                    <input className="form-control" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Phone</label>
                    <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small">Address</label>
                    <textarea className="form-control form-control-sm" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                      <label className="form-check-label small">Active</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-1" />}
                  {editSupplier ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Purchase Orders Tab ──────────────────────────────────────────
function PurchaseOrdersTab() {
  const [pos, setPos] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewPO, setViewPO] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ supplier_id: '', expected_date: '', notes: '', items: [{ product_id: '', quantity: 1, unit_price: '' }] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
    api.get('/admin/erp/suppliers').then(({ data }) => setSuppliers(data)).catch(() => {})
    api.get('/admin/products', { params: { per_page: 200 } }).then(({ data }) => setProducts(data.data || [])).catch(() => {})
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/erp/purchase-orders', { params: { status: statusFilter } })
      setPos(data)
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1, unit_price: '' }] })
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const updateItem = (i, field, val) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: val }
    setForm({ ...form, items })
  }

  const poTotal = form.items.reduce((s, item) => s + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0)), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/erp/purchase-orders', {
        ...form,
        items: form.items.map((i) => ({ ...i, quantity: parseInt(i.quantity), unit_price: parseFloat(i.unit_price) })),
      })
      toast.success('Purchase order created!')
      setShowModal(false)
      setForm({ supplier_id: '', expected_date: '', notes: '', items: [{ product_id: '', quantity: 1, unit_price: '' }] })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create PO')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (po, status) => {
    try {
      await api.put(`/admin/erp/purchase-orders/${po.id}/status`, { status })
      toast.success(`PO marked as ${status}`)
      loadData()
      if (viewPO?.id === po.id) setViewPO({ ...viewPO, status })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this purchase order?')) return
    try {
      await api.delete(`/admin/erp/purchase-orders/${id}`)
      toast.success('PO deleted')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete this PO')
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3">
          <h6 className="fw-bold mb-0">Purchase Orders</h6>
          <select className="form-select form-select-sm" style={{ width: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-1" />New PO
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>PO Number</th><th>Supplier</th><th>Items</th>
                  <th>Total</th><th>Expected</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <button className="btn btn-link btn-sm p-0 fw-medium text-decoration-none" onClick={() => setViewPO(po)}>
                        {po.po_number}
                      </button>
                    </td>
                    <td><small>{po.supplier?.name}</small></td>
                    <td><small>{po.items?.length} item(s)</small></td>
                    <td><span style={{ color: '#48A111' }}>৳{po.total_amount}</span></td>
                    <td><small className="text-muted">{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '—'}</small></td>
                    <td>
                      <span className={`badge bg-${poStatusColors[po.status]}`}>{po.status}</span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {po.status === 'draft' && (
                          <button className="btn btn-xs btn-sm btn-outline-info" style={{ fontSize: 11 }}
                            onClick={() => updateStatus(po, 'ordered')} title="Mark as Ordered">
                            <i className="bi bi-send" />
                          </button>
                        )}
                        {po.status === 'ordered' && (
                          <button className="btn btn-xs btn-sm btn-outline-success" style={{ fontSize: 11 }}
                            onClick={() => updateStatus(po, 'received')} title="Mark as Received (updates stock)">
                            <i className="bi bi-check-circle" />
                          </button>
                        )}
                        {['draft', 'cancelled'].includes(po.status) && (
                          <button className="btn btn-xs btn-sm btn-outline-danger" style={{ fontSize: 11 }}
                            onClick={() => handleDelete(po.id)} title="Delete">
                            <i className="bi bi-trash" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pos.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No purchase orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form onSubmit={handleSubmit} className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">New Purchase Order</h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small">Supplier *</label>
                    <select className="form-select" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} required>
                      <option value="">Select supplier...</option>
                      {suppliers.filter((s) => s.is_active).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Expected Delivery Date</label>
                    <input type="date" className="form-control" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small">Notes</label>
                    <textarea className="form-control form-control-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-semibold mb-0 small">Order Items</h6>
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItem}>
                    <i className="bi bi-plus me-1" />Add Item
                  </button>
                </div>

                {form.items.map((item, i) => (
                  <div key={i} className="row g-2 mb-2 align-items-end">
                    <div className="col-md-5">
                      <select className="form-select form-select-sm" value={item.product_id}
                        onChange={(e) => updateItem(i, 'product_id', e.target.value)} required>
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <input type="number" className="form-control form-control-sm" placeholder="Qty"
                        value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} min={1} required />
                    </div>
                    <div className="col-md-3">
                      <input type="number" className="form-control form-control-sm" placeholder="Unit Price ৳"
                        value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} min={0} step="0.01" required />
                    </div>
                    <div className="col-md-1 text-end small text-muted">
                      ৳{((parseFloat(item.unit_price || 0)) * parseInt(item.quantity || 0)).toFixed(0)}
                    </div>
                    <div className="col-md-1">
                      {form.items.length > 1 && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(i)}>
                          <i className="bi bi-x" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="text-end mt-2">
                  <span className="fw-bold">Total: <span style={{ color: '#48A111' }}>৳{poTotal.toFixed(2)}</span></span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-1" />}
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {viewPO && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">{viewPO.po_number}</h6>
                <button type="button" className="btn-close" onClick={() => setViewPO(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-2 small mb-3">
                  <div className="col-6"><span className="text-muted">Supplier:</span> <strong>{viewPO.supplier?.name}</strong></div>
                  <div className="col-6"><span className="text-muted">Status:</span> <span className={`badge bg-${poStatusColors[viewPO.status]}`}>{viewPO.status}</span></div>
                  <div className="col-6"><span className="text-muted">Total:</span> <strong>৳{viewPO.total_amount}</strong></div>
                  <div className="col-6"><span className="text-muted">Expected:</span> {viewPO.expected_date ? new Date(viewPO.expected_date).toLocaleDateString() : '—'}</div>
                </div>
                {viewPO.notes && <div className="bg-light rounded p-2 small mb-3">{viewPO.notes}</div>}
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr><th>Product</th><th className="text-center">Qty</th><th className="text-end">Unit Price</th><th className="text-end">Total</th></tr>
                  </thead>
                  <tbody>
                    {viewPO.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="small">{item.product?.name}</td>
                        <td className="text-center small">{item.quantity}</td>
                        <td className="text-end small">৳{item.unit_price}</td>
                        <td className="text-end small fw-semibold">৳{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="btn btn-sm btn-secondary" onClick={() => setViewPO(null)}>Close</button>
                {viewPO.status === 'draft' && (
                  <button className="btn btn-sm btn-info text-white" onClick={() => { updateStatus(viewPO, 'ordered'); setViewPO(null) }}>
                    <i className="bi bi-send me-1" />Mark Ordered
                  </button>
                )}
                {viewPO.status === 'ordered' && (
                  <button className="btn btn-sm btn-success" onClick={() => { updateStatus(viewPO, 'received'); setViewPO(null) }}>
                    <i className="bi bi-check-circle me-1" />Receive & Update Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ERP Page ────────────────────────────────────────────────
export default function AdminERP() {
  const [activeTab, setActiveTab] = useState('inventory')

  useEffect(() => {
    document.title = 'ERP Management - BikriZone Admin'
  }, [])

  const tabs = [
    { key: 'inventory', icon: 'boxes', label: 'Inventory' },
    { key: 'suppliers', icon: 'building', label: 'Suppliers' },
    { key: 'purchase-orders', icon: 'file-earmark-text', label: 'Purchase Orders' },
  ]

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 44, height: 44, background: '#48A111', color: 'white' }}>
          <i className="bi bi-graph-up fs-5" />
        </div>
        <div>
          <h4 className="fw-bold mb-0">ERP Management</h4>
          <div className="text-muted small">Inventory, Suppliers & Purchase Orders</div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {tabs.map(({ key, icon, label }) => (
          <li key={key} className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 ${activeTab === key ? 'active fw-semibold' : ''}`}
              onClick={() => setActiveTab(key)}
              style={activeTab === key ? { color: '#48A111', borderBottomColor: '#48A111' } : {}}
            >
              <i className={`bi bi-${icon}`} /> {label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'suppliers' && <SuppliersTab />}
      {activeTab === 'purchase-orders' && <PurchaseOrdersTab />}
    </div>
  )
}
