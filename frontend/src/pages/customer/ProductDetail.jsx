import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../services/api'
import useCartStore from '../../store/useCartStore'
import useWishlistStore from '../../store/useWishlistStore'
import useAuthStore from '../../store/useAuthStore'
import StarRating from '../../components/common/StarRating'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

const PHONE = '01805232206'
const PHONE_INTL = '+8801805232206'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCartStore()
  const { toggle, isWishlisted } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [commentForm, setCommentForm] = useState({ body: '' })
  const [replyTo, setReplyTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [activeTab, setActiveTab] = useState('reviews')

  useEffect(() => {
    loadProduct()
  }, [slug])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/products/${slug}`)
      setProduct(data)
      document.title = `${data.name} - BikriZone`
    } catch {
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!product) return <div className="container py-5 text-center">Product not found</div>

  const effectivePrice = selectedVariant?.price ?? product.sale_price ?? product.price
  const wishlisted = isWishlisted(product.id)

  // Build a unified image list:
  // - Start with thumbnail (if present) as a synthetic entry so it is always shown
  // - Then append any gallery images, skipping duplicates
  const thumbEntry = product.thumbnail ? { id: 'thumb', image: product.thumbnail } : null
  const galleryImages = product.images || []
  const allImages = thumbEntry
    ? [thumbEntry, ...galleryImages.filter((g) => g.image !== product.thumbnail)]
    : galleryImages

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      await addToCart(product.id, selectedVariant?.id || null, quantity, product)
      toast.success(`${product.name} added to cart!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (product.stock === 0) return
    setAddingToCart(true)
    try {
      await addToCart(product.id, selectedVariant?.id || null, quantity, product)
      navigate(isAuthenticated() ? '/checkout' : '/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      await api.post('/reviews', { product_id: product.id, ...reviewForm })
      toast.success('Review submitted! It will appear after approval.')
      setReviewForm({ rating: 5, title: '', body: '' })
      await loadProduct()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const buildWhatsAppUrl = () => {
    const msg = `আমি এই পণ্যটি অর্ডার করতে চাই:\n\n🛍️ ${product.name}\n💰 মূল্য: ৳${effectivePrice}\n🔗 ${window.location.href}`
    return `https://wa.me/${PHONE_INTL.replace('+', '')}?text=${encodeURIComponent(msg)}`
  }

  const handleWishlist = async () => {
    if (!isAuthenticated()) { toast.info('Please login'); return }
    const res = await toggle(product.id)
    toast.success(res.message)
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) { toast.info('Please login to comment'); return }
    try {
      await api.post('/comments', { product_id: product.id, ...commentForm })
      toast.success('Question submitted! It will appear after review.')
      setCommentForm({ body: '' })
    } catch {}
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) { toast.info('Please login to reply'); return }
    if (!replyBody.trim()) return
    setSubmittingReply(true)
    try {
      await api.post('/comments', { product_id: product.id, parent_id: replyTo.id, body: replyBody })
      toast.success('Answer submitted! It will appear after review.')
      setReplyTo(null)
      setReplyBody('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setSubmittingReply(false)
    }
  }

  return (
    <>
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
          <li className="breadcrumb-item"><Link to={`/products/category/${product.category?.slug}`}>{product.category?.name}</Link></li>
          <li className="breadcrumb-item active text-truncate" style={{ maxWidth: 200 }}>{product.name}</li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Images */}
        <div className="col-md-5">
          <div
            className="product-detail-img-box d-flex align-items-center justify-content-center bg-white border rounded-3 overflow-hidden"
            style={{ height: 'clamp(240px, 50vw, 420px)' }}
          >
            {allImages[activeImg]?.image ? (
              <img
                src={`${storageUrl}/${allImages[activeImg].image}`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                alt={product.name}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="text-muted text-center">
                <i className="bi bi-image fs-1 opacity-25 d-block" />
                <small>No image</small>
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="d-flex gap-2 mt-2 overflow-auto pb-1">
              {allImages.map((img, i) => (
                <img
                  key={img.id ?? i}
                  src={`${storageUrl}/${img.image}`}
                  style={{
                    width: 70, height: 70, objectFit: 'cover', flexShrink: 0,
                    borderRadius: 8, cursor: 'pointer',
                    border: i === activeImg ? '2px solid #48A111' : '2px solid #e0e0e0',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => setActiveImg(i)}
                  alt=""
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="col-md-7">
          <div className="small text-muted mb-1">{product.category?.name}</div>
          <h2 className="fw-bold mb-2">{product.name}</h2>

          <div className="d-flex align-items-center gap-2 mb-3">
            <StarRating rating={Math.round(product.average_rating || 0)} readonly size="md" />
            <span className="small text-muted">({product.reviews_count} reviews)</span>
            {product.sku && <span className="small text-muted ms-2">SKU: {product.sku}</span>}
          </div>

          <div className="mb-3">
            <span className="fs-3 fw-bold" style={{ color: '#48A111' }}>৳{effectivePrice}</span>
            {product.sale_price && <span className="text-muted text-decoration-line-through ms-2 fs-5">৳{product.price}</span>}
            {product.sale_price && (
              <span className="badge ms-2" style={{ background: '#48A111' }}>
                {Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
              </span>
            )}
          </div>

          {product.short_description && <p className="text-muted mb-3">{product.short_description}</p>}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mb-3">
              <div className="fw-semibold mb-2">Select Variant:</div>
              <div className="d-flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button key={v.id}
                    className={`btn btn-sm ${selectedVariant?.id === v.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setSelectedVariant(v)} disabled={v.stock === 0}>
                    {v.size && `Size: ${v.size}`} {v.color && `Color: ${v.color}`}
                    {v.stock === 0 && ' (Out of Stock)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="fw-semibold">Quantity:</div>
            <div className="input-group" style={{ width: 120 }}>
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <input type="number" className="form-control text-center" value={quantity} min={1}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <span className={`small ${product.stock <= 5 ? 'text-warning' : 'text-success'}`}>
              {product.stock === 0 ? '❌ Out of Stock' : product.stock <= 5 ? `⚠️ Only ${product.stock} left` : `✅ In Stock`}
            </span>
          </div>

          {/* Action Buttons — 2 rows on all devices */}
          <div className="mb-4">
            <div className="row g-2 mb-2">
              <div className="col-6">
                <button
                  className="btn btn-warning fw-bold w-100"
                  onClick={handleBuyNow}
                  disabled={addingToCart || product.stock === 0}
                >
                  {addingToCart ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-lightning-fill me-1" />}
                  Buy Now
                </button>
              </div>
              <div className="col-6">
                <button
                  className="btn btn-primary fw-bold w-100"
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock === 0}
                >
                  {addingToCart ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-cart-plus me-1" />}
                  Add to Cart
                </button>
              </div>
            </div>
            <div className="row g-2">
              <div className="col-4">
                <button
                  className={`btn w-100 ${wishlisted ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={handleWishlist}
                >
                  <i className={`bi bi-heart${wishlisted ? '-fill' : ''} me-1`} />
                  <span className="d-none d-sm-inline d-md-none d-lg-inline">{wishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                </button>
              </div>
              <div className="col-4">
                <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer" className="btn btn-success w-100">
                  <i className="bi bi-whatsapp me-1" />
                  <span className="d-none d-sm-inline d-md-none d-lg-inline">WhatsApp</span>
                </a>
              </div>
              <div className="col-4">
                <a href={`tel:${PHONE}`} className="btn btn-outline-success w-100">
                  <i className="bi bi-telephone-fill me-1" />
                  <span className="d-none d-sm-inline d-md-none d-lg-inline">{PHONE.slice(0, 5)}-{PHONE.slice(5)}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Attributes */}
          {product.attributes?.length > 0 && (
            <div className="card border-0 bg-light p-3 mb-3">
              <h6 className="fw-bold mb-2">Specifications</h6>
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  {product.attributes.map((attr) => (
                    <tr key={attr.id}>
                      <td className="text-muted small fw-medium" style={{ width: '40%' }}>{attr.attribute_name}</td>
                      <td className="small">{attr.attribute_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Description + Reviews Tabs */}
      <div className="mt-5">
        <ul className="nav nav-tabs">
          {[['description', 'Description'], ['reviews', `Reviews (${product.reviews?.length || 0})`], ['qa', 'Q&A']].map(([tab, label]) => (
            <li key={tab} className="nav-item">
              <button className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{label}</button>
            </li>
          ))}
        </ul>

        <div className="border border-top-0 rounded-bottom p-4">
          {activeTab === 'description' && (
            <div className="prose" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }} />
          )}

          {activeTab === 'reviews' && (
            <div>
              {product.reviews?.map((review) => (
                <div key={review.id} className="border-bottom pb-3 mb-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <strong className="small">{review.user?.name}</strong>
                    {review.is_verified_buyer && <span className="badge bg-success small">Verified Buyer</span>}
                    <span className="text-muted small ms-auto">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.title && <h6 className="mb-1">{review.title}</h6>}
                  <p className="small text-muted mb-1">{review.body}</p>
                  {review.media?.map((m, i) => (
                    m.type === 'image'
                      ? <img key={i} src={`${storageUrl}/${m.file_path}`} className="rounded me-2" width={80} height={80} style={{ objectFit: 'cover' }} alt="" />
                      : <video key={i} src={`${storageUrl}/${m.file_path}`} width={120} controls className="rounded me-2" />
                  ))}
                </div>
              ))}

              {product.reviews?.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-star fs-2 d-block mb-2 opacity-25" />
                  No reviews yet
                </div>
              )}

              {/* Write a Review */}
              {isAuthenticated() ? (
                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold mb-3">Write a Review</h6>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Rating</label>
                      <div><StarRating rating={reviewForm.rating} onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} size="lg" /></div>
                    </div>
                    <div className="mb-2">
                      <input className="form-control form-control-sm" placeholder="Review title (optional)"
                        value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
                    </div>
                    <div className="mb-3">
                      <textarea className="form-control form-control-sm" rows={3} placeholder="Share your experience..." required
                        value={reviewForm.body} onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })} />
                    </div>
                    <button className="btn btn-primary btn-sm" type="submit" disabled={submittingReview}>
                      {submittingReview ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-send me-1" />}
                      Submit Review
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-4 text-center py-3 border rounded-3 bg-light">
                  <i className="bi bi-star text-muted d-block mb-1" />
                  <Link to="/login" className="text-primary fw-medium small">Login</Link>
                  <span className="text-muted small"> to write a review</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qa' && (
            <div>
              {product.comments?.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-chat-dots fs-2 d-block mb-2 opacity-25" />
                  No questions yet. Be the first to ask!
                </div>
              )}

              {product.comments?.map((comment) => (
                <div key={comment.id} className="mb-4">
                  {/* Question */}
                  <div className="d-flex gap-3">
                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white flex-shrink-0"
                      style={{ width: 36, height: 36, fontSize: 14 }}>
                      <i className="bi bi-question-lg" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong className="small">{comment.user?.name}</strong>
                        <span className="text-muted small">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="mb-2" style={{ fontSize: 14 }}>{comment.body}</p>

                      {/* Replies */}
                      {comment.replies?.map((reply) => (
                        <div key={reply.id} className="d-flex gap-2 mt-2 ms-2">
                          <div className="rounded-circle bg-success d-flex align-items-center justify-content-center text-white flex-shrink-0"
                            style={{ width: 28, height: 28, fontSize: 12 }}>
                            <i className="bi bi-reply-fill" />
                          </div>
                          <div className="flex-grow-1 bg-light rounded-3 px-3 py-2">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <strong style={{ fontSize: 12 }}>{reply.user?.name}</strong>
                              <span className="text-muted" style={{ fontSize: 11 }}>{new Date(reply.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="mb-0" style={{ fontSize: 13 }}>{reply.body}</p>
                          </div>
                        </div>
                      ))}

                      {/* Inline reply form */}
                      {isAuthenticated() && replyTo?.id === comment.id ? (
                        <form onSubmit={handleReplySubmit} className="mt-2 ms-2">
                          <div className="input-group input-group-sm">
                            <input
                              className="form-control"
                              placeholder={`Reply to ${comment.user?.name}…`}
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              autoFocus
                              required
                            />
                            <button className="btn btn-success" type="submit" disabled={submittingReply}>
                              {submittingReply ? <span className="spinner-border spinner-border-sm" /> : 'Send'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => { setReplyTo(null); setReplyBody('') }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        isAuthenticated() && (
                          <button
                            className="btn btn-link btn-sm text-success p-0 mt-1"
                            style={{ fontSize: 12, textDecoration: 'none' }}
                            onClick={() => { setReplyTo(comment); setReplyBody('') }}
                          >
                            <i className="bi bi-reply me-1" />Answer this question
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <hr className="mt-3 mb-0" />
                </div>
              ))}

              {/* Ask a new question */}
              {isAuthenticated() ? (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Ask a Question</h6>
                  <form onSubmit={handleCommentSubmit}>
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-question-circle text-primary" />
                      </span>
                      <input
                        className="form-control"
                        placeholder="Ask anything about this product…"
                        value={commentForm.body}
                        onChange={(e) => setCommentForm({ body: e.target.value })}
                        required
                      />
                      <button className="btn btn-primary px-4" type="submit">Ask</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mt-4 text-center py-3 border rounded-3 bg-light">
                  <i className="bi bi-lock text-muted d-block mb-1" />
                  <Link to="/login" className="text-primary fw-medium small">Login</Link>
                  <span className="text-muted small"> to ask a question or answer others</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

</>
  )
}
