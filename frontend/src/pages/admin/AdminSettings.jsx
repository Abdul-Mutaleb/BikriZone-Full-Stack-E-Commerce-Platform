import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [form, setForm] = useState({
    site_name: '', site_tagline: '', currency_symbol: '৳',
    shipping_charge: '60', free_shipping_above: '2000', tax_rate: '0',
    bkash_sandbox_mode: 'true', bkash_app_key: '', bkash_app_secret: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Settings - BikriZone Admin'
    api.get('/admin/settings').then(({ data }) => {
      const flat = {}
      Object.values(data).forEach((group) => {
        group.forEach((s) => { flat[s.key] = s.value })
      })
      setForm(prev => ({ ...prev, ...flat }))
    }).catch(() => {})
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/admin/settings', { settings: form })
      toast.success('Settings saved!')
    } catch (err) {
      toast.error('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const f = (key) => ({
    value: form[key] || '',
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  })

  return (
    <div>
      <h3 className="fw-bold mb-4">System Settings</h3>
      <form onSubmit={handleSave}>
        <div className="row g-4">
          {/* General */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-bold">
                <i className="bi bi-gear me-2" style={{ color: '#48A111' }} />General Settings
              </div>
              <div className="card-body">
                <div className="mb-3"><label className="form-label">Site Name</label><input className="form-control" {...f('site_name')} /></div>
                <div className="mb-3"><label className="form-label">Tagline</label><input className="form-control" {...f('site_tagline')} /></div>
                <div className="mb-3"><label className="form-label">Currency Symbol</label><input className="form-control" {...f('currency_symbol')} /></div>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-bold">
                <i className="bi bi-truck me-2" style={{ color: '#48A111' }} />Shipping & Tax
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Shipping Charge (৳)</label>
                  <input type="number" className="form-control" {...f('shipping_charge')} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Free Shipping Above (৳)</label>
                  <input type="number" className="form-control" {...f('free_shipping_above')} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tax Rate (%)</label>
                  <input type="number" className="form-control" {...f('tax_rate')} />
                </div>
              </div>
            </div>
          </div>

          {/* bKash */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-bold">
                <i className="bi bi-phone me-2" style={{ color: '#48A111' }} />bKash Payment Gateway
              </div>
              <div className="card-body">
                <div className="alert alert-info small mb-3">
                  <i className="bi bi-info-circle me-1" />
                  <strong>Sandbox Mode:</strong> Test payments use OTP <code>123456</code>. Toggle to live mode for real transactions.
                </div>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Mode</label>
                    <select className="form-select" {...f('bkash_sandbox_mode')}>
                      <option value="true">Sandbox (Test)</option>
                      <option value="false">Live (Production)</option>
                    </select>
                  </div>
                  <div className="col-md-3"><label className="form-label">App Key</label><input className="form-control" type="password" {...f('bkash_app_key')} /></div>
                  <div className="col-md-3"><label className="form-label">App Secret</label><input className="form-control" type="password" {...f('bkash_app_secret')} /></div>
                  <div className="col-md-3 d-flex align-items-end">
                    <div className="w-100">
                      <div className={`alert py-2 small mb-0 ${form.bkash_sandbox_mode === 'true' ? 'alert-warning' : 'alert-success'}`}>
                        {form.bkash_sandbox_mode === 'true' ? '🔶 Sandbox Mode Active' : '✅ Live Mode Active'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button type="submit" className="btn btn-primary px-4" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-save me-2" />}
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  )
}
