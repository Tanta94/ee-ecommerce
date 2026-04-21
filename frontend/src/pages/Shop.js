// src/pages/Shop.js
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../hooks/useApi';
import './Shop.css';

function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-card__img-wrap">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'}
          alt={product.name}
          className="product-card__img"
          loading="lazy"
        />
        {product.sale_price && <span className="product-card__tag">SALE</span>}
      </div>
      <div className="product-card__info">
        <p className="product-card__category">{product.category_name}</p>
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

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name',       label: 'Name A–Z' },
];
const CATEGORIES = ['women','men','kids','accessories','home'];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search   = searchParams.get('search')   || '';
  const featured = searchParams.get('featured') || '';
  const sort     = searchParams.get('sort')     || 'newest';

  const fetchProducts = useCallback(async (pageNum = 1, replace = true) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 12, sort });
      if (category) params.set('category', category);
      if (search)   params.set('search', search);
      if (featured) params.set('featured', featured);
      const data = await api.get(`/products?${params}`);
      const list = data.products || [];
      setProducts(prev => replace ? list : [...prev, ...list]);
      setHasMore(list.length === 12);
      setPage(pageNum);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [category, search, featured, sort]);

  useEffect(() => { fetchProducts(1, true); }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  const pageTitle = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : search ? `Results for "${search}"` : 'All Products';

  return (
    <main className="shop">
      <div className="shop__header container">
        <h1 className="shop__title">{pageTitle}</h1>
        <div className="shop__controls">
          <button className="shop__filter-toggle" onClick={() => setFiltersOpen(o => !o)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filters
          </button>
          <select className="shop__sort" value={sort} onChange={e => updateParam('sort', e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="shop__body container">
        <aside className={`shop__sidebar ${filtersOpen ? 'shop__sidebar--open' : ''}`}>
          <div className="filter-group">
            <h3 className="filter-group__title">Category</h3>
            <ul className="filter-group__list">
              <li><button className={`filter-btn ${!category ? 'active' : ''}`} onClick={() => updateParam('category', '')}>All</button></li>
              {CATEGORIES.map(c => (
                <li key={c}><button className={`filter-btn ${category === c ? 'active' : ''}`} onClick={() => updateParam('category', c)}>{c.charAt(0).toUpperCase() + c.slice(1)}</button></li>
              ))}
            </ul>
          </div>
          <div className="filter-group">
            <h3 className="filter-group__title">Price Range</h3>
            <ul className="filter-group__list">
              {[{label:'Under $25',max:25},{label:'$25–$50',min:25,max:50},{label:'$50–$100',min:50,max:100},{label:'Over $100',min:100}].map(r => (
                <li key={r.label}><button className="filter-btn" onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  r.min ? next.set('min_price', r.min) : next.delete('min_price');
                  r.max ? next.set('max_price', r.max) : next.delete('max_price');
                  setSearchParams(next);
                }}>{r.label}</button></li>
              ))}
            </ul>
          </div>
          <button className="filter-clear" onClick={() => setSearchParams({})}>Clear All Filters</button>
        </aside>

        <div className="shop__main">
          {loading ? (
            <div className="products-grid">
              {[...Array(12)].map((_, i) => <div key={i} className="product-skeleton" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="shop__empty">
              <p>No products found.</p>
              <button className="btn btn-outline" onClick={() => setSearchParams({})}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {hasMore && (
                <div className="shop__load-more">
                  <button className="btn btn-outline" onClick={() => fetchProducts(page + 1, false)} disabled={loading}>
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
