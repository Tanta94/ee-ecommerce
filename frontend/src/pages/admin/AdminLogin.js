// src/pages/admin/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../../context/AppContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.user.role !== 'admin') throw new Error('Admin access required');
      navigate('/admin');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <h1 className="admin-login__logo">E&amp;E</h1>
        <p className="admin-login__subtitle">Admin Portal</p>
        <form onSubmit={handleSubmit} className="admin-login__form">
          <div className="admin-login__group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="admin@ee-fashion.com" required />
          </div>
          <div className="admin-login__group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="••••••••" required />
          </div>
          <button type="submit" className="admin-login__btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Admin'}
          </button>
        </form>
      </div>
      <style>{`
        .admin-login { min-height: 100vh; background: #0f0f0f; display: flex; align-items: center; justify-content: center; }
        .admin-login__card { background: #1a1a1a; padding: 48px; width: 100%; max-width: 400px; border: 1px solid #2a2a2a; }
        .admin-login__logo { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 600; letter-spacing: 3px; color: #fff; text-align: center; margin-bottom: 4px; }
        .admin-login__subtitle { text-align: center; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #666; margin-bottom: 36px; }
        .admin-login__form { display: flex; flex-direction: column; gap: 20px; }
        .admin-login__group { display: flex; flex-direction: column; gap: 8px; }
        .admin-login__group label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #888; }
        .admin-login__group input { background: #111; border: 1px solid #333; color: #fff; padding: 12px 14px; font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .admin-login__group input:focus { border-color: #555; }
        .admin-login__btn { background: #fff; color: #000; border: none; padding: 14px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; cursor: pointer; margin-top: 8px; transition: background 0.2s; font-family: inherit; }
        .admin-login__btn:hover { background: #e8e8e8; }
        .admin-login__btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
