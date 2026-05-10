import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useEffect } from 'react'

// Layout
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ChatWidget from './components/common/ChatWidget'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import SocialCallback from './pages/auth/SocialCallback'

// Customer Pages
import Home from './pages/customer/Home'
import Products from './pages/customer/Products'
import ProductDetail from './pages/customer/ProductDetail'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import OrderSuccess from './pages/customer/OrderSuccess'
import Orders from './pages/customer/Orders'
import OrderDetail from './pages/customer/OrderDetail'
import Wishlist from './pages/customer/Wishlist'
import Profile from './pages/customer/Profile'
import AboutUs from './pages/customer/AboutUs'
import Faqs from './pages/customer/Faqs'

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminReviews from './pages/admin/AdminReviews'
import AdminChat from './pages/admin/AdminChat'
import AdminSettings from './pages/admin/AdminSettings'
import AdminCategories from './pages/admin/AdminCategories'
import AdminBanners from './pages/admin/AdminBanners'
import AdminERP from './pages/admin/AdminERP'
import AdminFraud from './pages/admin/AdminFraud'

// Stores
import useAuthStore from './store/useAuthStore'
import useCartStore from './store/useCartStore'
import useWishlistStore from './store/useWishlistStore'

function CustomerLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="navbar-offset" />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </>
  )
}

// Requires login
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Requires any admin role — blocks customers from /admin/*
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/" replace />
  return children
}

// Redirects logged-in users away from guest-only pages (login/register)
function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  if (isAuthenticated()) return <Navigate to={isAdmin() ? '/admin' : '/'} replace />
  return children
}

// Requires a specific permission — redirects within admin if not allowed
function AdminPermRoute({ permission, children }) {
  const { canAccess } = useAuthStore()
  if (!canAccess(permission)) return <Navigate to="/admin" replace />
  return children
}

function App() {
  const { isAuthenticated } = useAuthStore()
  const fetchCart = useCartStore((s) => s.fetchCart)
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist)

  useEffect(() => {
    if (isAuthenticated()) {
      fetchCart()
      fetchWishlist()
    }
  }, [])

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Auth — guests only */}
        <Route path="/login" element={<CustomerLayout><GuestRoute><Login /></GuestRoute></CustomerLayout>} />
        <Route path="/register" element={<CustomerLayout><GuestRoute><Register /></GuestRoute></CustomerLayout>} />
        <Route path="/social-callback" element={<SocialCallback />} />

        {/* Customer */}
        <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
        <Route path="/products" element={<CustomerLayout><Products /></CustomerLayout>} />
        <Route path="/products/category/:categorySlug" element={<CustomerLayout><Products /></CustomerLayout>} />
        <Route path="/products/:slug" element={<CustomerLayout><ProductDetail /></CustomerLayout>} />
        <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
        <Route path="/wishlist" element={<CustomerLayout><ProtectedRoute><Wishlist /></ProtectedRoute></CustomerLayout>} />
        <Route path="/checkout" element={<CustomerLayout><ProtectedRoute><Checkout /></ProtectedRoute></CustomerLayout>} />
        <Route path="/order-success/:id" element={<CustomerLayout><ProtectedRoute><OrderSuccess /></ProtectedRoute></CustomerLayout>} />
        <Route path="/orders" element={<CustomerLayout><ProtectedRoute><Orders /></ProtectedRoute></CustomerLayout>} />
        <Route path="/orders/:id" element={<CustomerLayout><ProtectedRoute><OrderDetail /></ProtectedRoute></CustomerLayout>} />
        <Route path="/profile" element={<CustomerLayout><ProtectedRoute><Profile /></ProtectedRoute></CustomerLayout>} />
        <Route path="/about" element={<CustomerLayout><AboutUs /></CustomerLayout>} />
        <Route path="/faqs" element={<CustomerLayout><Faqs /></CustomerLayout>} />

        {/* Admin — outer guard: must be any admin role */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />

          <Route path="orders"    element={<AdminPermRoute permission="orders"><AdminOrders /></AdminPermRoute>} />
          <Route path="customers" element={<AdminPermRoute permission="customers"><AdminCustomers /></AdminPermRoute>} />
          <Route path="chat"      element={<AdminPermRoute permission="chat"><AdminChat /></AdminPermRoute>} />

          <Route path="products"   element={<AdminPermRoute permission="products"><AdminProducts /></AdminPermRoute>} />
          <Route path="categories" element={<AdminPermRoute permission="categories"><AdminCategories /></AdminPermRoute>} />
          <Route path="coupons"    element={<AdminPermRoute permission="coupons"><AdminCoupons /></AdminPermRoute>} />
          <Route path="reviews"    element={<AdminPermRoute permission="reviews"><AdminReviews /></AdminPermRoute>} />
          <Route path="banners"    element={<AdminPermRoute permission="banners"><AdminBanners /></AdminPermRoute>} />
          <Route path="erp"        element={<AdminPermRoute permission="erp"><AdminERP /></AdminPermRoute>} />
          <Route path="fraud"      element={<AdminPermRoute permission="fraud"><AdminFraud /></AdminPermRoute>} />

          <Route path="settings"   element={<AdminPermRoute permission="settings"><AdminSettings /></AdminPermRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
