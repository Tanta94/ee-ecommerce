// src/pages/Checkout.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth, useToast } from '../context/AppContext';
import api from '../hooks/useApi';
import './Checkout.css';

const steps = ['Shipping', 'Payment', 'Review'];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [shipping, setShipping] = useState({
    first_name: user?.first_name || '', last_name: user?.last_name || '',
    email: user?.email || '', phone: '', address: '',
    city: '', country: 'Egypt', postal_code: '',
  });
  const [payment, setPayment] = useState({ method: 'card', card_number: '', expiry: '', cvv: '' });

  const shippingCost = total >= 50 ? 0 : 5.99;
  const grandTotal = total + shippingCost;

  const handleShipping = e => setShipping(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePayment  = e => setPayment(p => ({ ...p, [e.target.name]: e.target.value }));

  const validateShipping = () => {
    const required = ['first_name','last_name','email','address','city'];
    return required.every(k => shipping[k].trim());
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity, size: i.size, color: i.color })),
        shipping_address: shipping,
        payment_method: payment.method,
        guest_email: !user ? shipping.email : undefined,
      };
      const res = await api.post('/orders', payload, token);
      clearCart();
      showToast('Order placed successfully! 🎉');
      navigate(`/order-success/${res.order_id}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <main className="checkout container">
      <h1 className="checkout__title">Checkout</h1>

      {/* Steps */}
      <div className="checkout__steps">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`checkout__step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span className="checkout__step-num">{i < step ? '✓' : i + 1}</span>
              <span className="checkout__step-label">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`checkout__step-line ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="checkout__body">
        {/* Left: Form */}
        <div className="checkout__form">
          {/* Step 0: Shipping */}
          {step === 0 && (
            <div className="checkout__section">
              <h2>Shipping Information</h2>
              <div className="form-grid">
                <div className="form-group"><label>First Name *</label><input name="first_name" value={shipping.first_name} onChange={handleShipping} placeholder="John" /></div>
                <div className="form-group"><label>Last Name *</label><input name="last_name" value={shipping.last_name} onChange={handleShipping} placeholder="Doe" /></div>
                <div className="form-group form-group--full"><label>Email *</label><input type="email" name="email" value={shipping.email} onChange={handleShipping} placeholder="john@example.com" /></div>
                <div className="form-group form-group--full"><label>Phone</label><input name="phone" value={shipping.phone} onChange={handleShipping} placeholder="+20 xxx xxx xxxx" /></div>
                <div className="form-group form-group--full"><label>Address *</label><input name="address" value={shipping.address} onChange={handleShipping} placeholder="123 Street, Apartment 4B" /></div>
                <div className="form-group"><label>City *</label><input name="city" value={shipping.city} onChange={handleShipping} placeholder="Cairo" /></div>
                <div className="form-group"><label>Postal Code</label><input name="postal_code" value={shipping.postal_code} onChange={handleShipping} placeholder="11511" /></div>
                <div className="form-group form-group--full">
                  <label>Country</label>
                  <select name="country" value={shipping.country} onChange={handleShipping}>
                    {['Egypt','Saudi Arabia','UAE','Kuwait','Jordan','Lebanon','USA','UK','France','Germany'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-black checkout__next" onClick={() => validateShipping() ? setStep(1) : showToast('Please fill all required fields')}>
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="checkout__section">
              <h2>Payment Method</h2>
              <div className="payment-methods">
                {[{id:'card',label:'Credit / Debit Card'},{id:'cash',label:'Cash on Delivery'},{id:'wallet',label:'Digital Wallet'}].map(m => (
                  <label key={m.id} className={`payment-method ${payment.method === m.id ? 'active' : ''}`}>
                    <input type="radio" name="method" value={m.id} checked={payment.method === m.id} onChange={handlePayment} />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
              {payment.method === 'card' && (
                <div className="form-grid">
                  <div className="form-group form-group--full"><label>Card Number</label><input name="card_number" value={payment.card_number} onChange={handlePayment} placeholder="1234 5678 9012 3456" maxLength={19} /></div>
                  <div className="form-group"><label>Expiry Date</label><input name="expiry" value={payment.expiry} onChange={handlePayment} placeholder="MM/YY" maxLength={5} /></div>
                  <div className="form-group"><label>CVV</label><input name="cvv" value={payment.cvv} onChange={handlePayment} placeholder="123" maxLength={4} type="password" /></div>
                </div>
              )}
              <div className="checkout__nav">
                <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
                <button className="btn btn-black" onClick={() => setStep(2)}>Review Order →</button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="checkout__section">
              <h2>Review Your Order</h2>
              <div className="review-block">
                <h3>Shipping to</h3>
                <p>{shipping.first_name} {shipping.last_name}</p>
                <p>{shipping.address}, {shipping.city}, {shipping.country}</p>
                <p>{shipping.email} · {shipping.phone}</p>
              </div>
              <div className="review-block">
                <h3>Payment</h3>
                <p>{payment.method === 'card' ? 'Credit/Debit Card' : payment.method === 'cash' ? 'Cash on Delivery' : 'Digital Wallet'}</p>
              </div>
              <div className="review-block">
                <h3>Items ({items.length})</h3>
                {items.map(i => (
                  <div key={i._key} className="review-item">
                    <img src={i.images?.[0]} alt={i.name} />
                    <div>
                      <p>{i.name}</p>
                      <p className="review-item__meta">{i.color} {i.size && `· ${i.size}`} · Qty: {i.quantity}</p>
                    </div>
                    <p>${((i.sale_price || i.price) * i.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="checkout__nav">
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-black" onClick={placeOrder} disabled={loading}>
                  {loading ? 'Placing Order...' : `Place Order · $${grandTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="checkout__summary">
          <h3>Order Summary</h3>
          <div className="checkout__summary-items">
            {items.map(i => (
              <div key={i._key} className="checkout__summary-item">
                <div className="checkout__summary-img-wrap">
                  <img src={i.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200'} alt={i.name} />
                  <span className="checkout__summary-qty">{i.quantity}</span>
                </div>
                <div>
                  <p>{i.name}</p>
                  {i.size && <p className="checkout__meta">{i.size} · {i.color}</p>}
                </div>
                <p>${((i.sale_price || i.price) * i.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="checkout__summary-totals">
            <div className="checkout__summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="checkout__summary-row"><span>Shipping</span><span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span></div>
            <div className="checkout__summary-row checkout__summary-row--total"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
