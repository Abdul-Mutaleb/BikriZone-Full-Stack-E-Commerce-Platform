import { useEffect, useState } from 'react'

const FAQS = [
  {
    category: 'Orders & Delivery',
    items: [
      { q: 'How long does delivery take?', a: 'Inside Dhaka: same day or next day. Outside Dhaka: 2–3 working days depending on your location.' },
      { q: 'Can I track my order?', a: 'Yes! After placing an order, go to "My Orders" from your profile to track the current status of your delivery.' },
      { q: "What if I'm not home during delivery?", a: 'Our delivery agent will call you before arriving. If you miss the delivery, it will be rescheduled within 24 hours.' },
      { q: 'Do you deliver nationwide?', a: 'Yes, we deliver to all 64 districts of Bangladesh.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept bKash, Nagad, debit/credit cards, and Cash on Delivery (COD).' },
      { q: 'Is it safe to pay online on BikriZone?', a: 'Absolutely. All transactions are SSL-encrypted and processed through trusted payment gateways.' },
      { q: 'Can I pay with bKash?', a: 'Yes! Select bKash at checkout and follow the payment instructions. Your order will be confirmed instantly.' },
      { q: 'When is my card charged?', a: 'Your card is charged immediately upon placing the order.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'What is the return policy?', a: 'You can return most items within 7 days of delivery if they are unused and in original packaging.' },
      { q: 'How do I request a refund?', a: 'Go to "My Orders", select the order, and click "Request Return". Our team will review and process within 3–5 business days.' },
      { q: 'When will I receive my refund?', a: 'Refunds are processed within 5–7 business days to your original payment method or bKash wallet.' },
    ],
  },
  {
    category: 'Account & Registration',
    items: [
      { q: 'How do I create an account?', a: 'Click "Sign In" in the top menu, then "Sign Up". You can register with your email or phone number.' },
      { q: 'I forgot my password. What do I do?', a: 'Click "Forgot Password" on the login page and follow the instructions sent to your email or phone.' },
      { q: 'Can I shop without an account?', a: 'Yes! You can browse and add to cart as a guest, but you\'ll need an account to place an order.' },
    ],
  },
]

export default function Faqs() {
  useEffect(() => { document.title = 'FAQs - BikriZone' }, [])
  const [openKey, setOpenKey] = useState('0-0')

  return (
    <div className="container py-5">

      <div className="text-center mb-5">
        <h1 className="fw-bold" style={{ color: '#25671E' }}>Frequently Asked <span style={{ color: '#48A111' }}>Questions</span></h1>
        <p className="text-muted" style={{ fontSize: 15 }}>Everything you need to know about BikriZone.</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          {FAQS.map((section, si) => (
            <div key={si} className="mb-4">
              <h5 className="fw-bold mb-3 px-1" style={{ color: '#25671E' }}>
                <i className="bi bi-folder2-open me-2" />{section.category}
              </h5>
              <div className="accordion" id={`acc-${si}`}>
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`
                  const open = openKey === key
                  return (
                    <div key={ii} className="accordion-item border mb-2 rounded-3 overflow-hidden" style={{ borderColor: '#e0f0d8 !important' }}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${open ? '' : 'collapsed'} fw-medium`}
                          style={{ fontSize: 14, background: open ? '#f0f8eb' : '#fff', color: open ? '#25671E' : '#333', boxShadow: 'none' }}
                          onClick={() => setOpenKey(open ? null : key)}
                        >
                          {item.q}
                        </button>
                      </h2>
                      {open && (
                        <div className="accordion-body text-muted" style={{ fontSize: 14, lineHeight: 1.7, background: '#fafff7' }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Still need help */}
          <div className="text-center mt-5 p-4 rounded-3" style={{ background: '#f0f8eb' }}>
            <i className="bi bi-chat-dots fs-2 mb-2 d-block" style={{ color: '#48A111' }} />
            <h5 className="fw-bold" style={{ color: '#25671E' }}>Still have questions?</h5>
            <p className="text-muted small mb-3">Our support team is available 24/7 to help you.</p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <a href="tel:+8801805232206" className="btn btn-primary btn-sm px-3">
                <i className="bi bi-telephone me-1" />Call Us
              </a>
              <a href="https://wa.me/8801805232206" target="_blank" rel="noreferrer"
                className="btn btn-sm px-3 text-white" style={{ background: '#25D366', borderColor: '#25D366' }}>
                <i className="bi bi-whatsapp me-1" />WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
