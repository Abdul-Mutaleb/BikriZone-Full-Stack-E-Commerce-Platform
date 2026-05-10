import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../services/api'
import useCartStore from '../../store/useCartStore'
import useAuthStore from '../../store/useAuthStore'

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, subtotal, fetchCart } = useCartStore()
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState({
    shipping_name: user?.name || '',
    shipping_phone: user?.phone || '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    payment_method: 'bkash',
    coupon_code: '',
    notes: '',
  })
  const [coupon, setCoupon] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [bkashNumber, setBkashNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [paymentStep, setPaymentStep] = useState('form') // form | bkash-number | otp
  const [paymentId, setPaymentId] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [loading, setLoading] = useState(false)

  const shippingCharge = subtotal >= 2000 ? 0 : 60
  const total = subtotal - discount + shippingCharge

  useEffect(() => {
    document.title = 'Checkout - BikriZone'
    api.get('/addresses').then(({ data }) => setAddresses(data)).catch(() => {})
  }, [])

  // Scroll to top whenever payment step changes so input is visible and footer stays below
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [paymentStep])

  const applyCoupon = async () => {
    try {
      const { data } = await api.post('/orders/validate-coupon', { code: form.coupon_code, subtotal })
      setCoupon(data.coupon)
      setDiscount(data.discount)
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon')
      setCoupon(null)
      setDiscount(0)
    }
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/orders', { ...form, coupon_code: coupon?.code || undefined })
      setOrderId(data.order.id)

      if (form.payment_method === 'bkash') {
        setPaymentStep('bkash-number')
      } else {
        await fetchCart()
        navigate(`/order-success/${data.order.id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleBkashInit = async () => {
    if (!bkashNumber.match(/^01[3-9][0-9]{8}$/)) {
      toast.error('Enter a valid bKash number (11 digits)')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/bkash/initiate', { order_id: orderId, bkash_number: bkashNumber })
      setPaymentId(data.payment_id)
      setPaymentStep('otp')
      toast.info('OTP sent to your bKash number')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBkashVerify = async () => {
    setLoading(true)
    try {
      await api.post('/bkash/verify', { payment_id: paymentId, otp })
      await fetchCart()
      toast.success('Payment successful!')
      navigate(`/order-success/${orderId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const useAddress = (addr) => {
    setForm(prev => ({
      ...prev,
      shipping_name: addr.name,
      shipping_phone: addr.phone,
      shipping_address: addr.address_line1 + (addr.address_line2 ? ', ' + addr.address_line2 : ''),
      shipping_city: addr.city,
      shipping_postal_code: addr.postal_code || '',
    }))
  }

  if (paymentStep === 'bkash-number') {
    return (
      <div className="container py-5 d-flex justify-content-center">
        <div className="card shadow-lg" style={{ maxWidth: 420, width: '100%', borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <div className="fs-1">📱</div>
              <h4 className="fw-bold">bKash Payment</h4>
              <p className="text-muted small">Enter your bKash registered number</p>
              <div className="badge bg-primary fs-6 mb-2">Total: ৳{total.toFixed(2)}</div>
            </div>
            <div className="mb-3">
              <label className="form-label">bKash Number</label>
              <input type="tel" className="form-control" placeholder="01XXXXXXXXX" value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)} maxLength={11} />
            </div>
            <div className="alert alert-info small">
              <strong>Sandbox Mode:</strong> Use any valid 11-digit Bangladeshi number. OTP is <strong>123456</strong>.
            </div>
            <button className="btn btn-primary w-100" onClick={handleBkashInit} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              Send OTP
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (paymentStep === 'otp') {
    return (
      <div className="container py-5 d-flex justify-content-center">
        <div className="card shadow-lg" style={{ maxWidth: 420, width: '100%', borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <div className="fs-1">🔐</div>
              <h4 className="fw-bold">Enter OTP</h4>
              <p className="text-muted small">OTP sent to {bkashNumber}</p>
            </div>
            <div className="mb-3">
              <label className="form-label">OTP Code</label>
              <input type="text" className="form-control text-center fs-4 letter-spacing-4" placeholder="- - - - - -"
                value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
              <div className="form-text text-center">Demo OTP: <strong>123456</strong></div>
            </div>
            <button className="btn btn-success w-100 mb-2" onClick={handleBkashVerify} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              Verify & Pay ৳{total.toFixed(2)}
            </button>
            <button className="btn btn-outline-secondary w-100 btn-sm" onClick={() => setPaymentStep('bkash-number')}>
              Change Number
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Checkout</h2>
      <div className="row g-4">
        {/* Shipping Form */}
        <div className="col-lg-7">
          {addresses.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Saved Addresses</h6>
                <div className="d-flex flex-wrap gap-2">
                  {addresses.map((addr) => (
                    <button key={addr.id} className="btn btn-outline-primary btn-sm" onClick={() => useAddress(addr)}>
                      <i className="bi bi-geo-alt me-1" />{addr.label}: {addr.city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Shipping Information</h6>
              <div className="row g-3">
                {[
                  { label: 'Full Name', field: 'shipping_name', type: 'text', col: 6 },
                  { label: 'Phone Number', field: 'shipping_phone', type: 'tel', col: 6 },
                  { label: 'Address', field: 'shipping_address', type: 'text', col: 12 },
                  { label: 'City', field: 'shipping_city', type: 'text', col: 6 },
                  { label: 'Postal Code', field: 'shipping_postal_code', type: 'text', col: 6 },
                ].map(({ label, field, type, col }) => (
                  <div key={field} className={`col-md-${col}`}>
                    <label className="form-label small fw-medium">{label}</label>
                    <input type={type} className="form-control"
                      value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                  </div>
                ))}
                <div className="col-12">
                  <label className="form-label small fw-medium">Order Notes (Optional)</label>
                  <textarea className="form-control" rows={2} value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Payment Method</h6>
              <div className="d-flex payment-options-flex gap-3 flex-wrap">
                {[
                  { value: 'bkash', label: '📱 bKash', desc: 'Mobile payment (Sandbox)' },
                  { value: 'cod', label: '💵 Cash on Delivery', desc: 'Pay when delivered' },
                ].map(({ value, label, desc }) => (
                  <div key={value} className={`border rounded p-3 flex-grow-1 cursor-pointer ${form.payment_method === value ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                    style={{ cursor: 'pointer', minWidth: 140 }} onClick={() => setForm({ ...form, payment_method: value })}>
                    <div className="d-flex align-items-center gap-2">
                      <input type="radio" className="form-check-input" checked={form.payment_method === value} readOnly />
                      <div>
                        <div className="fw-semibold">{label}</div>
                        <div className="small text-muted">{desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Order Summary ({items.length} items)</h6>
              <div className="mb-3" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {items.map((item) => {
                  const price = item.variant?.price ?? item.product?.sale_price ?? item.product?.price ?? 0
                  return (
                    <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-truncate" style={{ maxWidth: 200 }}>{item.product?.name} ×{item.quantity}</span>
                      <span className="small fw-medium">৳{(price * item.quantity).toFixed(0)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Coupon */}
              <div className="input-group mb-3">
                <input type="text" className="form-control form-control-sm" placeholder="Coupon code"
                  value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} />
                <button className="btn btn-outline-primary btn-sm" onClick={applyCoupon}>Apply</button>
              </div>

              <hr />
              <div className="d-flex justify-content-between mb-1"><span className="text-muted">Subtotal</span><span>৳{subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="d-flex justify-content-between mb-1 text-success"><span>Discount</span><span>-৳{discount.toFixed(2)}</span></div>}
              <div className="d-flex justify-content-between mb-1"><span className="text-muted">Shipping</span><span>{shippingCharge === 0 ? <span className="text-success">FREE</span> : `৳${shippingCharge}`}</span></div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                <span>Total</span>
                <span style={{ color: '#48A111' }}>৳{total.toFixed(2)}</span>
              </div>

              <button className="btn btn-primary w-100 btn-lg" onClick={handlePlaceOrder}
                disabled={loading || !form.shipping_name || !form.shipping_address || !form.shipping_city}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {form.payment_method === 'bkash' ? '💳 Pay with bKash' : '📦 Place Order (COD)'}
              </button>
              <Link to="/cart" className="btn btn-outline-secondary w-100 mt-2 btn-sm">Back to Cart</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
