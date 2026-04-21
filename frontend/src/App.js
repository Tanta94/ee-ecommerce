// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { CartProvider, AuthProvider, ToastProvider } from './context/AppContext';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Customer Pages
import Home           from './pages/Home';
import Shop           from './pages/Shop';
import ProductDetail  from './pages/ProductDetail';
import Cart           from './pages/Cart';
import Checkout       from './pages/Checkout';
import { Login, Register } from './pages/Auth';
import Support        from './pages/Support';
import OrderSuccess   from './pages/OrderSuccess';

// Admin Pages
import AdminLogin     from './pages/admin/AdminLogin';
import AdminLayout    from './pages/admin/AdminLayout';
import Dashboard      from './pages/admin/Dashboard';
import AdminOrders    from './pages/admin/AdminOrders';
import AdminProducts  from './pages/admin/AdminProducts';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSupport   from './pages/admin/AdminSupport';

// Global CSS
import './index.css';

// Wrapper for customer pages (with Navbar + Footer)
function CustomerLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>

              {/* ── Customer Routes ───────────────── */}
              <Route path="/" element={
                <CustomerLayout><Home /></CustomerLayout>
              } />
              <Route path="/shop" element={
                <CustomerLayout><Shop /></CustomerLayout>
              } />
              <Route path="/product/:id" element={
                <CustomerLayout><ProductDetail /></CustomerLayout>
              } />
              <Route path="/cart" element={
                <CustomerLayout><Cart /></CustomerLayout>
              } />
              <Route path="/checkout" element={
                <CustomerLayout><Checkout /></CustomerLayout>
              } />
              <Route path="/order-success/:id" element={
                <CustomerLayout><OrderSuccess /></CustomerLayout>
              } />
              <Route path="/support" element={
                <CustomerLayout><Support /></CustomerLayout>
              } />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ── Admin Routes ──────────────────── */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index          element={<Dashboard />} />
                <Route path="orders"   element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="customers"element={<AdminCustomers />} />
                <Route path="support"  element={<AdminSupport />} />
              </Route>

              {/* ── Fallback ──────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
