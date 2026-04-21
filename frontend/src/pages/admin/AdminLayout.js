// src/pages/admin/AdminLayout.js
import React, { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';
import './Admin.css';

const NAV = [
  { path: '/admin',          label: 'Dashboard',  icon: '📊', exact: true },
  { path: '/admin/orders',   label: 'Orders',     icon: '📦' },
  { path: '/admin/products', label: 'Products',   icon: '👗' },
  { path: '/admin/customers',label: 'Customers',  icon: '👥' },
  { path: '/admin/support',  label: 'Support',    icon: '💬' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Guard: redirect non-admins
  if (!user) { navigate('/admin/login'); return null; }
  if (user.role !== 'admin') { navigate('/'); return null; }

  return (
    <div className={`admin-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__head">
          <Link to="/admin" className="admin-sidebar__logo">{collapsed ? 'E' : 'E&E Admin'}</Link>
          <button className="admin-sidebar__toggle" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-item__icon">{item.icon}</span>
              {!collapsed && <span className="admin-nav-item__label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{user.first_name?.[0]}{user.last_name?.[0]}</div>
            {!collapsed && (
              <div>
                <p className="admin-sidebar__name">{user.first_name} {user.last_name}</p>
                <p className="admin-sidebar__role">Administrator</p>
              </div>
            )}
          </div>
          <button className="admin-sidebar__logout" onClick={() => { logout(); navigate('/'); }} title="Sign Out">
            {collapsed ? '🚪' : '↩ Sign Out'}
          </button>
          <Link to="/" className="admin-sidebar__storefront" title="View Store">
            {collapsed ? '🛍️' : '← View Store'}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
