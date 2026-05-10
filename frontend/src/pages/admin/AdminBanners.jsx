import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

const MAX_DIMENSION = 1920
const COMPRESS_QUALITY = 0.85
const COMPRESS_THRESHOLD_MB = 2

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height, 1)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        COMPRESS_QUALITY
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editBanner, setEditBanner] = useState(null)
  const [form, setForm] = useState({ subtitle: '', link: '', sort_order: 0, is_active: true })
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [compressing, setCompressing] = useState(false)

  useEffect(() => {
    document.title = 'Banners - BikriZone Admin'
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      const { data } = await api.get('/admin/banners')
      setBanners(data)
    } catch {
      toast.error('Failed to load banners')
    }
  }

  const openCreate = () => {
    setEditBanner(null)
    setForm({ subtitle: '', link: '', sort_order: 0, is_active: true })
    setImage(null)
    setPreview(null)
    setShowModal(true)
  }

  const openEdit = (banner) => {
    setEditBanner(banner)
    setForm({
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    })
    setImage(null)
    setPreview(`${storageUrl}/${banner.image}`)
    setShowModal(true)
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    if (file.size > COMPRESS_THRESHOLD_MB * 1024 * 1024) {
      setCompressing(true)
      try {
        const compressed = await compressImage(file)
        setImage(compressed)
        const savedMB = ((file.size - compressed.size) / 1024 / 1024).toFixed(1)
        if (savedMB > 0) toast.info(`Image auto-compressed (saved ~${savedMB} MB)`)
      } finally {
        setCompressing(false)
      }
    } else {
      setImage(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('subtitle', form.subtitle)
      fd.append('link', form.link)
      fd.append('sort_order', form.sort_order)
      fd.append('is_active', form.is_active ? 1 : 0)
      if (image) fd.append('image', image)

      if (editBanner) {
        await api.post(`/admin/banners/${editBanner.id}`, fd)
        toast.success('Banner updated!')
      } else {
        await api.post('/admin/banners', fd)
        toast.success('Banner created!')
      }
      setShowModal(false)
      loadBanners()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return
    try {
      await api.delete(`/admin/banners/${id}`)
      toast.success('Banner deleted')
      loadBanners()
    } catch {
      toast.error('Failed to delete banner')
    }
  }

  const toggleActive = async (banner) => {
    try {
      const fd = new FormData()
      fd.append('is_active', banner.is_active ? 0 : 1)
      await api.post(`/admin/banners/${banner.id}`, fd)
      loadBanners()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">Banners</h3>
          <p className="text-muted small mb-0">Manage homepage promotional banners</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" />Add Banner
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Link</th>
                <th style={{ width: 80 }}>Order</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td>
                    <img
                      src={`${storageUrl}/${b.image}`}
                      alt={b.title}
                      style={{ width: 140, height: 70, objectFit: 'cover', borderRadius: 6 }}
                    />
                  </td>
                  <td>
                    <div className="fw-medium">{b.title}</div>
                    {b.subtitle && <small className="text-muted">{b.subtitle}</small>}
                  </td>
                  <td>
                    <small className="text-muted">{b.link || '—'}</small>
                  </td>
                  <td className="text-center">{b.sort_order}</td>
                  <td>
                    <span
                      className={`badge bg-${b.is_active ? 'success' : 'secondary'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleActive(b)}
                      title="Click to toggle"
                    >
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(b)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5">
                    <i className="bi bi-image fs-2 d-block mb-2 opacity-25" />
                    No banners yet. Add your first banner!
                  </td>
                </tr>
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
                <h5 className="modal-title fw-bold">
                  {editBanner ? 'Edit Banner' : 'Add Banner'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium">Subtitle</label>
                  <input
                    className="form-control"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="e.g. Up to 50% off on all products"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Link URL</label>
                  <input
                    className="form-control"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="/products?category=electronics"
                  />
                  <div className="form-text">Leave blank for no click action.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                  <div className="form-text">Lower number = shown first.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">
                    Image {editBanner ? <span className="text-muted fw-normal">(leave empty to keep current)</span> : '*'}
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!editBanner}
                  />
                  <div className="form-text">Recommended size: 1200×400 px. Files over 2 MB are auto-compressed. Max 10 MB accepted.</div>
                  {compressing && (
                    <div className="d-flex align-items-center gap-2 mt-1 text-primary small">
                      <span className="spinner-border spinner-border-sm" />Compressing image…
                    </div>
                  )}
                  {preview && (
                    <img
                      src={preview}
                      alt="preview"
                      className="mt-2 rounded w-100"
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="bannerActive"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="bannerActive">Active (visible on homepage)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || compressing}>
                  {(saving || compressing) && <span className="spinner-border spinner-border-sm me-2" />}
                  {compressing ? 'Compressing…' : editBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
