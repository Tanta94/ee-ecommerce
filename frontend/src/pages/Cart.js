import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useToast } from '../context/AppContext';
import './Cart.css';

export default function Cart() {
  const { items, total, removeItem, updateQty, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const shipping = total >= 50 ? 0 : 5.99;
  const grandTotal = total + shipping;

  if (!items || items.length === 0) return (
    <main className="cart-empty container">
      <div className="cart-empty__content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--light-grey)" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <h1>Your cart is empty</h1>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn btn-black">Continue Shopping</Link>
      </div>
    </main>
  );

  return (
    <main className="cart container">
      <div className="cart__header">
        <h1 className="cart__title">
          Shopping Cart <span>({items.length} {items.length === 1 ? 'item' : 'items'})</span>
        </h1>
        <button className="cart__clear" onClick={() => { clearCart(); showToast('Cart cleared'); }}>
          Clear cart
        </button>
      </div>

      <div className="cart__body">
        <div className="cart__items">
          {items.map(item => (
            <div key={item._key} className="cart-item">
              <div className="cart-item__img-wrap">
                <img
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300'}
                  alt={item.name}
                  className="cart-item__img"
                />
              </div>
              <div className="cart-item__info">
                <p className="cart-item__category">{item.category_name}</p>
                <p className="cart-item__name">{item.name}</p>
                <div className="cart-item__meta">
                  {item.color && <span>{item.color}</span>}
                  {item.color && item.size && <span>·</span>}
                  {item.size && <span>Size: {item.size}</span>}
                </div>
                <p className="cart-item__price">${parseFloat(item.sale_price || item.price).toFixed(2)}</p>
              </div>
              <div className="cart-item__controls">
                <div className="qty-control">
                  <button onClick={() => item.quantity > 1 ? updateQty(item._key, item.quantity - 1) : removeItem(item._key)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item._key, item.quantity + 1)}>+</button>
                </div>
                <p className="cart-item__subtotal">${(parseFloat(item.sale_price || item.price) * item.quantity).toFixed(2)}</p>
                <button className="cart-item__remove" onClick={() => removeItem(item._key)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart__summary">
          <h2>Order Summary</h2>
          <div className="cart__summary-rows">
            <div className="cart__summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="cart__summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span style={{color:'#16a34a'}}>Free</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            {shipping > 0 && <p className="cart__free-ship">Add ${(50 - total).toFixed(2)} more for free shipping</p>}
            <div className="cart__summary-row cart__summary-row--total"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
          </div>
          <button className="btn btn-black cart__checkout-btn" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
          <Link to="/shop" className="cart__continue">← Continue Shopping</Link>
        </div>
      </div>
    </main>
  );
}
