// src/pages/Support.js
import React, { useState } from 'react';
import { useAuth, useToast } from '../context/AppContext';
import api from '../hooks/useApi';
import './Support.css';

const TOPICS = ['Order Issue','Return & Exchange','Shipping','Product Question','Payment','Other'];

export default function Support() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: user ? `${user.first_name} ${user.last_name}` : '',
    email: user?.email || '',
    subject: '',
    message: '',
    order_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { showToast('Please fill all required fields'); return; }
    setLoading(true);
    try {
      await api.post('/support', form, token);
      setSent(true);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { q: 'How long does shipping take?', a: 'Standard shipping takes 3–7 business days. Express shipping takes 1–2 business days.' },
    { q: 'What is your return policy?', a: 'We offer free returns within 30 days of delivery. Items must be unworn and in original packaging.' },
    { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive a tracking number via email. You can also check your account order history.' },
    { q: 'Can I change or cancel my order?', a: 'Orders can be modified or cancelled within 1 hour of placement. Contact us immediately for assistance.' },
    { q: 'Do you offer international shipping?', a: 'Yes! We ship to 50+ countries. International shipping takes 7–14 business days.' },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  if (sent) return (
    <main className="support container">
      <div className="support__success">
        <div className="support__success-icon">✓</div>
        <h2>Message Sent!</h2>
        <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
        <button className="btn btn-black" onClick={() => setSent(false)}>Send Another Message</button>
      </div>
    </main>
  );

  return (
    <main className="support">
      {/* Hero */}
      <section className="support__hero">
        <h1>How can we help you?</h1>
        <p>Our customer support team is here for you 24/7</p>
      </section>

      <div className="support__body container">
        {/* Contact Cards */}
        <div className="support__channels">
          {[
            { icon: '💬', title: 'Live Chat', desc: 'Chat with us in real time', action: 'Start Chat', sub: 'Available 9AM – 9PM' },
            { icon: '📧', title: 'Email Us', desc: 'support@ee-fashion.com', action: 'Send Email', sub: 'Reply within 24 hours' },
            { icon: '📞', title: 'Call Us', desc: '+20 2 1234 5678', action: 'Call Now', sub: 'Mon–Fri, 9AM – 6PM' },
          ].map(c => (
            <div key={c.title} className="support__channel">
              <span className="support__channel-icon">{c.icon}</span>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <button className="btn btn-outline support__channel-btn">{c.action}</button>
              <small>{c.sub}</small>
            </div>
          ))}
        </div>

        <div className="support__main">
          {/* FAQ */}
          <section className="support__faq">
            <h2 className="support__section-title">Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="faq-item__q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {faq.q}
                    <span className="faq-item__icon">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  <div className="faq-item__a"><p>{faq.a}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section className="support__form-section">
            <h2 className="support__section-title">Send Us a Message</h2>
            <form className="support__form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Topic</label>
                  <select name="subject" value={form.subject} onChange={handleChange}>
                    <option value="">Select a topic...</option>
                    {TOPICS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Order ID (optional)</label>
                  <input name="order_id" value={form.order_id} onChange={handleChange} placeholder="e.g. 12345" />
                </div>
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us how we can help you..." rows={5} required minLength={10} />
              </div>
              <button type="submit" className="btn btn-black support__submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
