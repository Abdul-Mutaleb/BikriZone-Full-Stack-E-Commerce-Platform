import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({
    name: '', category_id: '', price: '', sale_price: '',
    stock: '', low_stock_threshold: 5, description: '',
    short_description: '', sku: '', is_active: true, is_featured: false,
  })
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [newImages, setNewImages] = useState([])       // File[] to upload
  const [newPreviews, setNewPreviews] = useState([])   // blob URLs for preview
  const [existingImages, setExistingImages] = useState([]) // { id, image } already saved
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState(false)
  const imagesInputRef = useRef(null)

  useEffect(() => {
    document.title = 'Products - BikriZone Admin'
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {})
  }, [])

  useEffect(() => { loadProducts() }, [search, page, categoryFilter, featuredFilter])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/products', {
        params: { search, page, category_id: categoryFilter || undefined, is_featured: featuredFilter ? 1 : undefined },
      })
      setProducts(data.data)
      setPagination(data)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditProduct(null)
    setForm({ name: '', category_id: '', price: '', sale_price: '', stock: '', low_stock_threshold: 5, description: '', short_description: '', sku: '', is_active: true, is_featured: false })
    setThumbnail(null); setThumbPreview(null)
    setNewImages([]); setNewPreviews([])
    setExistingImages([])
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name, category_id: product.category_id, price: product.price,
      sale_price: product.sale_price || '', stock: product.stock,
      low_stock_threshold: product.low_stock_threshold,
      description: product.description || '', short_description: product.short_description || '',
      sku: product.sku || '', is_active: product.is_active, is_featured: product.is_featured,
    })
    setThumbnail(null)
    setThumbPreview(product.thumbnail ? `${storageUrl}/${product.thumbnail}` : null)
    setNewImages([]); setNewPreviews([])
    setExistingImages(product.images || [])
    setShowModal(true)
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbnail(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setNewImages((prev) => [...prev, ...files])
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeNewImage = (idx) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx))
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const deleteExistingImage = async (image) => {
    if (!confirm('Delete this image?')) return
    try {
      await api.delete(`/admin/products/${editProduct.id}/images/${image.id}`)
      setExistingImages((prev) => prev.filter((img) => img.id !== image.id))
      toast.success('Image deleted')
    } catch {
      toast.error('Failed to delete image')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === 'boolean') fd.append(k, v ? 1 : 0)
      else fd.append(k, v ?? '')
    })
    if (thumbnail) fd.append('thumbnail', thumbnail)
    newImages.forEach((img) => fd.append('images[]', img))

    try {
      if (editProduct) {
        fd.append('_method', 'PUT')
        const { data } = await api.post(`/admin/products/${editProduct.id}`, fd)
        toast.success('Product updated!')
        // refresh existing images in case new ones were added
        setExistingImages(data.product?.images || [])
      } else {
        await api.post('/admin/products', fd)
        toast.success('Product created!')
      }
      setShowModal(false)
      loadProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/admin/products/${id}`)
    toast.success('Product deleted')
    loadProducts()
  }

  const toggleActive = async (product) => {
    const fd = new FormData()
    fd.append('is_active', product.is_active ? 0 : 1)
    fd.append('_method', 'PUT')
    await api.post(`/admin/products/${product.id}`, fd)
    loadProducts()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Products</h3>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" />Add Product
        </button>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <input className="form-control" placeholder="Search products..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      {/* Category filter cards */}
      <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
        <button
          className={`btn btn-sm ${!categoryFilter && !featuredFilter ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => { setCategoryFilter(''); setFeaturedFilter(false); setPage(1) }}
        >
          All
        </button>
        <button
          className={`btn btn-sm ${featuredFilter ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={() => { setFeaturedFilter((f) => !f); setCategoryFilter(''); setPage(1) }}
        >
          <i className="bi bi-star-fill me-1" />Featured
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`btn btn-sm ${categoryFilter === String(cat.id) ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => { setCategoryFilter(String(cat.id)); setFeaturedFilter(false); setPage(1) }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={p.thumbnail ? `${storageUrl}/${p.thumbnail}` : `https://placehold.co/40x40/f5f5f5/999?text=IMG`}
                          width={40} height={40} className="rounded" style={{ objectFit: 'cover' }} alt=""
                        />
                        <div>
                          <div className="fw-medium">{p.name}</div>
                          <small className="text-muted">{p.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td><small>{p.category?.name}</small></td>
                    <td>
                      <span style={{ color: '#48A111' }}>৳{p.sale_price ?? p.price}</span>
                      {p.sale_price && <div><small className="text-muted text-decoration-line-through">৳{p.price}</small></div>}
                    </td>
                    <td>
                      <span className={p.stock <= p.low_stock_threshold ? 'text-danger fw-bold' : ''}>
                        {p.stock}
                        {p.stock <= p.low_stock_threshold && <i className="bi bi-exclamation-triangle text-warning ms-1" />}
                      </span>
                    </td>
                    <td>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={p.is_active} onChange={() => toggleActive(p)} />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(p)} title="Edit"><i className="bi bi-pencil" /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)} title="Delete"><i className="bi bi-trash" /></button>
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

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-xl">
            <form onSubmit={handleSubmit} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editProduct ? 'Edit Product' : 'Add New Product'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Basic fields */}
                  <div className="col-md-8">
                    <label className="form-label fw-medium">Product Name *</label>
                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium">Category *</label>
                    <select className="form-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                      <option value="">Select...</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-medium">Price (৳) *</label>
                    <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-medium">Sale Price (৳)</label>
                    <input type="number" className="form-control" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-medium">Stock *</label>
                    <input type="number" className="form-control" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-medium">SKU</label>
                    <input className="form-control" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Short Description</label>
                    <input className="form-control" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Description</label>
                    <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  {/* Switches */}
                  <div className="col-md-3 d-flex align-items-center gap-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                      <label className="form-check-label">Active</label>
                    </div>
                  </div>
                  <div className="col-md-3 d-flex align-items-center">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                      <label className="form-check-label">Featured</label>
                    </div>
                  </div>

                  {/* ── Image Section ── */}
                  <div className="col-12"><hr className="my-1" /><h6 className="fw-bold text-muted">Product Images</h6></div>

                  {/* Thumbnail */}
                  <div className="col-md-4">
                    <label className="form-label fw-medium">
                      Thumbnail (Card Image) {editProduct ? <span className="text-muted fw-normal small">— leave empty to keep</span> : '*'}
                    </label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleThumbnailChange} required={!editProduct} />
                    <div className="form-text">Square 1:1 ratio — shown on product cards.</div>
                    {thumbPreview && (
                      <img src={thumbPreview} alt="thumb" className="mt-2 rounded" style={{ width: 80, height: 80, objectFit: 'cover', border: '2px solid #48A111' }} />
                    )}
                  </div>

                  {/* Multiple images */}
                  <div className="col-md-8">
                    <label className="form-label fw-medium">Gallery Images (multiple)</label>
                    <div
                      className="border rounded-3 p-3 d-flex flex-wrap gap-2 align-items-center"
                      style={{ minHeight: 100, background: '#fafafa', cursor: 'pointer' }}
                      onClick={() => imagesInputRef.current?.click()}
                    >
                      {/* Existing saved images */}
                      {existingImages.map((img) => (
                        <div key={img.id} className="position-relative" style={{ width: 80, height: 80 }}>
                          <img
                            src={`${storageUrl}/${img.image}`}
                            alt=""
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute d-flex align-items-center justify-content-center"
                            style={{ top: -6, right: -6, width: 22, height: 22, padding: 0, borderRadius: '50%', fontSize: 11, zIndex: 5 }}
                            onClick={(e) => { e.stopPropagation(); deleteExistingImage(img) }}
                            title="Delete"
                          >
                            <i className="bi bi-x" />
                          </button>
                        </div>
                      ))}

                      {/* New images to be uploaded */}
                      {newPreviews.map((src, i) => (
                        <div key={i} className="position-relative" style={{ width: 80, height: 80 }}>
                          <img
                            src={src}
                            alt=""
                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px dashed #48A111', opacity: 0.85 }}
                          />
                          <button
                            type="button"
                            className="btn btn-warning btn-sm position-absolute d-flex align-items-center justify-content-center"
                            style={{ top: -6, right: -6, width: 22, height: 22, padding: 0, borderRadius: '50%', fontSize: 11, zIndex: 5 }}
                            onClick={(e) => { e.stopPropagation(); removeNewImage(i) }}
                            title="Remove"
                          >
                            <i className="bi bi-x" />
                          </button>
                          <span className="position-absolute bottom-0 start-0 badge bg-primary" style={{ fontSize: 9 }}>New</span>
                        </div>
                      ))}

                      {/* Add more button */}
                      <div
                        className="d-flex flex-column align-items-center justify-content-center text-muted rounded-3"
                        style={{ width: 80, height: 80, border: '2px dashed #ccc', fontSize: 12 }}
                      >
                        <i className="bi bi-plus-lg fs-5" />
                        <span>Add</span>
                      </div>
                    </div>
                    <div className="form-text">Click area to add images. Shown in product detail gallery.</div>
                    <input
                      ref={imagesInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="d-none"
                      onChange={handleImagesChange}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" />}
                  {editProduct ? 'Update' : 'Create'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
