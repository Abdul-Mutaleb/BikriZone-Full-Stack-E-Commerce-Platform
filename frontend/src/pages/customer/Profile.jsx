import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import useAuthStore from '../../store/useAuthStore'
import useLanguageStore from '../../store/useLanguageStore'

const storageUrl = import.meta.env.VITE_STORAGE_URL || ''

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const { t } = useLanguageStore()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [addresses, setAddresses] = useState([])
  const [addrForm, setAddrForm] = useState({ label: 'Home', name: '', phone: '', address_line1: '', city: '', postal_code: '' })
  const [loading, setLoading] = useState(false)
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `${storageUrl}/${user.avatar}` : null)
  const avatarRef = useRef()

  useEffect(() => {
    document.title = `${t('profile.title')} - BikriZone`
    api.get('/addresses').then(({ data }) => setAddresses(data)).catch(() => {})
  }, [])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('phone', form.phone)
      if (form.email) formData.append('email', form.email)
      if (avatarFile) formData.append('avatar', avatarFile)
      const { data } = await api.post('/auth/profile', formData)
      updateUser(data.user)
      setAvatarFile(null)
      if (data.user.avatar) setAvatarPreview(`${storageUrl}/${data.user.avatar}`)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/change-password', pwForm)
      toast.success('Password changed!')
      setPwForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/addresses', addrForm)
      setAddresses((prev) => [...prev, data.address])
      setShowAddrForm(false)
      setAddrForm({ label: 'Home', name: '', phone: '', address_line1: '', city: '', postal_code: '' })
      toast.success('Address saved!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address')
    }
  }

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/addresses/${id}`)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success('Address deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address')
    }
  }

  const tabs = [
    ['profile', 'person', t('profile.info')],
    ['security', 'shield-lock', t('profile.security')],
    ['addresses', 'geo-alt', t('profile.addresses')],
  ]

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">{t('profile.title')}</h2>
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center p-4">
              {/* Avatar */}
              <div className="position-relative d-inline-block mb-3">
                <div
                  className="rounded-circle overflow-hidden d-inline-flex align-items-center justify-content-center"
                  style={{ width: 80, height: 80, background: '#e8f5e9', border: '3px solid #48A111' }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="text-white fw-bold fs-2" style={{ color: '#48A111' }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary position-absolute rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{ width: 26, height: 26, bottom: 0, right: 0, fontSize: 12 }}
                  onClick={() => avatarRef.current?.click()}
                  title={t('profile.avatar')}
                >
                  <i className="bi bi-camera" />
                </button>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="fw-bold">{user?.name}</div>
              <div className="text-muted small">{user?.email}</div>
              <div className="badge mt-2" style={{ background: '#48A111' }}>{user?.role?.replace('_', ' ')}</div>
              {avatarFile && (
                <div className="mt-2">
                  <small className="text-muted d-block mb-1">New photo selected</small>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleProfileUpdate}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                    Save Photo
                  </button>
                </div>
              )}
            </div>
            <div className="list-group list-group-flush profile-nav-tabs">
              {tabs.map(([key, icon, label]) => (
                <button
                  key={key}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${tab === key ? 'active' : ''}`}
                  style={tab === key ? { background: '#48A111', color: 'white', borderColor: 'transparent' } : {}}
                  onClick={() => setTab(key)}
                >
                  <i className={`bi bi-${icon}`} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="col-md-9">
          {tab === 'profile' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">{t('profile.info')}</h5>
                <form onSubmit={handleProfileUpdate}>
                  {/* Avatar Upload (inline) */}
                  <div className="mb-4 p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle overflow-hidden flex-shrink-0"
                      style={{ width: 64, height: 64, border: '2px solid #48A111' }}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-white">
                          <i className="bi bi-person fs-2 text-muted" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="fw-medium small mb-1">{t('profile.avatar')}</div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => avatarRef.current?.click()}
                      >
                        <i className="bi bi-upload me-1" />
                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      <div className="text-muted mt-1" style={{ fontSize: 11 }}>JPG, PNG or GIF · Max 2MB</div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">{t('profile.name')}</label>
                      <input
                        className="form-control"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('profile.phone')}</label>
                      <input
                        className="form-control"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('profile.email')}</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('profile.role')}</label>
                      <input className="form-control" value={user?.role?.replace('_', ' ')} disabled />
                    </div>
                  </div>
                  <button className="btn btn-primary mt-4" type="submit" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-save me-2" />}
                    {t('profile.save')}
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Change Password</h5>
                <form onSubmit={handlePasswordChange}>
                  {[
                    ['current_password', 'Current Password'],
                    ['password', 'New Password'],
                    ['password_confirmation', 'Confirm New Password'],
                  ].map(([field, label]) => (
                    <div className="mb-3" key={field}>
                      <label className="form-label">{label}</label>
                      <input
                        type="password"
                        className="form-control"
                        value={pwForm[field]}
                        onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    <i className="bi bi-shield-check me-2" />Change Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'addresses' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Saved Addresses</h5>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddrForm(!showAddrForm)}
                  >
                    <i className="bi bi-plus me-1" />Add Address
                  </button>
                </div>

                {showAddrForm && (
                  <form onSubmit={handleAddAddress} className="card bg-light p-3 mb-4">
                    <div className="row g-2">
                      {[
                        { label: 'Label', field: 'label', col: 6, type: 'text' },
                        { label: 'Name', field: 'name', col: 6, type: 'text' },
                        { label: 'Phone', field: 'phone', col: 6, type: 'tel' },
                        { label: 'Address', field: 'address_line1', col: 12, type: 'text' },
                        { label: 'City', field: 'city', col: 6, type: 'text' },
                        { label: 'Postal Code', field: 'postal_code', col: 6, type: 'text' },
                      ].map(({ label, field, col, type }) => (
                        <div key={field} className={`col-${col}`}>
                          <input
                            type={type}
                            className="form-control form-control-sm"
                            placeholder={label}
                            value={addrForm[field]}
                            onChange={(e) => setAddrForm({ ...addrForm, [field]: e.target.value })}
                            required={field !== 'postal_code'}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-primary btn-sm" type="submit">Save</button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        type="button"
                        onClick={() => setShowAddrForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <p className="text-muted">No saved addresses yet.</p>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border rounded p-3 mb-3 d-flex justify-content-between align-items-start"
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-primary">{addr.label}</span>
                          {addr.is_default && <span className="badge bg-success">Default</span>}
                        </div>
                        <div className="fw-medium">{addr.name}</div>
                        <div className="text-muted small">{addr.phone}</div>
                        <div className="text-muted small">
                          {addr.address_line1}, {addr.city} {addr.postal_code}
                        </div>
                      </div>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
