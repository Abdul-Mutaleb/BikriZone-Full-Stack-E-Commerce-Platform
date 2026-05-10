import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function AdminReviews() {
  const [tab, setTab] = useState('reviews')
  const [reviews, setReviews] = useState([])
  const [comments, setComments] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Reviews - BikriZone Admin'
    loadData()
  }, [tab, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'reviews') {
        const { data } = await api.get('/admin/reviews', { params: { status: statusFilter } })
        setReviews(data.data || data)
      } else {
        const { data } = await api.get('/admin/comments', { params: { status: statusFilter } })
        setComments(data.data || data)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateReviewStatus = async (id, status) => {
    await api.put(`/admin/reviews/${id}/status`, { status })
    toast.success(`Review ${status}`)
    loadData()
  }

  const updateCommentStatus = async (id, status) => {
    await api.put(`/admin/comments/${id}/status`, { status })
    toast.success(`Comment ${status}`)
    loadData()
  }

  return (
    <div>
      <h3 className="fw-bold mb-4">Reviews & Comments</h3>

      <div className="d-flex gap-3 align-items-center mb-4">
        <ul className="nav nav-tabs border-0">
          <li className="nav-item">
            <button className={`nav-link ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
              <i className="bi bi-star me-1" />Reviews
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>
              <i className="bi bi-chat me-1" />Comments / Q&A
            </button>
          </li>
        </ul>
        <select className="form-select form-select-sm ms-auto" style={{ width: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" style={{ color: '#48A111' }} /></div> : (

        tab === 'reviews' ? (
          reviews.length === 0 ? <div className="text-center text-muted py-4">No {statusFilter} reviews</div> :
          reviews.map((review) => (
            <div key={review.id} className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold">{review.user?.name}</span>
                      {review.is_verified_buyer && <span className="badge bg-success small">Verified</span>}
                      <span className="text-warning">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <small className="text-muted">on <strong>{review.product?.name}</strong> · {new Date(review.created_at).toLocaleDateString()}</small>
                    {review.title && <div className="fw-medium mt-1">{review.title}</div>}
                    <p className="text-muted small mt-1 mb-2">{review.body}</p>
                    {review.media?.map((m, i) => (
                      m.type === 'image'
                        ? <img key={i} src={`${storageUrl}/${m.file_path}`} width={60} height={60} className="rounded me-1" style={{ objectFit: 'cover' }} alt="" />
                        : null
                    ))}
                  </div>
                  <div className="d-flex gap-1 flex-shrink-0 ms-3">
                    <button className="btn btn-sm btn-success" onClick={() => updateReviewStatus(review.id, 'approved')} disabled={review.status === 'approved'}>
                      <i className="bi bi-check" />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => updateReviewStatus(review.id, 'rejected')} disabled={review.status === 'rejected'}>
                      <i className="bi bi-x" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          comments.length === 0 ? <div className="text-center text-muted py-4">No {statusFilter} comments</div> :
          comments.map((comment) => (
            <div key={comment.id} className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="fw-bold">{comment.user?.name}</span>
                    <small className="text-muted ms-2">on <strong>{comment.product?.name}</strong> · {new Date(comment.created_at).toLocaleDateString()}</small>
                    <p className="text-muted small mt-1 mb-0">{comment.body}</p>
                  </div>
                  <div className="d-flex gap-1 flex-shrink-0 ms-3">
                    <button className="btn btn-sm btn-success" onClick={() => updateCommentStatus(comment.id, 'approved')} disabled={comment.status === 'approved'}><i className="bi bi-check" /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => updateCommentStatus(comment.id, 'rejected')} disabled={comment.status === 'rejected'}><i className="bi bi-x" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )
      )}
    </div>
  )
}
