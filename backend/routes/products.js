// backend/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/products  - List all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, min_price, max_price, sort, page = 1, limit = 12 } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }
    if (featured === 'true') {
      query += ' AND p.is_featured = 1';
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (min_price) { query += ' AND p.price >= ?'; params.push(min_price); }
    if (max_price) { query += ' AND p.price <= ?'; params.push(max_price); }

    const sortMap = {
      'price_asc': 'p.price ASC',
      'price_desc': 'p.price DESC',
      'newest': 'p.created_at DESC',
      'name': 'p.name ASC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [products] = await db.execute(query, params);

    // Parse JSON fields
    const parsed = products.map(p => ({
      ...p,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
      colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    }));

    res.json({ products: parsed, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    const p = rows[0];
    res.json({
      ...p,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
      colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products/categories/all
router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
