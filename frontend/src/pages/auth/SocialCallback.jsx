import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../../store/useAuthStore'
import useCartStore from '../../store/useCartStore'
import useWishlistStore from '../../store/useWishlistStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function SocialCallback() {
  const navigate = useNavigate()
  const { loginRedirect } = useAuthStore()
  const fetchCart = useCartStore((s) => s.fetchCart)
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userRaw = params.get('user')
    const error = params.get('error')

    if (error || !token || !userRaw) {
      if (error === 'not_configured') {
        toast.error('Social login is not configured yet. Please sign in with email.')
      } else {
        toast.error('Social login failed. Please try again.')
      }
      navigate('/login')
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw))
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      // update zustand store directly
      useAuthStore.setState({ user, token })
      Promise.all([fetchCart(), fetchWishlist()]).catch(() => {})
      toast.success(`Welcome, ${user.name}!`)
      const role = user.role
      if (['admin', 'super_admin', 'order_manager'].includes(role)) {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch {
      toast.error('Social login failed. Please try again.')
      navigate('/login')
    }
  }, [])

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #48A111 0%, #25671E 100%)' }}>
      <div className="text-center text-white">
        <LoadingSpinner />
        <p className="mt-3">Completing sign in…</p>
      </div>
    </div>
  )
}
