import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="text-light pt-5 pb-3 mt-5" style={{ background: '#25671E' }}>
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{ background: '#fff', borderRadius: 8, padding: '3px 5px', display: 'flex', alignItems: 'center' }}>
                <img src="/logo 2.png" alt="BikriZone" style={{ height: 40, width: 40, objectFit: 'contain', display: 'block' }} />
              </div>
              <h5 className="fw-bold mb-0" style={{ color: '#F2B50B' }}>BikriZone</h5>
            </div>
            <p className="text-white small">Your one-stop online shop in Bangladesh. Quality products, fast delivery, and trusted service.</p>
            <div className="d-flex gap-3 mt-3">
              {[['facebook', 'https://www.facebook.com/share/1CewxXexRG/'], ['twitter', '#'], ['instagram', '#'], ['youtube', '#']].map(([s, url]) => (
                <a key={s} href={url} target={url !== '#' ? '_blank' : undefined} rel="noreferrer" className="text-white fs-5 text-decoration-none"><i className={`bi bi-${s}`} /></a>
              ))}
            </div>
          </div>
          <div className="col-6 col-md-2">
            <h6 className="fw-semibold mb-3">Shop</h6>
            <ul className="list-unstyled small">
              <li className="mb-1"><Link to="/products" className="text-white text-decoration-none">All Products</Link></li>
              <li className="mb-1"><Link to="/products?featured=1" className="text-white text-decoration-none">Featured</Link></li>
              <li className="mb-1"><Link to="/products?sort_by=created_at" className="text-white text-decoration-none">New Arrivals</Link></li>
            </ul>
          </div>
          <div className="col-6 col-md-2">
            <h6 className="fw-semibold mb-3">Account</h6>
            <ul className="list-unstyled small">
              <li className="mb-1"><Link to="/profile" className="text-white text-decoration-none">My Profile</Link></li>
              <li className="mb-1"><Link to="/orders" className="text-white text-decoration-none">My Orders</Link></li>
              <li className="mb-1"><Link to="/wishlist" className="text-white text-decoration-none">Wishlist</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6 className="fw-semibold mb-3">Contact & Support</h6>
            <ul className="list-unstyled small text-white">
              <li className="mb-2"><i className="bi bi-telephone me-2" />+880 1805-232206</li>
              <li className="mb-2"><i className="bi bi-envelope me-2" />support@bikrizone.com</li>
              <li className="mb-2"><i className="bi bi-geo-alt me-2" />Dhaka, Bangladesh</li>
            </ul>
            <div className="mt-3">
              <small className="text-white">Payment Methods</small>
              <div className="d-flex gap-2 mt-1">
                <span className="badge bg-secondary">bKash</span>
                <span className="badge bg-secondary">Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>
        <hr className="border-secondary mt-4" />
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <p className="text-white small mb-0">© {new Date().getFullYear()} BikriZone. All rights reserved.</p>
          <p className="text-white small mb-0">Developed by <span style={{ color: '#F2B50B' }}>LogicThree Software Agency</span></p>
        </div>
      </div>
    </footer>
  )
}
