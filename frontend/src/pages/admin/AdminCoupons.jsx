import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editCoupon, setEditCoupon] = useState(null)
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minimum_order: 0, maximum_discount: '', usage_limit: '', expires_at: '', is_active: true })

  useEffect(() => {
    document.title = 'Coupons - BikriZone Admin'
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    const { data } = await api.get('/admin/coupons')
    setCoupons(data.data || data)
  }

  const openCreate = () => {
    setEditCoupon(null)
    setForm({ code: '', type: 'percentage', value: '', minimum_order: 0, maximum_discount: '', usage_limit: '', expires_at: '', is_active: true })
    setShowModal(true)
  }

  const openEdit = (coupon) => {
    setEditCoupon(coupon)
    setForm({ code: coupon.code, type: coupon.type, value: coupon.value, minimum_order: coupon.minimum_order, maximum_discount: coupon.maximum_discount || '', usage_limit: coupon.usage_limit || '', expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '', is_active: coupon.is_active })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editCoupon) {
        await api.put(`/admin/coupons/${editCoupon.id}`, form)
        toast.success('Coupon updated!')
      } else {
        await api.post('/admin/coupons', form)
        toast.success('Coupon created!')
      }
      setShowModal(false)
      loadCoupons()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return
    await api.delete(`/admin/coupons/${id}`)
    toast.success('Coupon deleted')
    loadCoupons()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Coupons</h3>
        <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-1" />Create Coupon</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used/Limit</th><th>Expires</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td><code className="fw-bold">{c.code}</code></td>
                  <td><span className="badge bg-light text-dark">{c.type}</span></td>
                  <td className="fw-bold" style={{ color: '#48A111' }}>{c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`}</td>
                  <td>৳{c.minimum_order}</td>
                  <td>{c.used_count}/{c.usage_limit || '∞'}</td>
                  <td><small className="text-muted">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No expiry'}</small></td>
                  <td><span className={`badge bg-${c.is_active ? 'success' : 'danger'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(c)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}><i className="bi bi-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No coupons yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form onSubmit={handleSubmit} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-6"><label className="form-label">Code *</label><input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
                  <div className="col-6">
                    <label className="form-label">Type *</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (৳)</option>
                    </select>
                  </div>
                  <div className="col-6"><label className="form-label">Value *</label><input type="number" className="form-control" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
                  <div className="col-6"><label className="form-label">Min Order (৳)</label><input type="number" className="form-control" value={form.minimum_order} onChange={(e) => setForm({ ...form, minimum_order: e.target.value })} /></div>
                  <div className="col-6"><label className="form-label">Max Discount (৳)</label><input type="number" className="form-control" value={form.maximum_discount} onChange={(e) => setForm({ ...form, maximum_discount: e.target.value })} /></div>
                  <div className="col-6"><label className="form-label">Usage Limit</label><input type="number" className="form-control" placeholder="Leave blank for unlimited" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} /></div>
                  <div className="col-6"><label className="form-label">Expires At</label><input type="date" className="form-control" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
                  <div className="col-6 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                      <label className="form-check-label">Active</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editCoupon ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
