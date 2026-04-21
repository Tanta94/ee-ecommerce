// src/pages/OrderSuccess.js
import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function OrderSuccess() {
  const { id } = useParams();
  return (
    <main style={{ paddingTop: 'calc(var(--nav-height) + 80px)', paddingBottom: 80, textAlign: 'center' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#dcfce7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 36
        }}>✓</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400, marginBottom: 12 }}>
          Order Confirmed!
        </h1>
        <p style={{ color: 'var(--dark-grey)', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
          Thank you for your order. We've received it and will start processing it right away.
        </p>
        <p style={{ color: 'var(--mid-grey)', fontSize: 14, marginBottom: 36 }}>
          Order #{id} · A confirmation email will be sent shortly.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/shop" className="btn btn-black">Continue Shopping</Link>
          <Link to="/support" className="btn btn-outline">Need Help?</Link>
        </div>
      </div>
    </main>
  );
}
