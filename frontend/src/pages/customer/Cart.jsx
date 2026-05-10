import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useCartStore from '../../store/useCartStore'
import useAuthStore from '../../store/useAuthStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function Cart() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { items, subtotal, count, loading, fetchCart, updateItem, removeItem } = useCartStore()

  useEffect(() => {
    document.title = 'Cart - BikriZone'
    fetchCart()
  }, [])

  const shippingCharge = subtotal >= 2000 ? 0 : 60
  const total = subtotal + shippingCharge

  if (loading) return <LoadingSpinner />

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart3 fs-1 text-muted opacity-50 d-block mb-3" />
        <h4>Your cart is empty</h4>
        <p className="text-muted mb-4">Add some products to continue shopping</p>
        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Shopping Cart <span className="text-muted fs-5 fw-normal">({count} items)</span></h2>

      <div className="row g-4">
        {/* Cart Items */}
        <div className="col-lg-8">
          {items.map((item) => {
            const price = item.variant?.price ?? item.product?.sale_price ?? item.product?.price ?? 0
            const imgSrc = item.product?.thumbnail ? `${storageUrl}/${item.product.thumbnail}` : `https://placehold.co/80x80/f5f5f5/999?text=IMG`

            return (
              <div key={item.id} className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                  <div className="d-flex gap-3 align-items-start">
                    <img src={imgSrc} className="rounded flex-shrink-0" width={72} height={72} style={{ objectFit: 'cover' }} alt="" />
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <Link to={`/products/${item.product?.slug}`} className="fw-semibold text-dark text-decoration-none d-block text-truncate">
                        {item.product?.name}
                      </Link>
                      {item.variant && (
                        <div className="small text-muted">
                          {item.variant.size && `Size: ${item.variant.size}`}
                          {item.variant.color && ` | Color: ${item.variant.color}`}
                        </div>
                      )}
                      <div className="fw-bold mt-1" style={{ color: '#48A111' }}>৳{price}</div>
                      {/* Controls — inline on md+, wraps to next line on sm/xs */}
                      <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                        <div className="input-group input-group-sm" style={{ width: 110, flexShrink: 0 }}>
                          <button className="btn btn-outline-secondary" onClick={() => item.quantity > 1 && updateItem(item.id, item.quantity - 1)}>-</button>
                          <span className="form-control text-center">{item.quantity}</span>
                          <button className="btn btn-outline-secondary" onClick={() => updateItem(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <div className="fw-bold text-nowrap" style={{ color: '#333' }}>৳{(price * item.quantity).toFixed(2)}</div>
                        <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => removeItem(item.id)}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Order Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal ({count} items)</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Shipping</span>
                <span className={shippingCharge === 0 ? 'text-success' : ''}>
                  {shippingCharge === 0 ? 'FREE' : `৳${shippingCharge}`}
                </span>
              </div>
              {subtotal < 2000 && (
                <div className="alert alert-info py-2 small">
                  Add ৳{(2000 - subtotal).toFixed(0)} more for free shipping!
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                <span>Total</span>
                <span style={{ color: '#48A111' }}>৳{total.toFixed(2)}</span>
              </div>
              {isAuthenticated() ? (
                <button className="btn btn-primary w-100 btn-lg" onClick={() => navigate('/checkout')}>
                  <i className="bi bi-credit-card me-2" />Proceed to Checkout
                </button>
              ) : (
                <>
                  <button className="btn btn-primary w-100 btn-lg" onClick={() => navigate('/login')}>
                    <i className="bi bi-box-arrow-in-right me-2" />Login to Checkout
                  </button>
                  <small className="text-muted d-block text-center mt-1">Your cart will be saved after login</small>
                </>
              )}
              <Link to="/products" className="btn btn-outline-secondary w-100 mt-2">
                <i className="bi bi-arrow-left me-2" />Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
