// src/context/AppContext.js
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import api from '../hooks/useApi';

// ── Cart Context ─────────────────────────────────────────
const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const key = `${action.item.id}-${action.item.size}-${action.item.color}`;
      const existing = state.items.find(i => i._key === key);
      if (existing) {
        return { ...state, items: state.items.map(i => i._key === key ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { ...state, items: [...state.items, { ...action.item, _key: key, quantity: 1 }] };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i._key !== action.key) };
    case 'UPDATE_QTY':
      return { ...state, items: state.items.map(i => i._key === action.key ? { ...i, quantity: action.qty } : i) };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, init => {
    try { return JSON.parse(localStorage.getItem('ee_cart')) || init; } catch { return init; }
  });

  useEffect(() => { localStorage.setItem('ee_cart', JSON.stringify(state)); }, [state]);

  const addToCart   = item => dispatch({ type: 'ADD', item });
  const removeItem  = key  => dispatch({ type: 'REMOVE', key });
  const updateQty   = (key, qty) => dispatch({ type: 'UPDATE_QTY', key, qty });
  const clearCart   = ()   => dispatch({ type: 'CLEAR' });

  const total    = state.items.reduce((sum, i) => sum + (i.sale_price || i.price) * i.quantity, 0);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, total, itemCount, addToCart, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);

// ── Auth Context ─────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(() => localStorage.getItem('ee_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me', token)
        .then(data => setUser(data))
        .catch(() => { localStorage.removeItem('ee_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('ee_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const data = await api.post('/auth/register', formData);
    localStorage.setItem('ee_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ee_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);

// ── Toast Context ─────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast show">{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
