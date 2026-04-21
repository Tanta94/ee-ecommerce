// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/AppContext';
import { useAuth } from '../context/AppContext';
import './Navbar.css';

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Women', path: '/shop?category=women' },
    { label: 'Men', path: '/shop?category=men' },
    { label: 'Kids', path: '/shop?category=kids' },
    { label: 'Home', path: '/shop?category=home' },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          {/* Hamburger */}
          <button className="navbar__hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>

          {/* Logo */}
          <Link to="/" className="navbar__logo">E&amp;E</Link>

          {/* Desktop Nav */}
          <ul className="navbar__links">
            {navLinks.map(l => (
              <li key={l.label}>
                <Link to={l.path} className="navbar__link">{l.label}</Link>
              </li>
            ))}
          </ul>

          {/* Icons */}
          <div className="navbar__icons">
            <button className="navbar__icon-btn" onClick={() => setSearchOpen(s => !s)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
            <Link to={user ? '/account' : '/login'} className="navbar__icon-btn" aria-label="Account">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
            <Link to="/wishlist" className="navbar__icon-btn" aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </Link>
            <Link to="/cart" className="navbar__icon-btn navbar__cart-btn" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {itemCount > 0 && <span className="navbar__badge">{itemCount}</span>}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`navbar__search ${searchOpen ? 'navbar__search--open' : ''}`}>
          <form onSubmit={handleSearch} className="navbar__search-form">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus={searchOpen}
            />
            <button type="submit">Search</button>
            <button type="button" onClick={() => setSearchOpen(false)}>✕</button>
          </form>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        <div className="mobile-menu__overlay" onClick={() => setMenuOpen(false)} />
        <div className="mobile-menu__drawer">
          <button className="mobile-menu__close" onClick={() => setMenuOpen(false)}>✕</button>
          <Link to="/" className="mobile-menu__logo" onClick={() => setMenuOpen(false)}>E&amp;E</Link>
          <ul className="mobile-menu__links">
            {navLinks.map(l => (
              <li key={l.label}><Link to={l.path} onClick={() => setMenuOpen(false)}>{l.label}</Link></li>
            ))}
            <li className="mobile-menu__divider" />
            {user ? (
              <>
                <li><Link to="/account" onClick={() => setMenuOpen(false)}>My Account</Link></li>
                <li><button onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link></li>
                <li><Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link></li>
              </>
            )}
            <li><Link to="/support" onClick={() => setMenuOpen(false)}>Customer Support</Link></li>
          </ul>
        </div>
      </div>
    </>
  );
}
