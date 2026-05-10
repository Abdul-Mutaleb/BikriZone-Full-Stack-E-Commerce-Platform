import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import useAuthStore from '../../store/useAuthStore'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost/MKstore%20%E2%80%93%20Full-Stack%20E-Commerce%20Platform/backend/public/api'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

// 6-box OTP input
function OtpInput({ value, onChange }) {
  const inputs = useRef([])

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      inputs.current[i - 1].focus()
    }
  }

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/, '').slice(-1)
    const arr = value.split('')
    arr[i] = digit
    const next = arr.join('')
    onChange(next)
    if (digit && i < 5) inputs.current[i + 1].focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, ' ').slice(0, 6).trimEnd())
    const focusIdx = Math.min(pasted.length, 5)
    inputs.current[focusIdx]?.focus()
    e.preventDefault()
  }

  return (
    <div className="d-flex gap-2 justify-content-center my-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className="form-control text-center fw-bold fs-5"
          style={{ width: 44, height: 48, borderRadius: 10, padding: 0 }}
        />
      ))}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuthStore()

  const [step, setStep] = useState(1) // 1=form, 2=otp
  const [form, setForm] = useState({ name: '', identifier: '', password: '', password_confirmation: '' })
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // detect whether the identifier is an email or phone
  const isEmailInput = form.identifier.includes('@')
  const identifierType = !form.identifier ? null : isEmailInput ? 'email' : 'phone'

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleSocialLogin = (provider) => {
    window.location.href = `${apiBase}/auth/${provider}/redirect`
  }

  const f = (field) => ({ value: form[field], onChange: (e) => setForm({ ...form, [field]: e.target.value }) })

  const buildPayload = () => ({
    name: form.name,
    email: isEmailInput ? form.identifier : '',
    phone: isEmailInput ? '' : form.identifier,
    password: form.password,
    password_confirmation: form.password_confirmation,
  })

  // Step 1 submit: if phone → send OTP, if email → register directly
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setErrors({})
    if (!form.name || !form.identifier || !form.password || !form.password_confirmation) {
      toast.error('Please fill all required fields.')
      return
    }
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['Passwords do not match.'] })
      return
    }
    if (isEmailInput) {
      setLoading(true)
      try {
        await register(buildPayload())
        toast.success('Account created successfully!')
        navigate('/')
      } catch (err) {
        setErrors(err.response?.data?.errors || {})
        toast.error(err.response?.data?.message || 'Registration failed')
      } finally {
        setLoading(false)
      }
      return
    }
    // Phone → send OTP
    setLoading(true)
    try {
      const res = await axios.post(`${apiBase}/otp/send`, { phone: form.identifier })
      toast.success('OTP sent to your phone!')
      if (res.data.dev_otp) setDevOtp(res.data.dev_otp)
      setStep(2)
      setResendTimer(60)
    } catch (err) {
      setErrors(err.response?.data?.errors || {})
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: verify OTP then register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP.'); return }
    setLoading(true)
    setErrors({})
    try {
      await axios.post(`${apiBase}/otp/verify`, { phone: form.identifier, otp })
      await register({ ...buildPayload(), otp })
      toast.success('Account created successfully!')
      navigate('/')
    } catch (err) {
      setErrors(err.response?.data?.errors || {})
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setLoading(true)
    try {
      const res = await axios.post(`${apiBase}/otp/send`, { phone: form.identifier })
      toast.success('OTP resent!')
      if (res.data.dev_otp) setDevOtp(res.data.dev_otp)
      setOtp('')
      setResendTimer(60)
    } catch {
      toast.error('Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center px-3"
      style={{ background: '#f8f9fa', minHeight: 'calc(100vh - 130px)' }}>
      <div className="card shadow-sm border-0 overflow-hidden w-100" style={{ maxWidth: 820, borderRadius: 14 }}>
        <div className="row g-0">

          {/* Left branding */}
          <div className="col-md-4 d-none d-md-flex flex-column align-items-center justify-content-center text-white p-4"
            style={{ background: 'linear-gradient(160deg, #48A111 0%, #25671E 100%)' }}>
            <Link to="/" className="text-decoration-none text-white text-center" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              Bikri<span style={{ color: '#F2B50B' }}>Zone</span>
            </Link>
            <p className="mt-2 mb-0 text-center" style={{ fontSize: 13, opacity: 0.85 }}>Your one-stop shop for everything</p>
          </div>

          {/* Right panel */}
          <div className="col-md-8 p-4">

            {step === 1 && (
              <>
                <h6 className="fw-bold mb-1">Create Account</h6>
                <p className="text-muted mb-3" style={{ fontSize: 12 }}>Join BikriZone — it's free</p>

                <div className="d-flex gap-2 mb-3">
                  <button type="button" className="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
                    style={{ fontSize: 12, borderRadius: 8 }} onClick={() => handleSocialLogin('google')}>
                    <GoogleIcon /><span className="fw-medium">Google</span>
                  </button>
                  <button type="button" className="btn flex-fill d-flex align-items-center justify-content-center gap-2 py-2 text-white"
                    style={{ background: '#1877F2', border: 'none', fontSize: 12, borderRadius: 8 }} onClick={() => handleSocialLogin('facebook')}>
                    <FacebookIcon /><span className="fw-medium">Facebook</span>
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2 mb-3">
                  <hr className="flex-grow-1 m-0" />
                  <span className="text-muted px-1" style={{ fontSize: 11 }}>or fill in details</span>
                  <hr className="flex-grow-1 m-0" />
                </div>

                <form onSubmit={handleSendOtp}>
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label fw-medium mb-1" style={{ fontSize: 12 }}>Full Name</label>
                      <input type="text" className={`form-control form-control-sm ${errors.name ? 'is-invalid' : ''}`}
                        {...f('name')} placeholder="Enter your full name" style={{ borderRadius: 8 }} required />
                      {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium mb-1 d-flex align-items-center gap-2" style={{ fontSize: 12 }}>
                        Email or Phone Number
                        {identifierType === 'email' && (
                          <span className="badge bg-primary" style={{ fontSize: 10 }}>Email — direct register</span>
                        )}
                        {identifierType === 'phone' && (
                          <span className="badge bg-success" style={{ fontSize: 10 }}>Phone — OTP will be sent</span>
                        )}
                      </label>
                      <input
                        type={identifierType === 'email' ? 'email' : 'text'}
                        inputMode={identifierType === 'phone' ? 'tel' : 'email'}
                        className={`form-control form-control-sm ${(errors.email || errors.phone) ? 'is-invalid' : ''}`}
                        value={form.identifier}
                        onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                        placeholder="e.g. example@gmail.com or 01XXXXXXXXX"
                        style={{ borderRadius: 8 }}
                        required
                      />
                      {(errors.email || errors.phone) && (
                        <div className="invalid-feedback">{(errors.email || errors.phone)[0]}</div>
                      )}
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-medium mb-1" style={{ fontSize: 12 }}>Password</label>
                      <input type="password" className={`form-control form-control-sm ${errors.password ? 'is-invalid' : ''}`}
                        {...f('password')} placeholder="Min. 8 characters" style={{ borderRadius: 8 }} required />
                      {errors.password && <div className="invalid-feedback">{errors.password[0]}</div>}
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-medium mb-1" style={{ fontSize: 12 }}>Confirm Password</label>
                      <input type="password" className={`form-control form-control-sm ${errors.password_confirmation ? 'is-invalid' : ''}`}
                        {...f('password_confirmation')} placeholder="Repeat password" style={{ borderRadius: 8 }} required />
                      {errors.password_confirmation && <div className="invalid-feedback">{errors.password_confirmation[0]}</div>}
                    </div>
                  </div>

                  <button className="btn btn-primary w-100 py-2 fw-medium mt-3" type="submit" disabled={loading} style={{ borderRadius: 8, fontSize: 13 }}>
                    {loading && <span className="spinner-border spinner-border-sm me-2" />}
                    {loading
                      ? (identifierType === 'phone' ? 'Sending OTP…' : 'Creating Account…')
                      : (identifierType === 'phone' ? 'Send OTP & Continue' : 'Create Account')
                    }
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <button className="btn btn-link p-0 text-muted mb-3" style={{ fontSize: 12 }} onClick={() => setStep(1)}>
                  ← Back
                </button>
                <h6 className="fw-bold mb-1">Verify Your Phone</h6>
                <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                  Enter the 6-digit OTP sent to <strong>{form.identifier}</strong>
                </p>

                {devOtp && (
                  <div className="alert alert-warning py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>
                    <strong>Dev mode OTP:</strong> <code className="fs-6 fw-bold">{devOtp}</code>
                  </div>
                )}

                <form onSubmit={handleVerifyAndRegister}>
                  <OtpInput value={otp} onChange={setOtp} />

                  {errors.otp && <div className="text-danger text-center mb-2" style={{ fontSize: 12 }}>{errors.otp[0]}</div>}

                  <button className="btn btn-primary w-100 py-2 fw-medium" type="submit"
                    disabled={loading || otp.length < 6} style={{ borderRadius: 8, fontSize: 13 }}>
                    {loading && <span className="spinner-border spinner-border-sm me-2" />}
                    {loading ? 'Creating Account…' : 'Verify & Create Account'}
                  </button>
                </form>

                <div className="text-center mt-3" style={{ fontSize: 12 }}>
                  {resendTimer > 0
                    ? <span className="text-muted">Resend OTP in <strong>{resendTimer}s</strong></span>
                    : <button className="btn btn-link p-0 fw-medium" style={{ fontSize: 12 }} onClick={handleResend} disabled={loading}>
                        Resend OTP
                      </button>
                  }
                </div>
              </>
            )}

            <p className="text-center mt-3 mb-0" style={{ fontSize: 12 }}>
              Already have an account? <Link to="/login" className="text-primary fw-medium">Sign In</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
