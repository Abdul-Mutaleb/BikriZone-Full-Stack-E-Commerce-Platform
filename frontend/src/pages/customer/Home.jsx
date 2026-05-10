import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import ProductCard from '../../components/common/ProductCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

const CAT_COLORS = [
  '#FFF3E0', '#E8F5E9', '#E3F2FD', '#FCE4EC',
  '#F3E5F5', '#E0F2F1', '#FFF8E1', '#F1F8E9',
]
const CAT_ICONS = ['📱', '👗', '🏠', '⚽', '📚', '💄', '🧸', '🛒', '🍎', '🔧', '💻', '👟']

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [banners, setBanners] = useState([])
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const catRef = useRef(null)
  const scrollCat = (dir) => catRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' })

  useEffect(() => {
    document.title = 'BikriZone - Your One-Stop Shop in Bangladesh'
    Promise.all([
      api.get('/products/featured'),
      api.get('/categories'),
      api.get('/banners'),
    ]).then(([featRes, catRes, bannerRes]) => {
      setFeatured(featRes.data)
      // Fix 7: Put Grocery first in category sections
      const cats = [...catRes.data]
      const groceryIdx = cats.findIndex(c =>
        c.slug?.toLowerCase().includes('grocery') || c.name?.toLowerCase().includes('grocer')
      )
      if (groceryIdx > 0) cats.unshift(cats.splice(groceryIdx, 1)[0])
      setCategories(cats)
      setBanners(bannerRes.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setSlide((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  if (loading) return <LoadingSpinner />

  return (
    <>
      {/* ── Hero Banner Carousel ── */}
      {banners.length > 0 ? (
        <section className="banner-hero position-relative overflow-hidden">
          {banners.map((banner, i) => {
            const img = (
              <img
                src={`${storageUrl}/${banner.image}`}
                alt={banner.title || banner.subtitle || ''}
                className="w-100 hero-banner-img"
                style={{ objectFit: 'cover', display: 'block', width: '100%', opacity: i === slide ? 1 : 0, position: i === slide ? 'relative' : 'absolute', top: 0, left: 0, transition: 'opacity 0.6s ease' }}
              />
            )
            return (
              <div key={banner.id}>
                {banner.link ? <a href={banner.link}>{img}</a> : img}
                {i === slide && (banner.title || banner.subtitle) && (
                  <div className="position-absolute bottom-0 start-0 end-0 p-4" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }}>
                    <div className="container">
                      <h4 className="text-white fw-bold mb-1">{banner.title}</h4>
                      {banner.subtitle && <p className="text-white-50 mb-0">{banner.subtitle}</p>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {banners.length > 1 && (
            <>
              <button
                className="position-absolute top-50 start-0 translate-middle-y ms-2 btn btn-dark btn-sm rounded-circle opacity-75"
                onClick={() => setSlide((s) => (s - 1 + banners.length) % banners.length)}
                style={{ width: 36, height: 36, padding: 0, zIndex: 5 }}
              >
                <i className="bi bi-chevron-left" />
              </button>
              <button
                className="position-absolute top-50 end-0 translate-middle-y me-2 btn btn-dark btn-sm rounded-circle opacity-75"
                onClick={() => setSlide((s) => (s + 1) % banners.length)}
                style={{ width: 36, height: 36, padding: 0, zIndex: 5 }}
              >
                <i className="bi bi-chevron-right" />
              </button>
              {/* Dots — bottom center */}
              <div
                className="position-absolute start-0 end-0 d-flex justify-content-center gap-2"
                style={{ bottom: 12, zIndex: 5 }}
              >
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    style={{
                      width: i === slide ? 28 : 10,
                      height: 10,
                      borderRadius: 5,
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      background: i === slide ? '#fff' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.3s ease',
                      boxShadow: i === slide ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        /* Fallback hero when no banners uploaded yet */
        <section className="hero-section">
          <div className="container py-5">
            <div className="row align-items-center">
              <div className="col-lg-6">
                <div className="badge bg-white text-primary mb-3 px-3 py-2 rounded-pill">🎉 Exclusive Deals Available</div>
                <h1 className="display-4 fw-bold mb-3">Shop Smart,<br />Save More with <span style={{ color: '#F2B50B' }}>BikriZone</span></h1>
                <p className="lead opacity-75 mb-4">Discover thousands of products at unbeatable prices. Fast delivery across Bangladesh.</p>
                <div className="d-flex gap-3 flex-wrap">
                  <Link to="/products" className="btn btn-light btn-lg px-4 fw-semibold"><i className="bi bi-shop me-2" />Shop Now</Link>
                  <Link to="/products?featured=1" className="btn btn-outline-light btn-lg px-4">View Deals</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Feature Strips ── */}
      <section className="bg-white border-bottom py-2">
        <div className="container">
          <div className="row g-0 text-center">
            {[
              { icon: 'truck', text: 'Free Delivery on ৳2000+', short: 'Free Delivery' },
              { icon: 'shield-check', text: 'Secure bKash & COD', short: 'Secure Pay' },
              { icon: 'arrow-counterclockwise', text: '7-Day Easy Returns', short: 'Easy Returns' },
              { icon: 'headset', text: '24/7 Support', short: '24/7 Support' },
            ].map(({ icon, text, short }) => (
              <div key={text} className="col-6 col-md-3 py-2 d-flex align-items-center justify-content-center gap-1 gap-md-2 border-end">
                <i className={`bi bi-${icon} text-primary`} />
                <small className="fw-medium text-dark d-none d-sm-inline">{text}</small>
                <small className="fw-medium text-dark d-sm-none" style={{ fontSize: 11 }}>{short}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section className="container py-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold mb-0">Shop by Category</h5>
          <div className="d-flex align-items-center gap-2">
            <Link to="/products" className="text-primary text-decoration-none small me-1">View All <i className="bi bi-arrow-right" /></Link>
            <button className="cat-slider-btn" onClick={() => scrollCat(-1)}><i className="bi bi-chevron-left" /></button>
            <button className="cat-slider-btn" onClick={() => scrollCat(1)}><i className="bi bi-chevron-right" /></button>
          </div>
        </div>
        <div ref={catRef} className="category-slider d-flex justify-content-between pb-2">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className="flex-shrink-0 text-center"
              style={{ width: 110, cursor: 'pointer' }}
              onClick={() => navigate(`/products/category/${cat.slug}`)}
            >
              <div
                className="rounded-3 mb-2 d-flex align-items-center justify-content-center overflow-hidden"
                style={{ width: 110, height: 90, background: CAT_COLORS[i % CAT_COLORS.length] }}
              >
                {cat.image
                  ? <img src={`${storageUrl}/${cat.image}`} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 36 }}>{CAT_ICONS[i % CAT_ICONS.length]}</span>
                }
              </div>
              <div className="fw-semibold text-dark" style={{ fontSize: 12, lineHeight: 1.3 }}>{cat.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="container pb-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold mb-0">Featured Products</h5>
          <Link to="/products?featured=1" className="text-primary text-decoration-none small">See All <i className="bi bi-arrow-right" /></Link>
        </div>
        {featured.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-bag-x fs-1 opacity-25 d-block mb-2" />No featured products yet
          </div>
        ) : (() => {
          // Pick desktop column count that avoids a partial last row
          const n = featured.length
          const rowCols = (n % 4 === 0 && n <= 12)
            ? 'row-cols-2 row-cols-sm-3 row-cols-md-4'
            : 'row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-xl-5'
          return (
            <div className={`row ${rowCols} g-3 justify-content-center`}>
              {featured.map((p) => (
                <div key={p.id} className="col">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )
        })()}
      </section>

      {/* ── Category Product Sections ── */}
      {categories.slice(0, 4).map((cat, idx) => (
        <CategoryProductSection key={cat.id} cat={cat} idx={idx} />
      ))}

    

      {/* ── Promo Banner Strip ── */}
      <section className="container pb-5">
        <div className="row g-3">
          <div className="col-md-6">
            <div
              className="rounded-3 p-4 h-100 d-flex align-items-center gap-4"
              style={{ background: '#FFF3E0', border: '1px solid #FFE0B2' }}
            >
              <span style={{ fontSize: 48 }}>📦</span>
              <div>
                <div className="fw-bold fs-6">Free Shipping</div>
                <div className="text-muted small">On all orders above ৳2,000. Shop more, save more!</div>
                <Link to="/products" className="btn btn-sm btn-outline-primary mt-2">Shop Now</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div
              className="rounded-3 p-4 h-100 d-flex align-items-center gap-4"
              style={{ background: '#E8F5E9', border: '1px solid #C8E6C9' }}
            >
              <span style={{ fontSize: 48 }}>💳</span>
              <div>
                <div className="fw-bold fs-6">bKash Payment</div>
                <div className="text-muted small">Pay securely with bKash. 100% safe and instant.</div>
                <Link to="/products" className="btn btn-sm btn-outline-primary mt-2">Browse</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function CategoryProductSection({ cat, idx }) {
  const [products,    setProducts]    = useState([])
  const [loaded,      setLoaded]      = useState(false)
  const [activeDot,   setActiveDot]   = useState(0)
  const [perPage,     setPerPage]     = useState(4)
  const sliderRef = useRef(null)
  const navigate  = useNavigate()
  const GAP = 12

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setPerPage(w < 576 ? 2 : w < 992 ? 3 : 5)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    api.get('/products', { params: { category: cat.slug, per_page: 8 } })
      .then(({ data }) => setProducts(data.data?.slice(0, 8) || []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [cat.slug])

  if (!loaded || products.length === 0) return null

  // one dot per card, capped so last dot = last card fully visible
  const maxDot = Math.max(0, products.length - perPage)
  const totalDots = maxDot + 1
  const BG = idx % 2 === 0 ? '#f8faf8' : '#fff'

  const cardStep = () => {
    if (!sliderRef.current || !sliderRef.current.firstElementChild) return 0
    return sliderRef.current.firstElementChild.offsetWidth + GAP
  }

  const goTo = (dot) => {
    if (!sliderRef.current) return
    sliderRef.current.scrollTo({ left: dot * cardStep(), behavior: 'smooth' })
    setActiveDot(Math.min(dot, maxDot))
  }

  const handleScroll = () => {
    if (!sliderRef.current) return
    const step = cardStep()
    if (!step) return
    const dot = Math.round(sliderRef.current.scrollLeft / step)
    setActiveDot(Math.min(dot, maxDot))
  }

  return (
    <section style={{ background: BG }} className="py-4">
      <div className="container">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold mb-0">{cat.name}</h5>
          <div className="d-flex align-items-center gap-2">
            <button
              className="cat-slider-btn"
              disabled={activeDot === 0}
              onClick={() => goTo(activeDot - 1)}
            >
              <i className="bi bi-chevron-left" />
            </button>
            <button
              className="cat-slider-btn"
              disabled={activeDot >= maxDot}
              onClick={() => goTo(activeDot + 1)}
            >
              <i className="bi bi-chevron-right" />
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => navigate(`/products/category/${cat.slug}`)}
            >
              View All <i className="bi bi-arrow-right ms-1" />
            </button>
          </div>
        </div>

        {/* Slider — each card is one snap point */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            gap: GAP,
          }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                flex: `0 0 calc(${100 / perPage}% - ${GAP * (perPage - 1) / perPage}px)`,
                width: `calc(${100 / perPage}% - ${GAP * (perPage - 1) / perPage}px)`,
                maxWidth: `calc(${100 / perPage}% - ${GAP * (perPage - 1) / perPage}px)`,
                scrollSnapAlign: 'start',
              }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {/* Dots — centered below slider */}
        {totalDots > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-3">
            {Array.from({ length: totalDots }, (_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width:        i === activeDot ? 28 : 10,
                  height:       10,
                  borderRadius: 5,
                  border:       'none',
                  padding:      0,
                  cursor:       'pointer',
                  background:   i === activeDot ? '#48A111' : 'rgba(72,161,17,0.25)',
                  transition:   'all 0.3s ease',
                  boxShadow:    i === activeDot ? '0 0 0 2px rgba(72,161,17,0.2)' : 'none',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
