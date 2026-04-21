// src/pages/admin/AdminProducts.js
import React, { useEffect, useState, useCallback } from 'react';
import api from '../../hooks/useApi';
import { useAuth, useToast } from '../../context/AppContext';

const EMPTY_PRODUCT = { name:'', description:'', price:'', sale_price:'', category_id:'', stock_quantity:'', sizes:'', colors:'', images:'', is_featured: false, is_active: true };

export default function AdminProducts() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null); // null | 'add' | product_obj
  const [form, setForm]         = useState(EMPTY_PRODUCT);
  const [saving, setSaving]     = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.get('/products?limit=100', token),
        api.get('/products/categories/all', token),
      ]);
      setProducts(p.products || []);
      setCategories(Array.isArray(c) ? c : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => { setForm(EMPTY_PRODUCT); setModal('add'); };
  const openEdit = (p) => {
    setForm({
      ...p,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(',') : (p.sizes || ''),
      colors: Array.isArray(p.colors) ? p.colors.join(',') : (p.colors || ''),
      images: Array.isArray(p.images) ? p.images.join(',') : (p.images || ''),
    });
    setModal(p);
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveProduct = async () => {
    if (!form.name || !form.price) { showToast('Name and price are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        colors: form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        images: form.images ? form.images.split(',').map(i => i.trim()).filter(Boolean) : [],
      };
      if (modal === 'add') {
        await api.post('/admin/products', payload, token);
        showToast('Product created ✓');
      } else {
        await api.patch(`/admin/products/${modal.id}`, payload, token);
        showToast('Product updated ✓');
      }
      setModal(null);
      fetchProducts();
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`, token);
      showToast('Product deleted');
      fetchProducts();
    } catch (err) { showToast(err.message); }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search)
  );

  return (
    <div>
      <div className="admin-page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
        <div><h1>Products</h1><p>Manage your product catalog</p></div>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <input className="admin-search" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="admin-empty">No products found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>
                      {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{width:44,height:56,objectFit:'cover',background:'#f0f0f0'}} />}
                    </td>
                    <td><strong>{p.name}</strong></td>
                    <td style={{color:'#888',fontSize:12}}>{p.category_name || '—'}</td>
                    <td>
                      {p.sale_price ? (
                        <><span style={{textDecoration:'line-through',color:'#aaa',marginRight:4}}>${p.price}</span><span style={{color:'#dc2626'}}>${p.sale_price}</span></>
                      ) : `$${p.price}`}
                    </td>
                    <td>
                      <span style={{color: p.stock_quantity === 0 ? '#dc2626' : p.stock_quantity <= 5 ? '#d97706' : '#16a34a', fontWeight:600}}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>{p.is_featured ? '⭐' : '—'}</td>
                    <td><span className={`badge badge--${p.is_active ? 'delivered' : 'cancelled'}`}>{p.is_active ? 'Active' : 'Hidden'}</span></td>
                    <td>
                      <div style={{display:'flex', gap:6}}>
                        <button className="admin-btn admin-btn--outline" onClick={() => openEdit(p)}>Edit</button>
                        <button className="admin-btn admin-btn--danger" onClick={() => deleteProduct(p.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth:680}}>
            <h2>{modal === 'add' ? 'Add New Product' : `Edit: ${modal.name}`}</h2>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Name *</label><input name="name" value={form.name} onChange={handleChange} placeholder="Product name" /></div>
              <div className="admin-form-group">
                <label>Category</label>
                <select name="category_id" value={form.category_id} onChange={handleChange}>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-form-group"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Product description..." /></div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Price *</label><input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="29.99" /></div>
              <div className="admin-form-group"><label>Sale Price</label><input name="sale_price" type="number" step="0.01" value={form.sale_price} onChange={handleChange} placeholder="Leave empty if no sale" /></div>
            </div>
            <div className="admin-form-group"><label>Stock Quantity</label><input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange} placeholder="0" /></div>
            <div className="admin-form-group"><label>Sizes (comma separated)</label><input name="sizes" value={form.sizes} onChange={handleChange} placeholder="XS,S,M,L,XL,XXL" /></div>
            <div className="admin-form-group"><label>Colors (comma separated)</label><input name="colors" value={form.colors} onChange={handleChange} placeholder="Black,White,Navy" /></div>
            <div className="admin-form-group"><label>Image URLs (comma separated)</label><textarea name="images" value={form.images} onChange={handleChange} rows={2} placeholder="https://..., https://..." /></div>
            <div style={{display:'flex', gap:24, marginBottom:8}}>
              <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer'}}>
                <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} style={{accentColor:'#1a1a1a'}} />
                Featured product
              </label>
              <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer'}}>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} style={{accentColor:'#1a1a1a'}} />
                Active (visible)
              </label>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn--outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={saveProduct} disabled={saving}>
                {saving ? 'Saving...' : modal === 'add' ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
