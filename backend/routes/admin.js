// backend/routes/admin.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authenticate, adminOnly);

// ── GET /api/admin/stats ─────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [[revenue]]   = await db.execute(`SELECT COALESCE(SUM(total),0) AS total_revenue FROM orders WHERE status != 'cancelled'`);
    const [[orders]]    = await db.execute(`SELECT COUNT(*) AS total_orders FROM orders`);
    const [[products]]  = await db.execute(`SELECT COUNT(*) AS total_products FROM products WHERE is_active = true`);
    const [[lowStock]]  = await db.execute(`SELECT COUNT(*) AS low_stock FROM products WHERE stock_quantity <= 5 AND is_active = true`);
    const [[customers]] = await db.execute(`SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'`);
    const [[openTickets]]= await db.execute(`SELECT COUNT(*) AS open_tickets FROM support_messages WHERE status = 'open'`);

    res.json({
      total_revenue:   parseFloat(revenue.total_revenue),
      total_orders:    orders.total_orders,
      total_products:  products.total_products,
      low_stock:       lowStock.low_stock,
      total_customers: customers.total_customers,
      open_tickets:    openTickets.open_tickets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET /api/admin/orders ────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT o.*,
             u.first_name, u.last_name, u.email,
             COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ` AND o.status = ?`; params.push(status); }
    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [orders] = await db.execute(query, params);

    // Parse JSON shipping_address
    const parsed = orders.map(o => ({
      ...o,
      shipping_address: typeof o.shipping_address === 'string'
        ? JSON.parse(o.shipping_address) : o.shipping_address,
    }));

    res.json({ orders: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── GET /api/admin/orders/:id ────────────────────────────
router.get('/orders/:id', async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, u.first_name, u.last_name, u.email
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`, [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });

    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    const order   = orders[0];
    order.items   = items;
    order.shipping_address = typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address) : order.shipping_address;

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ── PATCH /api/admin/orders/:id/status ──────────────────
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','processing','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await db.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ── GET /api/admin/products ──────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const [products] = await db.execute(`
      SELECT p.*, c.name AS category_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    const parsed = products.map(p => ({
      ...p,
      sizes:  typeof p.sizes  === 'string' ? JSON.parse(p.sizes)  : p.sizes,
      colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    }));
    res.json({ products: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── POST /api/admin/products ─────────────────────────────
router.post('/products', async (req, res) => {
  try {
    const { name, description, price, sale_price, category_id, stock_quantity, sizes, colors, images, is_featured, is_active } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

    const [result] = await db.execute(
      `INSERT INTO products (name, description, price, sale_price, category_id, stock_quantity, sizes, colors, images, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description || null, price, sale_price || null,
        category_id || null, stock_quantity || 0,
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        JSON.stringify(images || []),
        is_featured ? 1 : 0,
        is_active !== false ? 1 : 0,
      ]
    );
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ── PATCH /api/admin/products/:id ───────────────────────
router.patch('/products/:id', async (req, res) => {
  try {
    const { name, description, price, sale_price, category_id, stock_quantity, sizes, colors, images, is_featured, is_active } = req.body;

    await db.execute(
      `UPDATE products SET
        name = ?, description = ?, price = ?, sale_price = ?,
        category_id = ?, stock_quantity = ?, sizes = ?, colors = ?,
        images = ?, is_featured = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name, description || null, price, sale_price || null,
        category_id || null, stock_quantity || 0,
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        JSON.stringify(images || []),
        is_featured ? 1 : 0,
        is_active !== false ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ── DELETE /api/admin/products/:id ──────────────────────
router.delete('/products/:id', async (req, res) => {
  try {
    // Soft delete — just hide it
    await db.execute('UPDATE products SET is_active = false WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ── GET /api/admin/customers ─────────────────────────────
router.get('/customers', async (req, res) => {
  try {
    const [customers] = await db.execute(`
      SELECT
        u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.created_at,
        COUNT(DISTINCT o.id)  AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

module.exports = router;
