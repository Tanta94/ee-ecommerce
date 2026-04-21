// src/pages/admin/AdminCustomers.js
import React, { useEffect, useState, useCallback } from 'react';
import api from '../../hooks/useApi';
import { useAuth } from '../../context/AppContext';

export default function AdminCustomers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/customers', token);
      setCustomers(Array.isArray(data) ? data : []);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c =>
    !search || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-page-header">
        <h1>Customers</h1>
        <p>View and manage all registered customers</p>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <input className="admin-search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{fontSize:13, color:'#888'}}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Orders</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="admin-empty">No customers found</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><strong>{c.first_name} {c.last_name}</strong></td>
                    <td style={{color:'#555'}}>{c.email}</td>
                    <td style={{color:'#888'}}>{c.phone || '—'}</td>
                    <td><span className={`badge badge--${c.role}`}>{c.role}</span></td>
                    <td style={{color:'#888', whiteSpace:'nowrap'}}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td><strong>{c.order_count || 0}</strong></td>
                    <td><button className="admin-btn admin-btn--outline" onClick={() => setSelected(c)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:24}}>
              <h2>{selected.first_name} {selected.last_name}</h2>
              <button onClick={() => setSelected(null)} style={{fontSize:20, color:'#888'}}>✕</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              {[
                {label:'Email', value: selected.email},
                {label:'Phone', value: selected.phone || '—'},
                {label:'Role', value: selected.role},
                {label:'Joined', value: new Date(selected.created_at).toLocaleDateString()},
                {label:'Total Orders', value: selected.order_count || 0},
                {label:'Total Spent', value: selected.total_spent ? `$${selected.total_spent}` : '—'},
              ].map(f => (
                <div key={f.label} style={{background:'#f9f9f9', padding:14, borderRadius:6}}>
                  <p style={{fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#888', marginBottom:4}}>{f.label}</p>
                  <p style={{fontWeight:600, fontSize:14}}>{f.value}</p>
                </div>
              ))}
            </div>
            <div className="admin-modal-actions" style={{marginTop:20}}>
              <button className="admin-btn admin-btn--outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
