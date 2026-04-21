// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top container">
        <div className="footer__brand">
          <h2 className="footer__logo">E&amp;E</h2>
          <p>Contemporary fashion for the modern individual. Quality meets style.</p>
        </div>
        <div className="footer__col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/shop?category=women">Women</Link></li>
            <li><Link to="/shop?category=men">Men</Link></li>
            <li><Link to="/shop?category=kids">Kids</Link></li>
            <li><Link to="/shop?category=accessories">Accessories</Link></li>
            <li><Link to="/shop?featured=true">New Arrivals</Link></li>
            <li><Link to="/shop?sale=true">Sale</Link></li>
          </ul>
        </div>
        <div className="footer__col">
          <h4>Help</h4>
          <ul>
            <li><Link to="/support">Customer Support</Link></li>
            <li><Link to="/support">Track My Order</Link></li>
            <li><Link to="/support">Returns & Exchanges</Link></li>
            <li><Link to="/support">Shipping Info</Link></li>
            <li><Link to="/support">Size Guide</Link></li>
            <li><Link to="/support">FAQ</Link></li>
          </ul>
        </div>
        <div className="footer__col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About E&amp;E</Link></li>
            <li><Link to="/sustainability">Sustainability</Link></li>
            <li><Link to="/careers">Careers</Link></li>
            <li><Link to="/press">Press</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom container">
        <p>© 2024 E&amp;E Fashion. All rights reserved.</p>
        <div className="footer__payment">
          <span>VISA</span><span>MC</span><span>AMEX</span><span>PayPal</span>
        </div>
      </div>
    </footer>
  );
}
