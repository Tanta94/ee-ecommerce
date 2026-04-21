// src/pages/Auth.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useToast } from '../context/AppContext';
import './Auth.css';

export function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast('Welcome back! ✓');
      navigate(from);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth__card">
        <Link to="/" className="auth__logo">E&amp;E</Link>
        <h1 className="auth__title">Sign In</h1>
        <p className="auth__sub">Welcome back to E&amp;E Fashion</p>
        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-black auth__btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth__footer">Don't have an account? <Link to="/register">Create one</Link></p>
      </div>
      <div className="auth__visual">
        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900" alt="E&E Fashion" />
        <div className="auth__visual-overlay">
          <p className="auth__visual-quote">"Style is a way to say who you are without having to speak."</p>
        </div>
      </div>
    </main>
  );
}

export function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { showToast('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password });
      showToast('Account created! Welcome to E&E ✓');
      navigate('/');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth__card">
        <Link to="/" className="auth__logo">E&amp;E</Link>
        <h1 className="auth__title">Create Account</h1>
        <p className="auth__sub">Join E&amp;E Fashion today</p>
        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__name-row">
            <div className="form-group">
              <label>First Name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="John" required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" required />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-black auth__btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth__footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
      <div className="auth__visual">
        <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900" alt="E&E Fashion" />
        <div className="auth__visual-overlay">
          <p className="auth__visual-quote">"Fashion is the armor to survive the reality of everyday life."</p>
        </div>
      </div>
    </main>
  );
}
