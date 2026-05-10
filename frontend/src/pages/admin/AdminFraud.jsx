import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

export default function AdminFraud() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ severity: '', type: '', reviewed: '' })

  useEffect(() => {
    document.title = 'Fraud Detection - BikriZone Admin'
    loadStats()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [filters])

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/fraud/stats')
      setStats(data)
    } catch {}
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
      const { data } = await api.get('/admin/fraud', { params })
      setLogs(data.data)
      setPagination(data)
    } catch {
      toast.error('Failed to load fraud logs')
    } finally {
      setLoading(false)
    }
  }

  const markReviewed = async (id) => {
    try {
      await api.post(`/admin/fraud/${id}/reviewed`)
      setLogs((prev) => prev.map((l) => l.id === id ? { ...l, is_reviewed: true } : l))
      loadStats()
      toast.success('Marked as reviewed')
    } catch {
      toast.error('Failed')
    }
  }

  const severityBadge = (s) => {
    const map = { high: 'danger', medium: 'warning', low: 'secondary' }
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s.toUpperCase()}</span>
  }

  const typeLabel = (t) => {
    const map = {
      velocity:    { icon: '⚡', label: 'Velocity (rapid orders)' },
      high_value:  { icon: '💸', label: 'High Value Order' },
      phone_reuse: { icon: '📞', label: 'Phone Reuse' },
    }
    return map[t] ? `${map[t].icon} ${map[t].label}` : t
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Fraud Detection</h3>
        <p className="text-muted small mb-0">Automatic fraud signals detected on orders</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Total Flags', value: stats.total, icon: 'flag', color: 'primary' },
            { label: 'Unreviewed', value: stats.unreviewed, icon: 'eye-slash', color: 'warning' },
            { label: 'High Severity', value: stats.high, icon: 'exclamation-triangle', color: 'danger' },
            { label: 'Medium Severity', value: stats.medium, icon: 'exclamation-circle', color: 'info' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className={`rounded-3 p-2 bg-${color} bg-opacity-10`}>
                    <i className={`bi bi-${icon} fs-4 text-${color}`} />
                  </div>
                  <div>
                    <div className="fw-bold fs-5">{value}</div>
                    <div className="text-muted small">{label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={filters.severity}
                onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}>
                <option value="">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                <option value="">All Types</option>
                <option value="velocity">Velocity</option>
                <option value="high_value">High Value</option>
                <option value="phone_reuse">Phone Reuse</option>
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={filters.reviewed}
                onChange={(e) => setFilters((f) => ({ ...f, reviewed: e.target.value }))}>
                <option value="">All Status</option>
                <option value="false">Unreviewed</option>
                <option value="true">Reviewed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Severity</th>
                <th>Type</th>
                <th>User</th>
                <th>Order</th>
                <th>Reason</th>
                <th>IP</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="text-center py-5">
                  <span className="spinner-border spinner-border-sm me-2" />Loading...
                </td></tr>
              )}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted py-5">
                  <i className="bi bi-shield-check fs-2 d-block mb-2 opacity-25" />
                  No fraud signals detected
                </td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} style={{ background: log.is_reviewed ? '#fff' : '#fffbf0' }}>
                  <td>{severityBadge(log.severity)}</td>
                  <td><small>{typeLabel(log.type)}</small></td>
                  <td>
                    <div className="fw-medium small">{log.user?.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{log.user?.email}</div>
                  </td>
                  <td>
                    {log.order
                      ? <small className="font-monospace">#{log.order.order_number}</small>
                      : <span className="text-muted">—</span>
                    }
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <small className="text-muted">{log.reason}</small>
                  </td>
                  <td><small className="text-muted font-monospace">{log.ip_address || '—'}</small></td>
                  <td><small className="text-muted">{new Date(log.created_at).toLocaleString('en-BD')}</small></td>
                  <td>
                    {log.is_reviewed
                      ? <span className="badge bg-success">Reviewed</span>
                      : <span className="badge bg-warning text-dark">Pending</span>
                    }
                  </td>
                  <td>
                    {!log.is_reviewed && (
                      <button className="btn btn-sm btn-outline-success" onClick={() => markReviewed(log.id)}>
                        <i className="bi bi-check2 me-1" />Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="card-footer border-0 d-flex justify-content-center">
            <nav>
              <ul className="pagination pagination-sm mb-0">
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                    <button className="page-link"
                      onClick={() => setFilters((f) => ({ ...f, page }))}>
                      {page}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
