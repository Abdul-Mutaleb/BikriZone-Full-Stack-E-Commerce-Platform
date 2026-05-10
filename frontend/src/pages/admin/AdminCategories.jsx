import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', parent_id: '', is_active: true })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [banner, setBanner] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Categories - BikriZone Admin'
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await api.get('/admin/categories')
    setCategories(data)
  }

  const openCreate = () => {
    setEditCat(null)
    setForm({ name: '', description: '', parent_id: '', is_active: true })
    setImage(null); setImagePreview(null)
    setBanner(null); setBannerPreview(null)
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setEditCat(cat)
    setForm({ name: cat.name, description: cat.description || '', parent_id: cat.parent_id || '', is_active: cat.is_active })
    setImage(null)
    setImagePreview(cat.image ? `${storageUrl}/${cat.image}` : null)
    setBanner(null)
    setBannerPreview(cat.banner ? `${storageUrl}/${cat.banner}` : null)
    setShowModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBanner(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('parent_id', form.parent_id)
      fd.append('is_active', form.is_active ? 1 : 0)
      if (image) fd.append('image', image)
      if (banner) fd.append('banner', banner)

      if (editCat) {
        await api.post(`/admin/categories/${editCat.id}`, fd)
        toast.success('Category updated!')
      } else {
        await api.post('/admin/categories', fd)
        toast.success('Category created!')
      }
      setShowModal(false)
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    await api.delete(`/admin/categories/${id}`)
    toast.success('Category deleted')
    loadCategories()
  }

  const flatCategories = categories.reduce((acc, cat) => {
    acc.push(cat)
    cat.children?.forEach((c) => acc.push({ ...c, name: `└ ${c.name}` }))
    return acc
  }, [])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">Categories</h3>
          <p className="text-muted small mb-0">Manage shop categories and their banner images</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" />Add Category
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Icon</th>
                <th>Banner</th>
                <th>Name</th>
                <th>Sub-categories</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flatCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    {cat.image
                      ? <img src={`${storageUrl}/${cat.image}`} alt={cat.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                      : <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontSize: 20 }}>🏷️</div>
                    }
                  </td>
                  <td>
                    {cat.banner
                      ? <img src={`${storageUrl}/${cat.banner}`} alt="banner" style={{ width: 100, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                      : <span className="text-muted small">—</span>
                    }
                  </td>
                  <td className="fw-medium">{cat.name}</td>
                  <td>{cat.children?.length || 0}</td>
                  <td><span className={`badge bg-${cat.is_active ? 'success' : 'danger'}`}>{cat.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(cat)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(cat.id)}><i className="bi bi-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-4">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <form onSubmit={handleSubmit} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editCat ? 'Edit Category' : 'Add Category'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Name *</label>
                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Parent Category</label>
                    <select className="form-select" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                      <option value="">None (Top-level)</option>
                      {categories.filter((c) => !c.parent_id && c.id !== editCat?.id).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Description</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  {/* Icon image */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Category Icon Image</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                    <div className="form-text">Square image, recommended 200×200 px.</div>
                    {imagePreview && (
                      <img src={imagePreview} alt="preview" className="mt-2 rounded" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                    )}
                  </div>


                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                      <label className="form-check-label">Active</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}
                  {editCat ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
