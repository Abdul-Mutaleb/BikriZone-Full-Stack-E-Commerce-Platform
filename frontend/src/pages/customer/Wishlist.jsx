import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import useWishlistStore from '../../store/useWishlistStore'
import useCartStore from '../../store/useCartStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function Wishlist() {
  const { items, fetchWishlist, toggle } = useWishlistStore()
  const { addToCart } = useCartStore()

  useEffect(() => {
    document.title = 'Wishlist - BikriZone'
    fetchWishlist()
  }, [])

  const handleRemove = async (productId) => {
    await toggle(productId)
    toast.success('Removed from wishlist')
  }

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId)
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    }
  }

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">My Wishlist <span className="text-muted fs-5 fw-normal">({items.length} items)</span></h2>

      {items.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-heart fs-1 text-muted opacity-50 d-block mb-3" />
          <h5>Your wishlist is empty</h5>
          <p className="text-muted mb-4">Save products you love for later</p>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="row g-3">
          {items.map((item) => {
            const product = item.product
            if (!product) return null
            const imgSrc = product.thumbnail ? `${storageUrl}/${product.thumbnail}` : `https://placehold.co/200x200/f5f5f5/999?text=IMG`

            return (
              <div key={item.id} className="col-6 col-md-4 col-lg-3">
                <div className="product-card h-100">
                  <Link to={`/products/${product.slug}`} className="text-decoration-none text-dark">
                    <div className="product-img-wrapper">
                      <img src={imgSrc} alt={product.name} />
                      {product.sale_price && <span className="badge-sale">SALE</span>}
                    </div>
                    <div className="p-3">
                      <h6 className="fw-semibold mb-1 text-truncate">{product.name}</h6>
                      <div>
                        <span className="fw-bold" style={{ color: '#48A111' }}>৳{product.sale_price ?? product.price}</span>
                        {product.sale_price && <small className="text-muted text-decoration-line-through ms-1">৳{product.price}</small>}
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-3 d-flex gap-2">
                    <button className="btn btn-primary btn-sm flex-grow-1" onClick={() => handleAddToCart(product.id)} disabled={product.stock === 0}>
                      <i className="bi bi-cart-plus me-1" />{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleRemove(product.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
