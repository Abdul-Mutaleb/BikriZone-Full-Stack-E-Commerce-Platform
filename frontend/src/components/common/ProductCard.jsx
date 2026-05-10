import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import useCartStore from '../../store/useCartStore'
import useWishlistStore from '../../store/useWishlistStore'
import useAuthStore from '../../store/useAuthStore'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore()
  const { toggle, isWishlisted } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()
  const wishlisted = isWishlisted(product.id)

  const salePercent = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : null

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await addToCart(product.id, null, 1, product)
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    }
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated()) { toast.info('Please login to add to wishlist'); return }
    try {
      const res = await toggle(product.id)
      toast.success(res.message)
    } catch {}
  }

  const placeholder = `https://placehold.co/300x300/f5f5f5/999?text=${encodeURIComponent(product.name)}`
  const imgSrc = product.thumbnail ? `${storageUrl}/${product.thumbnail}` : placeholder

  return (
    <div className="product-card h-100" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Clickable area grows to push button down */}
      <Link
        to={`/products/${product.slug}`}
        className="text-decoration-none text-dark"
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        {/* Image — fixed height */}
        <div className="product-img-wrapper">
          <img
            src={imgSrc}
            alt={product.name}
            loading="lazy"
            onError={(e) => { e.target.onerror = null; e.target.src = placeholder }}
          />
          {salePercent && <span className="badge-sale">-{salePercent}%</span>}
          <button className={`wishlist-btn ${wishlisted ? 'active' : ''}`} onClick={handleWishlist} title="Add to Wishlist">
            <i className={`bi bi-heart${wishlisted ? '-fill' : ''}`} style={{ color: wishlisted ? '#48A111' : '#666' }} />
          </button>
        </div>

        {/* Info */}
        <div className="p-2" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Category */}
          <div className="text-muted text-truncate mb-1" style={{ fontSize: 10, minHeight: 14 }}>
            {product.category?.name}
          </div>

          {/* Name — 2 lines */}
          <div
            className="fw-semibold mb-1"
            style={{
              fontSize: 12,
              lineHeight: 1.3,
              minHeight: '2.6em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </div>

          {/* Price + strikethrough side by side */}
          <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
            <span className="fw-bold" style={{ color: '#48A111', fontSize: 13 }}>
              ৳{product.sale_price ?? product.price}
            </span>
            {product.sale_price && (
              <span className="text-muted text-decoration-line-through" style={{ fontSize: 11 }}>
                ৳{product.price}
              </span>
            )}
          </div>

          {/* Stock badge */}
          <div style={{ minHeight: 16 }}>
            {product.stock === 0 && (
              <span className="badge bg-danger" style={{ fontSize: 10 }}>Out of Stock</span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="low-stock-badge">Low Stock</span>
            )}
          </div>
        </div>
      </Link>

      {/* Button */}
      <div className="px-2 pb-2">
        <button
          className="btn btn-outline-primary btn-sm w-100"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <i className="bi bi-cart-plus" />
          <span className="d-none d-sm-inline ms-1">
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </span>
        </button>
      </div>
    </div>
  )
}
