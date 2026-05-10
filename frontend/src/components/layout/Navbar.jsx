import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../../store/useAuthStore'
import useCartStore from '../../store/useCartStore'
import useWishlistStore from '../../store/useWishlistStore'
import useLanguageStore from '../../store/useLanguageStore'
import LanguageSwitcher from '../common/LanguageSwitcher'
import NotificationBell from '../common/NotificationBell'
import api from '../../services/api'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, isAdmin } = useAuthStore()
  const count = useCartStore((s) => s.count)
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const { t, lang, setLang } = useLanguageStore()
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [categories, setCategories] = useState([])
  const searchRef = useRef()
  const mobileSearchRef = useRef()
  const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (search.length < 1) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products/search?q=${search}`)
        setSuggestions(data)
        setShowSuggestions(true)
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (showMobileSearch) setTimeout(() => mobileSearchRef.current?.focus(), 100)
  }, [showMobileSearch])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search)}`)
      setShowSuggestions(false)
      setShowMobileSearch(false)
      setSearch('')
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const SuggestionsDropdown = () =>
    showSuggestions && suggestions.length > 0 ? (
      <div className="search-dropdown">
        {suggestions.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.slug}`}
            className="d-flex align-items-center px-3 py-2 text-decoration-none text-dark border-bottom"
            onClick={() => { setShowSuggestions(false); setSearch(''); setShowMobileSearch(false) }}
          >
            {p.thumbnail && (
              <img src={`${storageUrl}/${p.thumbnail}`} width={40} height={40} className="rounded me-2" style={{ objectFit: 'cover' }} alt="" />
            )}
            <div>
              <div className="fw-medium" style={{ fontSize: 14 }}>{p.name}</div>
              <small className="text-primary">৳{p.sale_price ?? p.price}</small>
            </div>
          </Link>
        ))}
      </div>
    ) : null

  const NavAction = ({ to, icon, label, badge, onClick, children }) => {
    const inner = (
      <span className="d-flex flex-column align-items-center" style={{ gap: 1 }}>
        <span className="position-relative">
          <i className={`bi bi-${icon}`} style={{ fontSize: 20 }} />
          {badge > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
              style={{ background: '#F2B50B', color: '#25671E', fontSize: 9, fontWeight: 700, padding: '2px 5px', minWidth: 16 }}>
              {badge}
            </span>
          )}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#333', whiteSpace: 'nowrap' }}>{label}</span>
      </span>
    )
    if (onClick) return <button className="btn p-1 px-2 border-0 bg-transparent" onClick={onClick}>{inner}{children}</button>
    return <Link to={to} className="text-decoration-none p-1 px-2">{inner}{children}</Link>
  }

  return (
    <nav className="navbar-megabazar">

      {/* ── Top Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <div className="container">
          <div className="d-flex align-items-center py-2" style={{ gap: 12 }}>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src="/logo 1.png" alt="BikriZone" className="navbar-logo" />
            </Link>

            {/* Search — centered, hidden xs */}
            <div className="flex-grow-1 d-none d-sm-flex justify-content-center">
              <div className="position-relative" style={{ width: '100%', maxWidth: 420 }}>
                <form onSubmit={handleSearch}>
                  <div className="input-group">
                    <input
                      ref={searchRef}
                      type="text"
                      className="form-control"
                      placeholder={t('nav.search') || 'Search products…'}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => suggestions.length && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      style={{ borderColor: '#ddd', borderRight: 'none' }}
                    />
                    <button className="btn px-3" type="submit"
                      style={{ background: '#48A111', borderColor: '#48A111', color: '#fff' }}>
                      <i className="bi bi-search" />
                    </button>
                  </div>
                </form>
                <SuggestionsDropdown />
              </div>
            </div>

            {/* Right Actions */}
            <div className="d-flex align-items-center gap-1 flex-shrink-0 ms-auto ms-sm-0">

              {/* Mobile search toggle — xs only */}
              <button className="btn p-1 px-2 border-0 bg-transparent d-sm-none"
                onClick={() => setShowMobileSearch((s) => !s)}>
                <span className="d-flex flex-column align-items-center" style={{ gap: 1 }}>
                  <i className={`bi bi-${showMobileSearch ? 'x' : 'search'}`} style={{ fontSize: 20 }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>Search</span>
                </span>
              </button>

              {/* Track Order — lg+ only */}
              <span className="d-none d-lg-flex">
                <NavAction to="/orders" icon="geo-alt" label="Track Order" />
              </span>

              {/* Notifications — md+ only */}
              {isAuthenticated() && (
                <span className="d-none d-md-flex flex-column align-items-center p-1 px-2" style={{ gap: 1 }}>
                  <NotificationBell />
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>Alerts</span>
                </span>
              )}

              {/* Sign In / User — always visible */}
              {isAuthenticated() ? (
                <div className="dropdown">
                  <button className="btn p-1 px-2 border-0 bg-transparent dropdown-toggle-no-caret" data-bs-toggle="dropdown">
                    <span className="d-flex flex-column align-items-center" style={{ gap: 1 }}>
                      {user?.avatar
                        ? <img src={`${storageUrl}/${user.avatar}`} width={20} height={20} className="rounded-circle" alt="" />
                        : <i className="bi bi-person" style={{ fontSize: 20 }} />}
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#333', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name?.split(' ')[0]}
                      </span>
                    </span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ minWidth: 180 }}>
                    <li><Link className="dropdown-item small" to="/profile"><i className="bi bi-person me-2" />{t('nav.profile') || 'Profile'}</Link></li>
                    <li><Link className="dropdown-item small" to="/orders"><i className="bi bi-bag me-2" />{t('nav.orders') || 'Orders'}</Link></li>
                    {isAdmin() && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li><Link className="dropdown-item small text-primary" to="/admin"><i className="bi bi-speedometer2 me-2" />{t('nav.admin') || 'Admin Panel'}</Link></li>
                      </>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item small text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" />{t('nav.logout') || 'Logout'}</button></li>
                  </ul>
                </div>
              ) : (
                <NavAction to="/login" icon="person" label="Sign In" />
              )}

              {/* Wishlist — md+ only */}
              <span className="d-none d-md-flex">
                <NavAction to="/wishlist" icon="heart" label="Wishlist" badge={wishlistCount} />
              </span>

              {/* Cart — always visible */}
              <NavAction to="/cart" icon="cart3" label="Cart" badge={count} />

              {/* Language dropdown — md+ only */}
              <div className="dropdown d-none d-md-block">
                <button className="btn p-1 px-2 border-0 bg-transparent dropdown-toggle-no-caret" data-bs-toggle="dropdown">
                  <span className="d-flex flex-column align-items-center" style={{ gap: 1 }}>
                    <i className="bi bi-globe" style={{ fontSize: 20 }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>{lang === 'bn' ? 'বাং' : 'EN'}</span>
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-2" style={{ minWidth: 100 }}>
                  <li>
                    <button className={`dropdown-item small rounded mb-1 ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
                      🇬🇧 English
                    </button>
                  </li>
                  <li>
                    <button className={`dropdown-item small rounded ${lang === 'bn' ? 'active' : ''}`} onClick={() => setLang('bn')}>
                      🇧🇩 বাংলা
                    </button>
                  </li>
                </ul>
              </div>

              {/* More dropdown — always visible */}
              <div className="dropdown">
                <button className="btn p-1 px-2 border-0 bg-transparent" data-bs-toggle="dropdown">
                  <span className="d-flex flex-column align-items-center" style={{ gap: 1 }}>
                    <i className="bi bi-list" style={{ fontSize: 20 }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#333' }}>More</span>
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ minWidth: 180 }}>
                  {/* Track Order — shown in More only when hidden from top bar (xs/sm/md) */}
                  <li className="d-lg-none">
                    <Link className="dropdown-item small" to="/orders"><i className="bi bi-geo-alt me-2 text-success" />Track Order</Link>
                  </li>
                  <li className="d-lg-none"><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item small" to="/about"><i className="bi bi-person-badge me-2 text-primary" />About Us</Link></li>
                  <li><Link className="dropdown-item small" to="/wishlist"><i className="bi bi-heart me-2 text-danger" />Wishlists</Link></li>
                  <li><Link className="dropdown-item small" to="/faqs"><i className="bi bi-question-square me-2 text-secondary" />FAQs</Link></li>
                  <li><a className="dropdown-item small" href="tel:+8801805232206"><i className="bi bi-telephone me-2 text-success" />Call Us</a></li>
                  <li><a className="dropdown-item small" href="https://wa.me/8801805232206" target="_blank" rel="noreferrer"><i className="bi bi-whatsapp me-2" style={{ color: '#25D366' }} />WhatsApp</a></li>
                  {/* Language switcher — shown in More only when hidden from top bar (xs/sm) */}
                  <li className="d-md-none"><hr className="dropdown-divider" /></li>
                  <li className="d-md-none">
                    <button className={`dropdown-item small rounded mb-1 ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
                      🇬🇧 English
                    </button>
                  </li>
                  <li className="d-md-none">
                    <button className={`dropdown-item small rounded ${lang === 'bn' ? 'active' : ''}`} onClick={() => setLang('bn')}>
                      🇧🇩 বাংলা
                    </button>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Mobile search row */}
          {showMobileSearch && (
            <div className="d-sm-none pb-2 position-relative">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    ref={mobileSearchRef}
                    type="text"
                    className="form-control"
                    placeholder={t('nav.search') || 'Search products…'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => suggestions.length && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    style={{ borderColor: '#ddd', borderRight: 'none' }}
                    autoFocus
                  />
                  <button className="btn px-3" type="submit"
                    style={{ background: '#48A111', borderColor: '#48A111', color: '#fff' }}>
                    <i className="bi bi-search" />
                  </button>
                </div>
              </form>
              <SuggestionsDropdown />
            </div>
          )}
        </div>
      </div>

      {/* ── Category Bar ── */}
      <div style={{ background: '#25671E' }}>
        <div className="container">
          <div
            className="d-flex gap-3 gap-md-4 py-2"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <Link to="/products"
              className="text-decoration-none text-nowrap fw-semibold"
              style={{ color: '#F2B50B', fontSize: 13 }}>
              All Products
            </Link>
            {categories.slice(0, 12).map((cat) => (
              <Link key={cat.id} to={`/products/category/${cat.slug}`}
                className="text-decoration-none text-white text-nowrap"
                style={{ fontSize: 13, opacity: 0.9 }}>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </nav>
  )
}
