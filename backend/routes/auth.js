const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.post('/register', [
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { first_name, last_name, email, password, phone } = req.body;
    const [existing] = await db.execute('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [first_name, last_name, email, password_hash, phone || null]
    );
    const newId = result[0]?.id;
    const token = jwt.sign({ id: newId, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.status(201).json({ token, user: { id: newId, first_name, last_name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
