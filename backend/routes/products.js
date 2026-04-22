const express = require('express');
const router  = express.Router();
const db      = require('../config/database');

router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, featured, search, min_price, max_price, sort, page = 1, limit = 12 } = req.query;
    let query = `SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true`;
    const params = [];
    if (category)          { query += ' AND c.slug = ?';                                   params.push(category); }
    if (featured === 'true'){ query += ' AND p.is_featured = true'; }
    if (search)            { query += ' AND (p.name ILIKE ? OR p.description ILIKE ?)';   params.push(`%${search}%`, `%${search}%`); }
    if (min_price)         { query += ' AND p.price >= ?';                                 params.push(min_price); }
    if (max_price)         { query += ' AND p.price <= ?';                                 params.push(max_price); }
    const sortMap = { price_asc:'p.price ASC', price_desc:'p.price DESC', newest:'p.created_at DESC', name:'p.name ASC' };
    query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const [products] = await db.execute(query, params);
    res.json({ products, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = true`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
