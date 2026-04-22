const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const [[revenue]]   = await db.execute(`SELECT COALESCE(SUM(total),0) AS total_revenue FROM orders WHERE status != 'cancelled'`);
    const [[orders]]    = await db.execute(`SELECT COUNT(*) AS total_orders FROM orders`);
    const [[products]]  = await db.execute(`SELECT COUNT(*) AS total_products FROM products WHERE is_active = true`);
    const [[lowStock]]  = await db.execute(`SELECT COUNT(*) AS low_stock FROM products WHERE stock_quantity <= 5 AND is_active = true`);
    const [[customers]] = await db.execute(`SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'`);
    const [[tickets]]   = await db.execute(`SELECT COUNT(*) AS open_tickets FROM support_messages WHERE status = 'open'`);
    res.json({
      total_revenue:   parseFloat(revenue.total_revenue),
      total_orders:    Number(orders.total_orders),
      total_products:  Number(products.total_products),
      low_stock:       Number(lowStock.low_stock),
      total_customers: Number(customers.total_customers),
      open_tickets:    Number(tickets.open_tickets),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch stats' }); }
});

router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = `SELECT o.*, u.first_name, u.last_name, u.email, COUNT(oi.id) AS item_count
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id WHERE 1=1`;
    const params = [];
    let i = 1;
    if (status) { query += ` AND o.status = $${i++}`; params.push(status); }
    query += ` GROUP BY o.id, u.first_name, u.last_name, u.email ORDER BY o.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
    const [orders] = await db.execute(query, params);
    res.json({ orders });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const [orders] = await db.execute(`SELECT o.*, u.first_name, u.last_name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','processing','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await db.execute('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) { res.status(500).json({ error: 'Failed to update order' }); }
});

router.get('/products', async (req, res) => {
  try {
    const [products] = await db.execute(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`);
    res.json({ products });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch products' }); }
});

router.post('/products', async (req, res) => {
  try {
    const { name, description, price, sale_price, category_id, stock_quantity, sizes, colors, images, is_featured, is_active } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const [result] = await db.execute(
      `INSERT INTO products (name,description,price,sale_price,category_id,stock_quantity,sizes,colors,images,is_featured,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [name, description||null, price, sale_price||null, category_id||null, stock_quantity||0, JSON.stringify(sizes||[]), JSON.stringify(colors||[]), JSON.stringify(images||[]), is_featured?true:false, is_active!==false]
    );
    res.status(201).json({ message: 'Product created', id: result[0]?.id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create product' }); }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const { name, description, price, sale_price, category_id, stock_quantity, sizes, colors, images, is_featured, is_active } = req.body;
    await db.execute(
      `UPDATE products SET name=$1,description=$2,price=$3,sale_price=$4,category_id=$5,stock_quantity=$6,sizes=$7,colors=$8,images=$9,is_featured=$10,is_active=$11,updated_at=NOW() WHERE id=$12`,
      [name, description||null, price, sale_price||null, category_id||null, stock_quantity||0, JSON.stringify(sizes||[]), JSON.stringify(colors||[]), JSON.stringify(images||[]), is_featured?true:false, is_active!==false, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) { res.status(500).json({ error: 'Failed to update product' }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await db.execute('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete product' }); }
});

router.get('/customers', async (req, res) => {
  try {
    const [customers] = await db.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.created_at,
        COUNT(DISTINCT o.id) AS order_count, COALESCE(SUM(o.total),0) AS total_spent
      FROM users u LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.created_at
      ORDER BY u.created_at DESC`);
    res.json(customers);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch customers' }); }
});

module.exports = router;
