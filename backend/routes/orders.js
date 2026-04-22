const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');

async function pushOrderToExternal(orderData) {
  try {
    await fetch('https://api.example.com/orders', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${process.env.API_KEY}`, 'X-Server-ID': process.env.SERVER_ID },
      body: JSON.stringify(orderData),
    });
  } catch (err) { console.error('External sync failed:', err.message); }
}

router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { items, shipping_address, payment_method, guest_email, notes } = req.body;
    const user_id = req.user?.id || null;
    if (!items?.length)    return res.status(400).json({ error: 'No items in order' });
    if (!shipping_address) return res.status(400).json({ error: 'Shipping address required' });

    let subtotal = 0;
    const enrichedItems = [];
    for (const item of items) {
      const [rows] = await conn.execute('SELECT id, name, price, sale_price, stock_quantity FROM products WHERE id = $1 AND is_active = true', [item.product_id]);
      if (!rows.length) throw new Error(`Product ${item.product_id} not found`);
      const product = rows[0];
      if (product.stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
      const unit_price = product.sale_price || product.price;
      const item_sub   = unit_price * item.quantity;
      subtotal += item_sub;
      enrichedItems.push({ ...item, product_name: product.name, product_price: unit_price, subtotal: item_sub });
    }
    const shipping_cost = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + shipping_cost;

    const [orderResult] = await conn.execute(
      'INSERT INTO orders (user_id, guest_email, subtotal, shipping_cost, total, shipping_address, payment_method, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [user_id, guest_email||null, subtotal, shipping_cost, total, JSON.stringify(shipping_address), payment_method||'card', notes||null]
    );
    const order_id = orderResult[0]?.id;

    for (const item of enrichedItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, size, color, quantity, subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [order_id, item.product_id, item.product_name, item.product_price, item.size||null, item.color||null, item.quantity, item.subtotal]
      );
      await conn.execute('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }
    await conn.commit();
    pushOrderToExternal({ order_id, user_id, total, items: enrichedItems, shipping_address });
    res.status(201).json({ message: 'Order placed successfully', order_id, total });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message || 'Order failed' });
  } finally { conn.release(); }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const [orders] = await db.execute('SELECT id, status, total, payment_status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    for (const order of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [orders] = await db.execute('SELECT * FROM orders WHERE id = $1 AND (user_id = $2 OR $3 = \'admin\')', [req.params.id, req.user.id, req.user.role]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    res.json({ ...orders[0], items });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

module.exports = router;
