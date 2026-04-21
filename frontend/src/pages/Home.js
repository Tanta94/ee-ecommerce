// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../hooks/useApi';
import './Home.css';

function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-card__img-wrap">
        <img
          src={product.images?.[0] || `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600`}
          alt={product.name}
          className="product-card__img"
          loading="lazy"
        />
        {product.sale_price && <span className="product-card__tag">SALE</span>}
      </div>
      <div className="product-card__info">
        <p className="product-card__name">{product.name}</p>
        <p className="product-card__price">
          {product.sale_price ? (
            <><span className="product-card__original">${product.price}</span><span className="product-card__sale">${product.sale_price}</span></>
          ) : (
            <span>${product.price}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?featured=true&limit=8')
      .then(data => setFeatured(data.products || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { label: 'Women', slug: 'women', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800' },
    { label: 'Men',   slug: 'men',   img: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800' },
    { label: 'Kids',  slug: 'kids',  img: 'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=800' },
  ];

  return (
    <main className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__media">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600"
            alt="E&E Hero"
            className="hero__img"
          />
          <div className="hero__overlay" />
        </div>
        <div className="hero__content">
          <p className="hero__eyebrow">New Season</p>
          <h1 className="hero__title">Effortless<br /><em>Elegance</em></h1>
          <p className="hero__sub">Discover the new collection — refined essentials for every moment.</p>
          <div className="hero__ctas">
            <Link to="/shop?category=women" className="btn btn-white">Shop Women</Link>
            <Link to="/shop?category=men" className="btn btn-outline-white">Shop Men</Link>
          </div>
        </div>
        <div className="hero__scroll-hint">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* Category Grid */}
      <section className="categories container">
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
        </div>
        <div className="categories__grid">
          {categories.map(cat => (
            <Link to={`/shop?category=${cat.slug}`} key={cat.slug} className="category-card">
              <div className="category-card__img-wrap">
                <img src={cat.img} alt={cat.label} className="category-card__img" loading="lazy" />
                <div className="category-card__overlay" />
              </div>
              <div className="category-card__label">
                <span>{cat.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured container">
        <div className="section-header">
          <h2 className="section-title">Featured Pieces</h2>
          <Link to="/shop?featured=true" className="section-link">View All</Link>
        </div>
        {loading ? (
          <div className="featured__loading">
            {[...Array(8)].map((_, i) => <div key={i} className="product-skeleton" />)}
          </div>
        ) : (
          <div className="featured__grid">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Banner */}
      <section className="banner">
        <div className="banner__content">
          <p className="banner__eyebrow">Sustainable Fashion</p>
          <h2 className="banner__title">Conscious<br />Choices</h2>
          <p className="banner__text">We're committed to a more sustainable future — using responsible materials and ethical production.</p>
          <Link to="/sustainability" className="btn btn-outline">Learn More</Link>
        </div>
        <div className="banner__media">
          <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900" alt="Sustainability" />
        </div>
      </section>

      {/* USP Strip */}
      <section className="usp container">
        {[
          { icon: '🚚', title: 'Free Shipping', desc: 'On all orders over $50' },
          { icon: '↩️', title: 'Easy Returns', desc: 'Free returns within 30 days' },
          { icon: '🔒', title: 'Secure Payment', desc: 'Your data is always protected' },
          { icon: '💬', title: '24/7 Support', desc: 'We\'re here when you need us' },
        ].map(u => (
          <div key={u.title} className="usp__item">
            <span className="usp__icon">{u.icon}</span>
            <div><strong>{u.title}</strong><p>{u.desc}</p></div>
          </div>
        ))}
      </section>
    </main>
  );
}
