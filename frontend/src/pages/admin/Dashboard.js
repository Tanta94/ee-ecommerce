// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../hooks/useApi';
import { useAuth } from '../../context/AppContext';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats]   = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats', token),
      api.get('/admin/orders?limit=5', token),
    ]).then(([s, o]) => {
      setStats(s);
      setOrders(o.orders || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const STATUS_COLOR = { pending:'pending', processing:'processing', shipped:'shipped', delivered:'delivered', cancelled:'cancelled' };

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening in your store.</p>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {[
          { label: 'Total Revenue', value: `$${stats?.total_revenue?.toFixed(2) || '0.00'}`, change: '+12% this month', up: true },
          { label: 'Total Orders',  value: stats?.total_orders || 0,   change: '+8% this month',  up: true },
          { label: 'Total Products',value: stats?.total_products || 0, change: `${stats?.low_stock || 0} low stock`, up: false },
          { label: 'Total Customers',value: stats?.total_customers || 0, change: '+5% this month', up: true },
        ].map(s => (
          <div key={s.label} className="admin-stat">
            <p className="admin-stat__label">{s.label}</p>
            <p className="admin-stat__value">{s.value}</p>
            <p className={`admin-stat__change ${s.up ? 'up' : 'down'}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent Orders */}
        <div className="admin-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:16, fontWeight:700 }}>Recent Orders</h2>
            <Link to="/admin/orders" className="admin-btn admin-btn--outline">View All</Link>
          </div>
          {orders.length === 0 ? <p className="admin-empty">No orders yet</p> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><Link to={`/admin/orders/${o.id}`} style={{fontWeight:600}}>#{o.id}</Link></td>
                      <td>{o.guest_email || `${o.first_name || ''} ${o.last_name || ''}`}</td>
                      <td>${o.total}</td>
                      <td><span className={`badge badge--${STATUS_COLOR[o.status]}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="admin-card">
          <h2 style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>Quick Actions</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'➕ Add New Product', to:'/admin/products/new' },
              { label:'📦 View Pending Orders', to:'/admin/orders?status=pending' },
              { label:'💬 Open Support Tickets', to:'/admin/support?status=open' },
              { label:'👥 View All Customers', to:'/admin/customers' },
              { label:'🛍️ Visit Storefront', to:'/' },
            ].map(a => (
              <Link key={a.label} to={a.to} className="admin-btn admin-btn--outline" style={{display:'block', textAlign:'left'}}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
