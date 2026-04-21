// src/pages/admin/AdminSupport.js
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../hooks/useApi';
import { useAuth, useToast } from '../../context/AppContext';

const STATUSES = ['open','in_progress','resolved','closed'];

export default function AdminSupport() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply]       = useState('');
  const [sending, setSending]   = useState(false);

  const statusFilter = searchParams.get('status') || '';

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.get(`/support?${params}`, token);
      setMessages(Array.isArray(data) ? data : []);
    } catch { setMessages([]); }
    finally { setLoading(false); }
  }, [token, statusFilter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const openMessage = (msg) => { setSelected(msg); setReply(msg.admin_reply || ''); };

  const sendReply = async () => {
    if (!reply.trim()) { showToast('Reply cannot be empty'); return; }
    setSending(true);
    try {
      await api.patch(`/support/${selected.id}/reply`, { reply }, token);
      showToast('Reply sent ✓');
      fetchMessages();
      setSelected(s => ({ ...s, admin_reply: reply, status: 'resolved' }));
    } catch (err) { showToast(err.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Customer Support</h1>
        <p>View and respond to customer messages</p>
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

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:16 }}>
        {/* Messages List */}
        <div className="admin-card" style={{padding:0}}>
          {loading ? <div className="admin-loading"><div className="spinner" /></div> :
            messages.length === 0 ? <p className="admin-empty">No messages found</p> : (
              <div>
                {messages.map(m => (
                  <div
                    key={m.id}
                    onClick={() => openMessage(m)}
                    style={{
                      padding:'16px 20px', borderBottom:'1px solid #eee', cursor:'pointer',
                      background: selected?.id === m.id ? '#f9f9f9' : '#fff',
                      transition:'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f4f4f4'}
                    onMouseLeave={e => e.currentTarget.style.background = selected?.id === m.id ? '#f9f9f9' : '#fff'}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                      <div>
                        <strong style={{fontSize:14}}>{m.name}</strong>
                        <span style={{fontSize:12, color:'#888', marginLeft:8}}>{m.email}</span>
                      </div>
                      <span className={`badge badge--${m.status}`}>{m.status}</span>
                    </div>
                    {m.subject && <p style={{fontSize:13, fontWeight:500, marginBottom:4}}>{m.subject}</p>}
                    <p style={{fontSize:12, color:'#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{m.message}</p>
                    <p style={{fontSize:11, color:'#aaa', marginTop:6}}>{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Message Detail + Reply */}
        {selected && (
          <div className="admin-card">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
              <h2 style={{fontSize:18, fontWeight:700}}>Message #{selected.id}</h2>
              <button onClick={() => setSelected(null)} style={{fontSize:18, color:'#888'}}>✕</button>
            </div>

            {/* Customer message */}
            <div style={{background:'#f4f4f4', borderRadius:8, padding:16, marginBottom:20}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                <div>
                  <strong>{selected.name}</strong>
                  <span style={{fontSize:12, color:'#888', marginLeft:8}}>{selected.email}</span>
                </div>
                <span className={`badge badge--${selected.status}`}>{selected.status}</span>
              </div>
              {selected.subject && <p style={{fontWeight:600, marginBottom:8, fontSize:14}}>{selected.subject}</p>}
              {selected.order_id && <p style={{fontSize:12, color:'#888', marginBottom:8}}>Order #{selected.order_id}</p>}
              <p style={{fontSize:14, lineHeight:1.8, color:'#333'}}>{selected.message}</p>
              <p style={{fontSize:11, color:'#aaa', marginTop:10}}>{new Date(selected.created_at).toLocaleString()}</p>
            </div>

            {/* Previous reply */}
            {selected.admin_reply && (
              <div style={{background:'#e8f5e9', borderRadius:8, padding:16, marginBottom:20, borderLeft:'3px solid #16a34a'}}>
                <p style={{fontSize:11, color:'#16a34a', fontWeight:600, marginBottom:8}}>YOUR PREVIOUS REPLY</p>
                <p style={{fontSize:14, lineHeight:1.8}}>{selected.admin_reply}</p>
                {selected.replied_at && <p style={{fontSize:11, color:'#888', marginTop:8}}>{new Date(selected.replied_at).toLocaleString()}</p>}
              </div>
            )}

            {/* Reply Box */}
            <div>
              <label style={{fontSize:11, letterSpacing:1, textTransform:'uppercase', color:'#888', fontWeight:600, display:'block', marginBottom:8}}>
                Your Reply
              </label>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={5}
                placeholder="Type your reply to the customer..."
                style={{width:'100%', border:'1px solid #ddd', borderRadius:4, padding:'10px 12px', fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', marginBottom:12}}
              />
              <div style={{display:'flex', gap:10}}>
                <button className="admin-btn admin-btn--primary" onClick={sendReply} disabled={sending}>
                  {sending ? 'Sending...' : '📤 Send Reply'}
                </button>
                <button className="admin-btn admin-btn--outline" onClick={() => setSelected(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
