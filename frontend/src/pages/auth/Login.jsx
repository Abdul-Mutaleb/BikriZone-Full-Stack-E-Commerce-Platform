import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../../store/useAuthStore'
import useCartStore from '../../store/useCartStore'
import useWishlistStore from '../../store/useWishlistStore'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost/MKstore%20%E2%80%93%20Full-Stack%20E-Commerce%20Platform/backend/public/api'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const { login, loginRedirect } = useAuthStore()
  const fetchCart = useCartStore((s) => s.fetchCart)
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist)
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await login(form.identifier, form.password)
      await Promise.all([fetchCart(), fetchWishlist()])
      toast.success('Welcome back!')
      navigate(loginRedirect())
    } catch (err) {
      setErrors(err.response?.data?.errors || {})
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    window.location.href = `${apiBase}/auth/${provider}/redirect`
  }

  return (
    <div className="d-flex align-items-center justify-content-center px-3"
      style={{ background: '#f8f9fa', minHeight: 'calc(100vh - 130px)' }}>
      <div className="card shadow-sm border-0 overflow-hidden w-100" style={{ maxWidth: 820, borderRadius: 14 }}>
        <div className="row g-0">

          {/* Left branding */}
          <div className="col-md-4 d-none d-md-flex flex-column align-items-center justify-content-center text-white p-4"
            style={{ background: 'linear-gradient(160deg, #48A111 0%, #25671E 100%)' }}>
            <Link to="/" className="text-decoration-none text-white text-center" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              Bikri<span style={{ color: '#F2B50B' }}>Zone</span>
            </Link>
            <p className="mt-2 mb-0 text-center" style={{ fontSize: 13, opacity: 0.85 }}>Your one-stop shop for everything</p>
          </div>

          {/* Right form */}
          <div className="col-md-8 p-4">
            <h6 className="fw-bold mb-1">Sign in</h6>
            <p className="text-muted mb-3" style={{ fontSize: 12 }}>Sign in to your account to continue</p>

            <div className="d-flex gap-2 mb-3">
              <button type="button" className="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
                style={{ fontSize: 12, borderRadius: 8 }} onClick={() => handleSocialLogin('google')}>
                <GoogleIcon /><span className="fw-medium">Google</span>
              </button>
              <button type="button" className="btn flex-fill d-flex align-items-center justify-content-center gap-2 py-2 text-white"
                style={{ background: '#1877F2', border: 'none', fontSize: 12, borderRadius: 8 }} onClick={() => handleSocialLogin('facebook')}>
                <FacebookIcon /><span className="fw-medium">Facebook</span>
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3">
              <hr className="flex-grow-1 m-0" />
              <span className="text-muted px-1" style={{ fontSize: 11 }}>or with email / phone</span>
              <hr className="flex-grow-1 m-0" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label fw-medium mb-1" style={{ fontSize: 12 }}>Email or Phone</label>
                <input type="text" className={`form-control form-control-sm ${errors.identifier ? 'is-invalid' : ''}`}
                  value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="Enter email or phone number" required style={{ borderRadius: 8 }} />
                {errors.identifier && <div className="invalid-feedback">{errors.identifier[0]}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium mb-1" style={{ fontSize: 12 }}>Password</label>
                <input type="password" className={`form-control form-control-sm ${errors.password ? 'is-invalid' : ''}`}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password" required style={{ borderRadius: 8 }} />
                {errors.password && <div className="invalid-feedback">{errors.password[0]}</div>}
              </div>
              <button className="btn btn-primary w-100 py-2 fw-medium" type="submit" disabled={loading} style={{ borderRadius: 8, fontSize: 13 }}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {loading ? 'Signing In…' : 'Sign In'}
              </button>
            </form>

            <hr className="my-3" />
            <p className="text-center mt-3 mb-0" style={{ fontSize: 12 }}>
              Don't have an account? <Link to="/register" className="text-primary fw-medium">Sign Up</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
