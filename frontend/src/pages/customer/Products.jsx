import { useState, useEffect } from 'react'
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import ProductCard from '../../components/common/ProductCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function Products() {
  const { categorySlug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [filters, setFilters] = useState({
    search:    searchParams.get('search')    || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by:   searchParams.get('sort_by')   || 'created_at',
    sort_dir:  searchParams.get('sort_dir')  || 'desc',
    featured:  searchParams.get('featured')  || '',
    page:      searchParams.get('page')      || 1,
  })

  useEffect(() => {
    document.title = 'Products - BikriZone'
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {})
  }, [])

  // Reset page when navigating to a different category
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1 }))
  }, [categorySlug])

  useEffect(() => { loadProducts() }, [filters, categorySlug])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
      if (categorySlug) params.category = categorySlug
      const { data } = await api.get('/products', { params })
      setProducts(data.data)
      setPagination(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key, value) => {
    if (key === 'category') {
      if (value) navigate(`/products/category/${value}`)
      else navigate('/products')
      return
    }
    const newFilters = { ...filters, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }
    setFilters(newFilters)
    const params = {}
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params[k] = v })
    setSearchParams(params)
  }

  const updateSort = (sortValue) => {
    const [sort_by, sort_dir] = sortValue.split('|')
    const newFilters = { ...filters, sort_by, sort_dir, page: 1 }
    setFilters(newFilters)
    const params = {}
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params[k] = v })
    setSearchParams(params)
  }

  const clearAll = () => {
    setFilters({ search: '', min_price: '', max_price: '', sort_by: 'created_at', sort_dir: 'desc', featured: '', page: 1 })
    setSearchParams({})
    navigate('/products')
  }

  const activeCat = categories.find((c) => c.slug === categorySlug)

  const filterPanel = (
    <>
      <h6 className="fw-bold mb-3">Filters</h6>

      {/* Category */}
      <div className="mb-4">
        <div className="fw-semibold small mb-2">Category</div>
        <div className="d-flex flex-column gap-1">
          <div className="form-check">
            <input className="form-check-input" type="radio" name="cat" id="cat-all" value=""
              checked={!categorySlug} onChange={() => updateFilter('category', '')} />
            <label className="form-check-label small" htmlFor="cat-all">All Categories</label>
          </div>
          {categories.map((cat) => (
            <div key={cat.id} className="form-check">
              <input className="form-check-input" type="radio" name="cat" id={`cat-${cat.id}`} value={cat.slug}
                checked={categorySlug === cat.slug} onChange={() => updateFilter('category', cat.slug)} />
              <label className="form-check-label small" htmlFor={`cat-${cat.id}`}>{cat.name}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <div className="fw-semibold small mb-2">Price Range</div>
        <div className="d-flex gap-2">
          <input type="number" className="form-control form-control-sm" placeholder="Min ৳"
            value={filters.min_price} onChange={(e) => updateFilter('min_price', e.target.value)} />
          <input type="number" className="form-control form-control-sm" placeholder="Max ৳"
            value={filters.max_price} onChange={(e) => updateFilter('max_price', e.target.value)} />
        </div>
      </div>

      {/* Sort */}
      <div className="mb-4">
        <div className="fw-semibold small mb-2">Sort By</div>
        <select className="form-select form-select-sm"
          value={`${filters.sort_by}|${filters.sort_dir}`}
          onChange={(e) => updateSort(e.target.value)}>
          <option value="created_at|desc">Newest First</option>
          <option value="price|asc">Price: Low to High</option>
          <option value="price|desc">Price: High to Low</option>
          <option value="average_rating|desc">Best Rated</option>
        </select>
      </div>

      <button className="btn btn-outline-secondary btn-sm w-100" onClick={clearAll}>
        Clear All Filters
      </button>
    </>
  )

  return (
    <div>
      {/* Category Banner */}
      {activeCat?.banner && (
        <div className="w-100 overflow-hidden" style={{ maxHeight: 220 }}>
          <img src={`${storageUrl}/${activeCat.banner}`} alt={activeCat.name}
            className="w-100" style={{ height: 220, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Mobile Offcanvas Filter */}
      <div className="offcanvas offcanvas-start" id="filterOffcanvas" tabIndex="-1">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold">Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body">
          {filterPanel}
        </div>
      </div>

      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
            {activeCat && <li className="breadcrumb-item active">{activeCat.name}</li>}
          </ol>
        </nav>

        {/* Mobile: filter + sort bar */}
        <div className="d-flex gap-2 mb-3 d-md-none">
          <button
            className="btn btn-outline-secondary btn-sm flex-fill"
            data-bs-toggle="offcanvas"
            data-bs-target="#filterOffcanvas"
          >
            <i className="bi bi-funnel me-1" />Filters
            {(categorySlug || filters.min_price || filters.max_price) && (
              <span className="badge bg-primary ms-1">!</span>
            )}
          </button>
          <select
            className="form-select form-select-sm flex-fill"
            value={`${filters.sort_by}|${filters.sort_dir}`}
            onChange={(e) => updateSort(e.target.value)}
          >
            <option value="created_at|desc">Newest</option>
            <option value="price|asc">Price ↑</option>
            <option value="price|desc">Price ↓</option>
            <option value="average_rating|desc">Top Rated</option>
          </select>
        </div>

        <div className="row g-4">
          {/* Desktop Sidebar */}
          <div className="col-md-3 d-none d-md-block">
            <div className="card border-0 shadow-sm" style={{ position: 'sticky', top: 80 }}>
              <div className="card-body">{filterPanel}</div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="col-12 col-md-9">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">
                {categorySlug || filters.search
                  ? `Results${filters.search ? ` for "${filters.search}"` : ''}`
                  : 'All Products'}
                {pagination && (
                  <small className="text-muted ms-2 fw-normal">({pagination.total} found)</small>
                )}
              </h6>
            </div>

            {loading ? <LoadingSpinner /> : products.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-search fs-1 text-muted opacity-50" />
                <p className="text-muted mt-3">No products found. Try adjusting your filters.</p>
                <button className="btn btn-outline-primary" onClick={clearAll}>Reset Filters</button>
              </div>
            ) : (
              <>
                <div className="row row-cols-2 row-cols-md-3 g-3">
                  {products.map((p) => (
                    <div key={p.id} className="col">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                  <nav className="mt-4 d-flex justify-content-center">
                    <ul className="pagination pagination-sm">
                      <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => updateFilter('page', pagination.current_page - 1)}>
                          <i className="bi bi-chevron-left" />
                        </button>
                      </li>
                      {(() => {
                        const total = pagination.last_page
                        const cur   = pagination.current_page
                        let start   = Math.max(1, cur - 2)
                        let end     = Math.min(total, start + 4)
                        start       = Math.max(1, end - 4)
                        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
                      })().map((page) => (
                        <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => updateFilter('page', page)}>{page}</button>
                        </li>
                      ))}
                      <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => updateFilter('page', pagination.current_page + 1)}>
                          <i className="bi bi-chevron-right" />
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
