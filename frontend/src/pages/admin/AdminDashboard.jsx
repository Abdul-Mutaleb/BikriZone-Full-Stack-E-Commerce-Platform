import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import useAuthStore from '../../store/useAuthStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const allStatCards = [
  { key: 'total_revenue',      label: 'Total Revenue',    icon: 'currency-exchange',   prefix: '৳', color: '#48A111', adminOnly: true },
  { key: 'today_revenue',      label: "Today's Revenue",  icon: 'graph-up-arrow',      prefix: '৳', color: '#27ae60', adminOnly: true },
  { key: 'total_orders',       label: 'Total Orders',     icon: 'bag-check',           prefix: '',  color: '#3498db', adminOnly: false },
  { key: 'pending_orders',     label: 'Pending Orders',   icon: 'hourglass-split',     prefix: '',  color: '#f39c12', adminOnly: false },
  { key: 'total_customers',    label: 'Total Customers',  icon: 'people',              prefix: '',  color: '#9b59b6', adminOnly: false },
  { key: 'total_products',     label: 'Total Products',   icon: 'box',                 prefix: '',  color: '#1abc9c', adminOnly: true },
  { key: 'low_stock_products', label: 'Low Stock',        icon: 'exclamation-triangle',prefix: '',  color: '#e74c3c', adminOnly: true },
  { key: 'new_customers_today',label: 'New Today',        icon: 'person-plus',         prefix: '',  color: '#2980b9', adminOnly: false },
]

const statusColors = { pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger' }

export default function AdminDashboard() {
  const { canAccess } = useAuthStore()
  const navigate = useNavigate()
  const canSeeAdminStats = canAccess('products')

  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [reportType, setReportType] = useState('daily')
  const [exporting,  setExporting]  = useState(false)

  // Chat / message state
  const [chatRooms,  setChatRooms]  = useState([])

  const statCards = allStatCards.filter((c) => !c.adminOnly || canSeeAdminStats)

  useEffect(() => {
    document.title = 'Dashboard - BikriZone Admin'
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load dashboard data. Please refresh.'))
      .finally(() => setLoading(false))

    // Load chat inbox for message notifications
    loadChatInbox()
  }, [])

  // Poll chat inbox every 15 seconds
  useEffect(() => {
    const id = setInterval(loadChatInbox, 15000)
    return () => clearInterval(id)
  }, [])

  const loadChatInbox = async () => {
    try {
      const { data } = await api.get('/admin/chat/inbox')
      setChatRooms(data.data ?? data)
    } catch {}
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data: blob } = await api.get('/admin/reports/export', {
        params: { type: reportType },
        responseType: 'blob',
      })
      const url  = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `report_${reportType}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      // toast handled by interceptor
    } finally {
      setExporting(false)
    }
  }

  const unreadRooms   = chatRooms.filter((r) => r.unread_count > 0)
  const totalUnread   = unreadRooms.reduce((sum, r) => sum + (r.unread_count || 0), 0)
  const recentRooms   = chatRooms.slice(0, 5)

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div className="alert alert-danger d-flex align-items-center gap-2">
      <i className="bi bi-exclamation-triangle-fill" />{error}
    </div>
  )

  return (
    <div>
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-0">Dashboard</h3>
          <small className="text-muted">Welcome back! Here's your store overview.</small>
        </div>
        {canSeeAdminStats && (
          <div className="d-flex gap-2">
            <select className="form-select form-select-sm" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleExport} disabled={exporting}>
              {exporting ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-download me-1" />}
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {statCards.map(({ key, label, icon, prefix, color }) => (
          <div key={key} className="col-6 col-md-4 col-xl-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 52, height: 52, background: `${color}20` }}>
                  <i className={`bi bi-${icon} fs-4`} style={{ color }} />
                </div>
                <div className="min-width-0">
                  <div className="fw-bold fs-5" style={{ color }}>
                    {prefix}{Number(data?.stats?.[key] ?? 0).toLocaleString()}
                  </div>
                  <div className="text-muted small">{label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Messages stat card */}
        <div className="col-6 col-md-4 col-xl-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ cursor: 'pointer', borderLeft: totalUnread > 0 ? '3px solid #dc3545' : undefined }}
            onClick={() => navigate('/admin/chat')}
          >
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center position-relative" style={{ width: 52, height: 52, background: '#dc354520' }}>
                <i className="bi bi-chat-dots-fill fs-4" style={{ color: '#dc3545' }} />
                {totalUnread > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: 10 }}
                  >
                    {totalUnread}
                  </span>
                )}
              </div>
              <div>
                <div className="fw-bold fs-5" style={{ color: '#dc3545' }}>
                  {totalUnread}
                </div>
                <div className="text-muted small">Unread Messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Revenue Chart — full width ── */}
        {canSeeAdminStats && (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-3">
                  <div>
                    <h6 className="fw-bold mb-0">Revenue Overview</h6>
                    <small className="text-muted">Last 30 days performance</small>
                  </div>
                  {data?.sales_chart?.length > 0 && (() => {
                    const tot  = data.sales_chart.reduce((s, d) => s + (parseFloat(d.revenue) || 0), 0)
                    const ord  = data.sales_chart.reduce((s, d) => s + (parseInt(d.orders)  || 0), 0)
                    const best = Math.max(...data.sales_chart.map(d => parseFloat(d.revenue) || 0))
                    return (
                      <div className="d-flex gap-4 flex-wrap">
                        <div className="text-center">
                          <div className="fw-bold" style={{ color: '#48A111', fontSize: 18 }}>৳{tot.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>Total Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="fw-bold text-primary" style={{ fontSize: 18 }}>{ord.toLocaleString()}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>Total Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="fw-bold" style={{ color: '#f39c12', fontSize: 18 }}>৳{best.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>Best Day</div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                {data?.sales_chart?.length > 0 ? (
                  <RevenueChart chartData={data.sales_chart} />
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-bar-chart-line fs-1 d-block mb-2 opacity-25" />
                    <p className="mb-0 small">No sales data available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Live Messages Widget ── */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots-fill text-danger" />
                <h6 className="fw-bold mb-0">Live Messages</h6>
                {totalUnread > 0 && (
                  <span className="badge bg-danger rounded-pill">{totalUnread} new</span>
                )}
              </div>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => navigate('/admin/chat')}
              >
                Open Inbox <i className="bi bi-arrow-right ms-1" />
              </button>
            </div>
            <div className="card-body p-0">
              {recentRooms.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-chat-dots d-block fs-2 opacity-25 mb-2" />
                  <small>No conversations yet</small>
                </div>
              ) : (
                recentRooms.map((room) => (
                  <div
                    key={room.id}
                    className="d-flex align-items-center gap-3 px-3 py-2 border-bottom"
                    style={{
                      cursor: 'pointer',
                      background: room.unread_count > 0 ? '#fff8f8' : '#fff',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => navigate('/admin/chat')}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8faf8')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = room.unread_count > 0 ? '#fff8f8' : '#fff')}
                  >
                    {/* Avatar */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 40, height: 40, background: '#48A111', fontSize: 15 }}
                    >
                      {room.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    {/* Message info */}
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold small">{room.user?.name}</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>
                          {room.latest_message?.created_at
                            ? new Date(room.latest_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted text-truncate small" style={{ maxWidth: 200 }}>
                          {room.latest_message?.message ?? 'No messages yet'}
                        </span>
                        {room.unread_count > 0 && (
                          <span className="badge bg-danger rounded-pill ms-2" style={{ fontSize: 10 }}>
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {chatRooms.length > 5 && (
                <div className="text-center py-2 border-top">
                  <button className="btn btn-link btn-sm text-primary" onClick={() => navigate('/admin/chat')}>
                    View all {chatRooms.length} conversations
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Orders ── */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
              <h6 className="fw-bold mb-0">Recent Orders</h6>
              <a href="/admin/orders" className="btn btn-outline-primary btn-sm">View All</a>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Order #</th><th>Customer</th><th>Total</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recent_orders?.length ?? 0) === 0 ? (
                      <tr><td colSpan={4} className="text-center text-muted py-3">No recent orders</td></tr>
                    ) : data.recent_orders.map((order) => (
                      <tr key={order.id}>
                        <td className="ps-3"><span className="fw-medium small">{order.order_number}</span></td>
                        <td className="small">{order.user?.name}</td>
                        <td className="fw-bold small" style={{ color: '#48A111' }}>৳{order.total}</td>
                        <td><span className={`badge bg-${statusColors[order.status] || 'secondary'} text-capitalize`}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RevenueChart({ chartData }) {
  const [hovered, setHovered] = useState(null)
  const VW = 900, VH = 260
  const PL = 66, PR = 18, PT = 22, PB = 42
  const iW = VW - PL - PR, iH = VH - PT - PB

  // Only plot days that have actual revenue
  const active = chartData.filter(d => parseFloat(d.revenue) > 0)
  const data = active.length > 0 ? active : chartData

  const revenues = data.map(d => parseFloat(d.revenue) || 0)
  const maxRev = Math.max(...revenues, 1)
  const mag = Math.pow(10, Math.floor(Math.log10(maxRev)))
  const niceMax = Math.ceil(maxRev / mag) * mag

  const xOf = i => PL + (revenues.length < 2 ? iW / 2 : (i / (revenues.length - 1)) * iW)
  const yOf = v => PT + iH * (1 - v / niceMax)
  const fmt = v => v >= 100000 ? `৳${(v / 100000).toFixed(1)}L` : v >= 1000 ? `৳${(v / 1000).toFixed(1)}k` : `৳${v.toFixed(0)}`

  // Smooth cubic bezier (catmull-rom → bezier)
  const pts = revenues.map((v, i) => [xOf(i), yOf(v)])
  const linePath = pts.length < 2 ? '' : pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`
    const p0 = pts[Math.max(0, i - 2)]
    const p1 = pts[i - 1]
    const p2 = p
    const p3 = pts[Math.min(pts.length - 1, i + 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
  }, '')

  const areaPath = linePath + ` L ${xOf(revenues.length - 1)} ${PT + iH} L ${xOf(0)} ${PT + iH} Z`

  const Y_STEPS = 5
  const maxIdx = revenues.indexOf(Math.max(...revenues))
  const slotW = revenues.length > 1 ? iW / (revenues.length - 1) : iW

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}
      onMouseLeave={() => setHovered(null)}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#48A111" stopOpacity="0.28" />
          <stop offset="65%"  stopColor="#48A111" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#48A111" stopOpacity="0" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Y gridlines + labels */}
      {Array.from({ length: Y_STEPS + 1 }, (_, i) => {
        const v = niceMax * i / Y_STEPS
        const y = yOf(v)
        return (
          <g key={i}>
            <line x1={PL} x2={VW - PR} y1={y} y2={y}
              stroke={i === 0 ? '#e0e0e0' : '#f2f2f2'} strokeWidth={1} />
            <text x={PL - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#c8c8c8">{fmt(v)}</text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaFill)" />

      {/* Smooth line */}
      <path d={linePath} fill="none" stroke="#48A111" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Vertical crosshair on hover */}
      {hovered !== null && (
        <line x1={xOf(hovered)} x2={xOf(hovered)} y1={PT} y2={PT + iH}
          stroke="#48A111" strokeWidth={1} strokeDasharray="5 4" strokeOpacity={0.35} />
      )}

      {/* Invisible hover bands */}
      {revenues.map((_, i) => {
        const bw = slotW
        return (
          <rect key={i}
            x={xOf(i) - bw / 2} y={PT} width={bw} height={iH}
            fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHovered(i)} />
        )
      })}

      {/* Peak marker (always visible) */}
      <circle cx={xOf(maxIdx)} cy={yOf(revenues[maxIdx])} r={5}
        fill="#48A111" stroke="white" strokeWidth={2} filter="url(#glow)" />

      {/* Hovered dot */}
      {hovered !== null && hovered !== maxIdx && (
        <circle cx={xOf(hovered)} cy={yOf(revenues[hovered])} r={5}
          fill="#48A111" stroke="white" strokeWidth={2} filter="url(#glow)" />
      )}

      {/* X-axis line */}
      <line x1={PL} x2={VW - PR} y1={PT + iH} y2={PT + iH} stroke="#e0e0e0" strokeWidth={1} />

      {/* X labels */}
      {data.map((day, i) => {
        const n = data.length
        if (n > 15 && i !== 0 && i !== n - 1 && (i + 1) % 5 !== 0) return null
        const d = new Date(day.date)
        return (
          <text key={i} x={xOf(i)} y={VH - 6} textAnchor="middle" fontSize={9.5} fill="#aaa">
            {`${d.getDate()}/${d.getMonth() + 1}`}
          </text>
        )
      })}

      {/* Tooltip */}
      {hovered !== null && (() => {
        const v = revenues[hovered]
        const cx = xOf(hovered), cy = yOf(v)
        const tw = 108, th = 46
        const tx = Math.min(Math.max(cx - tw / 2, PL + 2), VW - PR - tw - 2)
        const ty = Math.max(cy - th - 14, PT + 2)
        const ax = Math.min(Math.max(cx, tx + 12), tx + tw - 12)
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={tw} height={th} rx={7} fill="#1a2035" />
            <polygon points={`${ax - 6},${ty + th} ${ax + 6},${ty + th} ${ax},${ty + th + 7}`} fill="#1a2035" />
            <text x={tx + tw / 2} y={ty + 16} textAnchor="middle" fontSize={9.5} fill="#8892a4">
              {data[hovered].date}
            </text>
            <text x={tx + tw / 2} y={ty + 36} textAnchor="middle" fontSize={14} fill="#4ade80" fontWeight="700">
              ৳{v.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
