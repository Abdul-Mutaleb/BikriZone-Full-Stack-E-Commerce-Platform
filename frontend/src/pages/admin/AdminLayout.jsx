import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../../store/useAuthStore'
import useLanguageStore from '../../store/useLanguageStore'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import NotificationBell from '../../components/common/NotificationBell'

const navItems = [
  { to: '/admin',            icon: 'speedometer2',      labelKey: 'admin.dashboard',  end: true,  permission: 'dashboard' },
  { to: '/admin/products',   icon: 'box',               labelKey: 'admin.products',               permission: 'products' },
  { to: '/admin/categories', icon: 'tags',              labelKey: 'admin.categories',             permission: 'categories' },
  { to: '/admin/orders',     icon: 'bag-check',         labelKey: 'admin.orders',                 permission: 'orders' },
  { to: '/admin/customers',  icon: 'people',            labelKey: 'admin.customers',              permission: 'customers' },
  { to: '/admin/coupons',    icon: 'ticket-perforated', labelKey: 'admin.coupons',                permission: 'coupons' },
  { to: '/admin/reviews',    icon: 'star',              labelKey: 'admin.reviews',                permission: 'reviews' },
  { to: '/admin/banners',    icon: 'images',            labelKey: 'admin.banners',                permission: 'banners' },
  { to: '/admin/erp',        icon: 'graph-up',          labelKey: 'admin.erp',                    permission: 'erp' },
  { to: '/admin/fraud',      icon: 'shield-exclamation', labelKey: 'admin.fraud',                 permission: 'fraud' },
  { to: '/admin/chat',       icon: 'chat-dots',         labelKey: 'admin.chat',                   permission: 'chat' },
  { to: '/admin/settings',   icon: 'gear',              labelKey: 'admin.settings',               permission: 'settings' },
]

const pageTitles = {
  '/admin':            'Dashboard',
  '/admin/products':   'Products',
  '/admin/categories': 'Categories',
  '/admin/orders':     'Orders',
  '/admin/customers':  'Customers',
  '/admin/coupons':    'Coupons',
  '/admin/reviews':    'Reviews & Q&A',
  '/admin/banners':    'Banners',
  '/admin/erp':        'ERP Management',
  '/admin/fraud':      'Fraud Detection',
  '/admin/chat':       'Chat Inbox',
  '/admin/settings':   'Settings',
}

export default function AdminLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout, canAccess, isSuperAdmin } = useAuthStore()
  const { t } = useLanguageStore()

  const [sidebarOpen,      setSidebarOpen]      = useState(false)   // mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)   // desktop collapse

  const visibleNavItems = navItems.filter((item) => canAccess(item.permission))

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  // Single toggle button: mobile → overlay, desktop → collapse
  const handleSidebarToggle = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen((prev) => !prev)
    } else {
      setSidebarCollapsed((prev) => !prev)
    }
  }

  const currentTitle = pageTitles[location.pathname] || 'Admin'
  const storageUrl   = import.meta.env.VITE_STORAGE_URL || ''

  return (
    <div>
      {/* Sidebar */}
      <div className={`admin-sidebar${sidebarOpen ? ' show' : ''}${sidebarCollapsed ? ' collapsed' : ''}`}>
        {/* Brand */}
        <div className="px-3 py-2 border-bottom border-secondary d-flex align-items-center gap-2">
          <div style={{ background: '#fff', borderRadius: 8, padding: '2px 4px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img src="/logo 2.png" alt="BikriZone" style={{ height: 32, width: 32, objectFit: 'contain', display: 'block' }} />
          </div>
          <div className="sidebar-text overflow-hidden flex-grow-1">
            <div className="fw-bold text-white" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
              Bikri<span style={{ color: '#F2B50B' }}>Zone</span>
            </div>
            <div className="sidebar-brand-sub text-secondary" style={{ fontSize: 10 }}>Admin Panel</div>
          </div>
          {/* Close button — visible on mobile when sidebar is open */}
          <button
            className="btn btn-sm d-md-none ms-auto"
            style={{ color: '#aaa', lineHeight: 1 }}
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
          >
            <i className="bi bi-x-lg fs-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="p-2 mt-2" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}>
          <div className="sidebar-text small text-secondary px-3 mb-1 text-uppercase fw-semibold sidebar-brand-sub" style={{ fontSize: 10 }}>
            Main Menu
          </div>
          {visibleNavItems.map(({ to, icon, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? t(labelKey) : undefined}
            >
              <i className={`bi bi-${icon}`} style={{ flexShrink: 0, fontSize: 16 }} />
              <span className="sidebar-text">{t(labelKey)}</span>
            </NavLink>
          ))}
        </div>

        {/* User Footer */}
        <div className="sidebar-user p-3 border-top border-secondary w-100" style={{ background: 'var(--secondary)', flexShrink: 0 }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            {user?.avatar ? (
              <img src={`${storageUrl}/${user.avatar}`} alt="" className="rounded-circle flex-shrink-0"
                style={{ width: 34, height: 34, objectFit: 'cover' }} />
            ) : (
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                style={{ width: 34, height: 34, background: '#F2B50B', fontSize: 14, color: '#25671E' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-white small fw-medium text-truncate" style={{ maxWidth: 140 }}>{user?.name}</div>
              <div className="text-secondary text-capitalize" style={{ fontSize: 10 }}>
                {user?.role?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <NavLink to="/" className="btn btn-outline-secondary btn-sm flex-grow-1" style={{ fontSize: 11 }}>
              <i className="bi bi-house me-1" />Shop
            </NavLink>
            <button className="btn btn-outline-danger btn-sm flex-grow-1" style={{ fontSize: 11 }} onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1" />Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="d-md-none position-fixed w-100 h-100 bg-dark"
          style={{ top: 0, left: 0, zIndex: 1010, opacity: 0.5 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`admin-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>

        {/* ── Top Navigation Bar ── */}
        <div className="admin-topbar d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom">

          {/* Left: toggle + breadcrumb */}
          <div className="d-flex align-items-center gap-3">
            {/* Topbar toggle — hamburger on mobile, collapse icon on desktop */}
            <button
              className="btn btn-sm btn-light d-flex align-items-center justify-content-center"
              style={{ width: 36, height: 36, flexShrink: 0 }}
              onClick={handleSidebarToggle}
              title="Toggle sidebar"
            >
              <i className={`bi bi-${
                window.innerWidth < 768
                  ? 'list'
                  : sidebarCollapsed ? 'layout-sidebar-reverse' : 'layout-sidebar'
              } fs-5`} />
            </button>

            <div className="d-none d-md-block">
              <h6 className="mb-0 fw-bold" style={{ color: '#25671E' }}>{currentTitle}</h6>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0" style={{ fontSize: 11 }}>
                  <li className="breadcrumb-item">
                    <NavLink to="/admin" className="text-decoration-none" style={{ color: '#48A111' }}>Admin</NavLink>
                  </li>
                  {location.pathname !== '/admin' && (
                    <li className="breadcrumb-item active text-muted">{currentTitle}</li>
                  )}
                </ol>
              </nav>
            </div>
          </div>

          {/* Right: actions */}
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitcher className="d-none d-md-flex" />

            {/* Notification bell */}
            <NotificationBell />

            {/* Add Product shortcut */}
            {canAccess('products') && (
              <NavLink to="/admin/products"
                className="btn btn-sm btn-outline-primary d-none d-lg-inline-flex align-items-center gap-1">
                <i className="bi bi-plus-lg" />
                <span style={{ fontSize: 12 }}>Add Product</span>
              </NavLink>
            )}

            {/* User dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2 px-2"
                data-bs-toggle="dropdown"
              >
                {user?.avatar ? (
                  <img src={`${storageUrl}/${user.avatar}`} alt="" className="rounded-circle"
                    style={{ width: 28, height: 28, objectFit: 'cover' }} />
                ) : (
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                    style={{ width: 28, height: 28, background: '#48A111', fontSize: 12 }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="d-none d-lg-inline small fw-medium">{user?.name?.split(' ')[0]}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ minWidth: 190 }}>
                <li className="px-3 py-2 border-bottom">
                  <div className="fw-semibold small">{user?.name}</div>
                  <div className="text-muted text-capitalize" style={{ fontSize: 11 }}>
                    {user?.role?.replace(/_/g, ' ')}
                  </div>
                </li>
                <li><NavLink to="/"        className="dropdown-item small"><i className="bi bi-house me-2" />View Store</NavLink></li>
                <li><NavLink to="/profile" className="dropdown-item small"><i className="bi bi-person me-2" />My Profile</NavLink></li>
                {isSuperAdmin() && (
                  <li><NavLink to="/admin/settings" className="dropdown-item small"><i className="bi bi-gear me-2" />Settings</NavLink></li>
                )}
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item small text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2" />Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-3 px-md-4 pb-4 pt-3">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
