// src/pages/admin/AdminOrders.js
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../hooks/useApi';
import { useAuth, useToast } from '../../context/AppContext';

const STATUSES = ['pending','processing','shipped','delivered','cancelled'];

export default function AdminOrders() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // for detail modal
  const [search, setSearch]   = useState('');

  const statusFilter = searchParams.get('status') || '';

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.get(`/admin/orders?${params}`, token);
      setOrders(data.orders || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [token, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status }, token);
      showToast(`Order #${id} updated to ${status} ✓`);
      fetchOrders();
      setSelected(s => s ? { ...s, status } : null);
    } catch (err) { showToast(err.message); }
  };

  const filtered = orders.filter(o =>
    !search || String(o.id).includes(search) ||
    (o.guest_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (`${o.first_name} ${o.last_name}`).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-page-header">
        <h1>Orders</h1>
        <p>Manage and track all customer orders</p>
      </div>

      {/* Status Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['', ...STATUSES].map(s => (
          <button
            key={s}
            className={`admin-btn ${statusFilter === s ? 'admin-btn--primary' : 'admin-btn--outline'}`}
            onClick={() => { const n = new URLSearchParams(searchParams); s ? n.set('status',s) : n.delete('status'); setSearchParams(n); }}
          >{s || 'All'}</button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <input className="admin-search" placeholder="Search by order ID, email, or name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="admin-empty">No orders found</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>
                      <div>{o.first_name ? `${o.first_name} ${o.last_name}` : 'Guest'}</div>
                      <div style={{fontSize:11, color:'#888'}}>{o.guest_email || o.email}</div>
                    </td>
                    <td style={{whiteSpace:'nowrap'}}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>{o.item_count || '—'}</td>
                    <td><strong>${o.total}</strong></td>
                    <td><span className={`badge badge--${o.payment_status === 'paid' ? 'delivered' : 'pending'}`}>{o.payment_status}</span></td>
                    <td><span className={`badge badge--${o.status}`}>{o.status}</span></td>
                    <td>
                      <button className="admin-btn admin-btn--outline" onClick={() => setSelected(o)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
              <div>
                <h2>Order #{selected.id}</h2>
                <p style={{fontSize:12, color:'#888'}}>{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{fontSize:20, color:'#888', lineHeight:1}}>✕</button>
            </div>

            {/* Status Update */}
            <div className="admin-form-group" style={{marginBottom:20}}>
              <label>Update Status</label>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    className={`admin-btn ${selected.status === s ? 'admin-btn--primary' : 'admin-btn--outline'}`}
                    onClick={() => updateStatus(selected.id, s)}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div style={{background:'#f9f9f9', padding:16, borderRadius:6, marginBottom:16}}>
              <p style={{fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#888', marginBottom:8}}>Customer</p>
              <p style={{fontWeight:600}}>{selected.first_name ? `${selected.first_name} ${selected.last_name}` : 'Guest'}</p>
              <p style={{fontSize:13, color:'#666'}}>{selected.guest_email || selected.email}</p>
            </div>

            {/* Shipping Address */}
            {selected.shipping_address && (
              <div style={{background:'#f9f9f9', padding:16, borderRadius:6, marginBottom:16}}>
                <p style={{fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#888', marginBottom:8}}>Shipping Address</p>
                {(() => {
                  const a = typeof selected.shipping_address === 'string' ? JSON.parse(selected.shipping_address) : selected.shipping_address;
                  return <p style={{fontSize:13, color:'#444', lineHeight:1.7}}>{a.address}<br/>{a.city}, {a.country} {a.postal_code}</p>;
                })()}
              </div>
            )}

            <div style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid #eee', fontWeight:600, fontSize:15}}>
              <span>Total</span><span>${selected.total}</span>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn--outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
