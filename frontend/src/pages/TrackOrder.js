import React, { useState } from 'react';
import api from '../hooks/useApi';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_INFO = {
  pending:    { label: 'Order Received',   icon: '📋', color: '#d97706' },
  processing: { label: 'Being Prepared',   icon: '📦', color: '#2563eb' },
  shipped:    { label: 'On The Way',        icon: '🚚', color: '#7c3aed' },
  delivered:  { label: 'Delivered',         icon: '✅', color: '#16a34a' },
  cancelled:  { label: 'Cancelled',         icon: '❌', color: '#dc2626' },
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail]     = useState('');
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleTrack = async e => {
    e.preventDefault();
    if (!orderId || !email) { setError('Please enter both Order ID and Email'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const data = await api.get(`/orders/track?id=${orderId}&email=${encodeURIComponent(email)}`);
      setOrder(data);
    } catch (err) {
      setError('Order not found. Please check your Order ID and Email.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <main style={{ paddingTop: 'calc(var(--nav-height) + 60px)', paddingBottom: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 400, marginBottom: 12 }}>
            Track Your Order
          </h1>
          <p style={{ color: 'var(--dark-grey)', fontSize: 15 }}>
            Enter your Order ID and email to see your order status
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleTrack} style={{ background: 'var(--off-white)', padding: 32, marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, color: 'var(--dark-grey)', marginBottom: 8 }}>
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="e.g. 12345"
              style={{ width: '100%', border: '1.5px solid var(--light-grey)', padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, color: 'var(--dark-grey)', marginBottom: 8 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="The email used when ordering"
              style={{ width: '100%', border: '1.5px solid var(--light-grey)', padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-black" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {/* Result */}
        {order && (
          <div style={{ background: '#fff', border: '1px solid var(--light-grey)', padding: 32 }}>

            {/* Order Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: 4 }}>Order ID</p>
                <p style={{ fontWeight: 700, fontSize: 18 }}>#{order.id}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: 4 }}>Date</p>
                <p style={{ fontWeight: 500 }}>{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: 4 }}>Total</p>
                <p style={{ fontWeight: 700, fontSize: 18 }}>${order.total}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: 4 }}>Status</p>
                <span style={{
                  background: STATUS_INFO[order.status]?.color + '20',
                  color: STATUS_INFO[order.status]?.color,
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
                }}>
                  {STATUS_INFO[order.status]?.label || order.status}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {order.status !== 'cancelled' && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 8 }}>
                  <div style={{ position: 'absolute', top: 20, left: '10%', right: '10%', height: 2, background: 'var(--light-grey)', zIndex: 0 }} />
                  <div style={{ position: 'absolute', top: 20, left: '10%', height: 2, background: 'var(--black)', zIndex: 1, width: `${Math.max(0, currentStep / (STATUS_STEPS.length - 1)) * 80}%`, transition: 'width 0.5s ease' }} />
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2, flex: 1 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: i <= currentStep ? 'var(--black)' : 'var(--light-grey)',
                        color: i <= currentStep ? '#fff' : 'var(--mid-grey)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, transition: 'all 0.3s ease',
                        border: i === currentStep ? '3px solid var(--black)' : 'none',
                        boxShadow: i === currentStep ? '0 0 0 4px rgba(0,0,0,0.1)' : 'none'
                      }}>
                        {i <= currentStep ? '✓' : i + 1}
                      </div>
                      <p style={{ fontSize: 11, textAlign: 'center', color: i <= currentStep ? 'var(--black)' : 'var(--mid-grey)', fontWeight: i === currentStep ? 600 : 400 }}>
                        {STATUS_INFO[step]?.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {order.items?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: 16, fontWeight: 600 }}>Items</p>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--light-grey)' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 14 }}>{item.product_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--mid-grey)' }}>{item.size && `Size: ${item.size}`} {item.color && `· ${item.color}`} · Qty: {item.quantity}</p>
                    </div>
                    <p style={{ fontWeight: 600 }}>${item.subtotal}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Shipping Address */}
            {order.shipping_address && (
              <div style={{ marginTop: 24, padding: 16, background: 'var(--off-white)' }}>
                <p style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: 8, fontWeight: 600 }}>Shipping To</p>
                {(() => {
                  const a = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
                  return <p style={{ fontSize: 14, color: 'var(--dark-grey)', lineHeight: 1.7 }}>{a.first_name} {a.last_name}<br/>{a.address}<br/>{a.city}, {a.country}</p>;
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
