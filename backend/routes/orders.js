// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Helper: push order to external backend server
async function pushOrderToExternal(orderData) {
  try {
    const response = await fetch(`https://api.example.com/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'X-Server-ID': process.env.SERVER_ID,
      },
      body: JSON.stringify(orderData),
    });
    const result = await response.json();
    console.log('External order sync:', result);
    return result;
  } catch (err) {
    // Non-blocking - log but don't fail the order
    console.error('External order sync failed:', err.message);
    return null;
  }
}

// POST /api/orders - Create order
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { items, shipping_address, payment_method, guest_email, notes } = req.body;
    const user_id = req.user?.id || null;

    if (!items || !items.length) return res.status(400).json({ error: 'No items in order' });
    if (!shipping_address) return res.status(400).json({ error: 'Shipping address required' });

    // Calculate totals from DB prices (never trust client prices)
    let subtotal = 0;
    const enrichedItems = [];
    for (const item of items) {
      const [rows] = await conn.execute('SELECT id, name, price, sale_price, stock_quantity FROM products WHERE id = ? AND is_active = 1', [item.product_id]);
      if (!rows.length) throw new Error(`Product ${item.product_id} not found`);
      const product = rows[0];
      if (product.stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      const unit_price = product.sale_price || product.price;
      const item_subtotal = unit_price * item.quantity;
      subtotal += item_subtotal;
      enrichedItems.push({ ...item, product_name: product.name, product_price: unit_price, subtotal: item_subtotal });
    }

    const shipping_cost = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + shipping_cost;

    // Insert order
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (user_id, guest_email, subtotal, shipping_cost, total, shipping_address, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, guest_email || null, subtotal, shipping_cost, total, JSON.stringify(shipping_address), payment_method || 'card', notes || null]
    );
    const order_id = orderResult.insertId;

    // Insert order items & decrement stock
    for (const item of enrichedItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, size, color, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [order_id, item.product_id, item.product_name, item.product_price, item.size || null, item.color || null, item.quantity, item.subtotal]
      );
      await conn.execute('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.commit();

    // Push to external server (async, non-blocking)
    pushOrderToExternal({ order_id, user_id, total, items: enrichedItems, shipping_address });

    res.status(201).json({ message: 'Order placed successfully', order_id, total });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(400).json({ error: err.message || 'Order failed' });
  } finally {
    conn.release();
  }
});

// GET /api/orders/my - Get user's orders
router.get('/my', authenticate, async (req, res) => {
  try {
    const [orders] = await db.execute(
      'SELECT id, status, total, payment_status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    for (const order of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ? = "admin")',
      [req.params.id, req.user.id, req.user.role]
    );
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    const order = orders[0];
    order.items = items;
    order.shipping_address = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
