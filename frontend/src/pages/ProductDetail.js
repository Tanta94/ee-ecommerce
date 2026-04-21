// src/pages/ProductDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../hooks/useApi';
import { useCart, useToast } from '../context/AppContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeError, setSizeError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(data => { setProduct(data); setSelectedColor(data.colors?.[0] || ''); })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    addToCart({ ...product, size: selectedSize, color: selectedColor });
    showToast(`${product.name} added to cart ✓`);
  };

  if (loading) return (
    <div className="pd-loading container">
      <div className="pd-loading__img product-skeleton" />
      <div className="pd-loading__info">
        {[...Array(5)].map((_, i) => <div key={i} className="pd-loading__line product-skeleton" style={{width: `${[60,40,80,100,70][i]}%`, height: i === 2 ? 32 : 16}} />)}
      </div>
    </div>
  );
  if (!product) return null;

  const displayPrice = product.sale_price || product.price;
  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'];

  return (
    <main className="pd container">
      <button className="pd__back" onClick={() => navigate(-1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back
      </button>

      <div className="pd__grid">
        {/* Images */}
        <div className="pd__images">
          <div className="pd__thumbs">
            {images.map((img, i) => (
              <button key={i} className={`pd__thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                <img src={img} alt={`${product.name} ${i+1}`} />
              </button>
            ))}
          </div>
          <div className="pd__main-img">
            <img src={images[activeImg]} alt={product.name} />
            {product.sale_price && <span className="pd__badge">SALE</span>}
          </div>
        </div>

        {/* Info */}
        <div className="pd__info">
          <p className="pd__category">{product.category_name}</p>
          <h1 className="pd__name">{product.name}</h1>
          <div className="pd__price">
            {product.sale_price ? (
              <>
                <span className="pd__price-sale">${product.sale_price}</span>
                <span className="pd__price-original">${product.price}</span>
                <span className="pd__price-saving">Save ${(product.price - product.sale_price).toFixed(2)}</span>
              </>
            ) : (
              <span className="pd__price-main">${product.price}</span>
            )}
          </div>

          <p className="pd__desc">{product.description}</p>

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="pd__option">
              <p className="pd__option-label">Color: <strong>{selectedColor}</strong></p>
              <div className="pd__colors">
                {product.colors.map(c => (
                  <button key={c} className={`pd__color-btn ${selectedColor === c ? 'active' : ''}`} onClick={() => setSelectedColor(c)}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="pd__option">
              <p className={`pd__option-label ${sizeError ? 'error' : ''}`}>
                Size {sizeError && <span className="pd__size-error">— Please select a size</span>}
              </p>
              <div className="pd__sizes">
                {product.sizes.map(s => (
                  <button key={s} className={`pd__size-btn ${selectedSize === s ? 'active' : ''}`} onClick={() => { setSelectedSize(s); setSizeError(false); }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <p className="pd__stock">
            {product.stock_quantity === 0 ? (
              <span className="pd__stock--out">Out of Stock</span>
            ) : product.stock_quantity <= 5 ? (
              <span className="pd__stock--low">Only {product.stock_quantity} left</span>
            ) : (
              <span className="pd__stock--in">In Stock</span>
            )}
          </p>

          <div className="pd__actions">
            <button className="btn btn-black pd__add-btn" onClick={handleAddToCart} disabled={product.stock_quantity === 0}>
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button className="pd__wishlist-btn" aria-label="Add to wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>

          <div className="pd__meta">
            <div className="pd__meta-item"><span>Free shipping</span><span>on orders over $50</span></div>
            <div className="pd__meta-item"><span>Free returns</span><span>within 30 days</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
