import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function AboutUs() {
  useEffect(() => { document.title = 'About Us - BikriZone' }, [])

  return (
    <div className="container py-5">

      {/* Hero */}
      <div className="text-center mb-5">
        <h1 className="fw-bold" style={{ color: '#25671E' }}>About <span style={{ color: '#48A111' }}>BikriZone</span></h1>
        <p className="text-muted mx-auto" style={{ maxWidth: 600, fontSize: 15 }}>
          Your trusted one-stop online marketplace in Bangladesh — delivering quality products right to your doorstep.
        </p>
      </div>

      {/* Story */}
      <div className="row g-4 align-items-center mb-5">
        <div className="col-md-6">
          <h3 className="fw-bold mb-3" style={{ color: '#25671E' }}>Our Story</h3>
          <p className="text-muted" style={{ lineHeight: 1.8 }}>
            BikriZone was founded with a simple mission: make quality products accessible to everyone across Bangladesh.
            We believe shopping should be easy, affordable, and trustworthy — whether you're in Dhaka or the most remote district.
          </p>
          <p className="text-muted" style={{ lineHeight: 1.8 }}>
            From groceries to electronics, fashion to home essentials — we bring thousands of products from verified sellers
            directly to your home with fast delivery and secure payment options including bKash and Cash on Delivery.
          </p>
        </div>
        <div className="col-md-6">
          <div className="row g-3">
            {[
              { icon: 'box-seam', label: 'Products', value: '10,000+' },
              { icon: 'people', label: 'Happy Customers', value: '50,000+' },
              { icon: 'truck', label: 'Daily Deliveries', value: '500+' },
              { icon: 'shop', label: 'Verified Sellers', value: '200+' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="col-6">
                <div className="rounded-3 p-3 text-center" style={{ background: '#f0f8eb' }}>
                  <i className={`bi bi-${icon} fs-3`} style={{ color: '#48A111' }} />
                  <div className="fw-bold fs-5 mt-1" style={{ color: '#25671E' }}>{value}</div>
                  <div className="text-muted small">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-5">
        <h3 className="fw-bold text-center mb-4" style={{ color: '#25671E' }}>Why Choose BikriZone?</h3>
        <div className="row g-3">
          {[
            { icon: 'shield-check', title: 'Trusted Quality', desc: 'Every product is verified before listing. We stand behind what we sell.' },
            { icon: 'lightning-charge', title: 'Fast Delivery', desc: 'Same-day delivery in Dhaka, 2–3 days nationwide across Bangladesh.' },
            { icon: 'credit-card', title: 'Secure Payments', desc: 'bKash, Nagad, card, and Cash on Delivery — all transactions encrypted.' },
            { icon: 'headset', title: '24/7 Support', desc: 'Our customer care team is always ready to help you via chat, call, or WhatsApp.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="col-md-3 col-6">
              <div className="card border-0 h-100 text-center p-3" style={{ background: '#f8fdf5' }}>
                <i className={`bi bi-${icon} fs-2 mb-2`} style={{ color: '#48A111' }} />
                <h6 className="fw-bold" style={{ color: '#25671E' }}>{title}</h6>
                <p className="text-muted small mb-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="text-center py-4 rounded-3" style={{ background: 'linear-gradient(135deg, #48A111 0%, #25671E 100%)' }}>
        <h4 className="fw-bold text-white mb-2">Have questions?</h4>
        <p className="text-white opacity-75 mb-3 small">We'd love to hear from you.</p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <a href="tel:+8801805232206" className="btn btn-light fw-semibold px-4">
            <i className="bi bi-telephone me-2" />Call Us
          </a>
          <Link to="/faqs" className="btn btn-outline-light fw-semibold px-4">
            <i className="bi bi-question-circle me-2" />FAQs
          </Link>
        </div>
      </div>

    </div>
  )
}
